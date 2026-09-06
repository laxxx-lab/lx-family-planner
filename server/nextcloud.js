import { createHash, randomUUID } from 'crypto';
import { isIP } from 'net';
import { XMLParser } from 'fast-xml-parser';
import { parseICalendar } from '../shared/icsCalendar.js';
import { eventAudienceIds } from '../shared/calendarAudience.js';
import {
  calendarRecurrenceRRule,
  normalizeCalendarRecurrence
} from '../shared/calendarRecurrence.js';
import {
  deleteIntegrationSyncItem,
  deleteRecord,
  listIntegrationSyncItems,
  listRecords,
  saveIntegrationSyncItem,
  upsertRecord
} from './database.js';
import {
  closePinnedResponse,
  fetchPinnedTarget,
  resolvePinnedTarget
} from './pinnedFetch.js';

const PROVIDER = 'nextcloud';
const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_CALENDAR_ITEMS = 5000;
const XML = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true
});

function asArray(value) {
  if (value === undefined || value === null) return [];
  return Array.isArray(value) ? value : [value];
}

function clean(value, fallback = '', max = 1000) {
  const result = String(value ?? '').trim();
  return (result || fallback).slice(0, max);
}

function httpError(message, statusCode = 502) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

export function normalizeNextcloudBaseUrl(value, label = 'Nextcloud-Adresse') {
  let url;
  try {
    url = new URL(clean(value, '', 2000));
  } catch {
    throw httpError(`${label} ist ungültig.`, 400);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw httpError(`${label} muss mit http:// oder https:// beginnen.`, 400);
  }
  if (url.username || url.password || url.search || url.hash) {
    throw httpError(
      `${label} darf keine Zugangsdaten oder Parameter enthalten.`,
      400
    );
  }
  url.pathname = url.pathname.replace(/\/+$/, '');
  return url.href.replace(/\/$/, '');
}

export function normalizeNextcloudFolder(value) {
  const pieces = clean(value, 'LX Family', 500)
    .replaceAll('\\', '/')
    .split('/')
    .map(piece => piece.trim())
    .filter(Boolean);
  if (
    !pieces.length ||
    pieces.length > 8 ||
    pieces.some(piece => piece === '.' || piece === '..')
  ) {
    throw httpError('Der Nextcloud-Ordner ist ungültig.', 400);
  }
  return pieces.join('/');
}

export function normalizeNextcloudRelativePath(value = '') {
  const raw = clean(value, '', 2000).replaceAll('\\', '/');
  if (!raw) return '';
  const pieces = raw
    .split('/')
    .map(piece => piece.trim())
    .filter(Boolean);
  if (
    pieces.length > 24 ||
    pieces.some(piece =>
      piece === '.' ||
      piece === '..' ||
      /[\u0000-\u001f]/.test(piece)
    )
  ) {
    throw httpError('Der Cloud-Pfad ist ungültig.', 400);
  }
  return pieces.join('/');
}

function buildApiUrl(baseUrl, pathname) {
  const base = new URL(`${baseUrl.replace(/\/+$/, '')}/`);
  const relative = clean(pathname).replace(/^\/+/, '');
  return new URL(relative, base);
}

function buildRemoteUrl(baseUrl, href) {
  return new URL(clean(href), `${baseUrl.replace(/\/+$/, '')}/`);
}

function ipv4Parts(address) {
  if (isIP(address) !== 4) return null;
  return address.split('.').map(Number);
}

function blockedAddress(address) {
  const normalized = clean(address).toLowerCase();
  const mapped = normalized.startsWith('::ffff:')
    ? normalized.slice(7)
    : normalized;
  const parts = ipv4Parts(mapped);
  if (parts) {
    const [first, second] = parts;
    if (
      first === 0 ||
      first >= 224 ||
      (first === 169 && second === 254)
    ) {
      return true;
    }
    if (first === 127) {
      return process.env.NODE_ENV !== 'test';
    }
    return false;
  }
  if (isIP(normalized) === 6) {
    if (normalized === '::1') return process.env.NODE_ENV !== 'test';
    return (
      normalized === '::' ||
      normalized.startsWith('fe8') ||
      normalized.startsWith('fe9') ||
      normalized.startsWith('fea') ||
      normalized.startsWith('feb') ||
      normalized.startsWith('ff')
    );
  }
  return false;
}

async function validateTarget(url) {
  try {
    return await resolvePinnedTarget(url, { isBlocked: blockedAddress });
  } catch (error) {
    if (error?.code === 'PINNED_TARGET_BLOCKED') {
      throw httpError(
        'Diese Nextcloud-Adresse zeigt auf eine gesperrte Geräteadresse.',
        400
      );
    }
    if (error?.code === 'PINNED_TARGET_NOT_FOUND') {
      throw httpError('Der Nextcloud-Server konnte nicht gefunden werden.', 400);
    }
    throw error;
  }
}

async function readLimitedText(response) {
  const announced = Number(response.headers.get('content-length') || 0);
  if (announced > MAX_RESPONSE_BYTES) {
    throw httpError('Die Antwort von Nextcloud ist zu groß.', 413);
  }
  if (!response.body) return '';
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_RESPONSE_BYTES) {
      await reader.cancel();
      throw httpError('Die Antwort von Nextcloud ist zu groß.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readLimitedBuffer(response, maximumBytes = MAX_FILE_BYTES) {
  const announced = Number(response.headers.get('content-length') || 0);
  if (announced > maximumBytes) {
    throw httpError('Die Datei ist für die App-Ansicht zu groß.', 413);
  }
  if (!response.body) return Buffer.alloc(0);
  const reader = response.body.getReader();
  const chunks = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maximumBytes) {
      await reader.cancel();
      throw httpError('Die Datei ist für die App-Ansicht zu groß.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function authorizationHeader(username, appPassword) {
  return `Basic ${Buffer.from(
    `${username}:${appPassword}`,
    'utf8'
  ).toString('base64')}`;
}

export async function nextcloudRequest(
  connection,
  pathname,
  {
    method = 'GET',
    headers = {},
    body,
    expectedStatuses = [200],
    remoteHref = false
  } = {}
) {
  const url = remoteHref
    ? buildRemoteUrl(connection.baseUrl, pathname)
    : buildApiUrl(connection.baseUrl, pathname);
  const target = await validateTarget(url);
  let request;
  try {
    request = await fetchPinnedTarget(target, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: authorizationHeader(
          connection.username,
          connection.appPassword
        ),
        'User-Agent': `LX-Family-Planner/${connection.appVersion || '1'}`,
        'OCS-APIRequest': 'true',
        ...headers
      },
      body
    });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw httpError(
      'Nextcloud ist unter dieser Adresse gerade nicht erreichbar.'
    );
  }
  try {
    const response = request.response;
    const text = response.status === 204 ? '' : await readLimitedText(response);
    if (!expectedStatuses.includes(response.status)) {
      const message =
        response.status === 401 || response.status === 403
          ? 'Nextcloud hat Benutzername oder App-Passwort abgelehnt.'
          : response.status === 404
            ? 'Die angeforderte Nextcloud-Funktion wurde nicht gefunden.'
            : `Nextcloud meldet Fehler ${response.status}.`;
      const error = httpError(message, response.status === 401 ? 401 : 502);
      error.remoteStatus = response.status;
      error.responseText = text.slice(0, 1000);
      throw error;
    }
    return { response, text, url };
  } finally {
    await closePinnedResponse(request);
  }
}

function propFromResponse(response) {
  for (const propstat of asArray(response?.propstat)) {
    const status = clean(propstat?.status);
    if (!status || status.includes(' 200 ')) return propstat?.prop || {};
  }
  return {};
}

function calendarComponents(prop) {
  const componentSet = prop?.['supported-calendar-component-set'];
  return asArray(componentSet?.comp)
    .map(component => clean(component?.['@_name']).toUpperCase())
    .filter(Boolean);
}

function hasResourceType(prop, type) {
  const resources = prop?.resourcetype;
  return Boolean(resources && Object.hasOwn(resources, type));
}

function parseMultiStatus(text) {
  let parsed;
  try {
    parsed = XML.parse(text);
  } catch {
    throw httpError('Nextcloud hat eine unlesbare DAV-Antwort gesendet.');
  }
  return asArray(parsed?.multistatus?.response);
}

export async function fetchNextcloudAccount(connection) {
  const { text } = await nextcloudRequest(
    connection,
    'ocs/v2.php/cloud/user?format=json',
    {
      headers: { Accept: 'application/json' }
    }
  );
  let data;
  try {
    data = JSON.parse(text)?.ocs?.data;
  } catch {
    data = null;
  }
  const userId = clean(data?.id, '', 200);
  if (!userId) {
    throw httpError(
      'Nextcloud hat keine eindeutige Benutzerkennung zurückgegeben.'
    );
  }
  const quota = data?.quota && typeof data.quota === 'object'
    ? data.quota
    : {};
  const storageNumber = value => {
    const number = Number(value);
    return Number.isFinite(number) ? Math.max(0, number) : 0;
  };
  return {
    userId,
    displayName: clean(data?.displayname, userId, 200),
    email: clean(data?.email, '', 300),
    storage: {
      free: storageNumber(quota.free),
      used: storageNumber(quota.used),
      total: storageNumber(quota.total),
      relative: Math.max(
        0,
        Math.min(100, storageNumber(quota.relative))
      ),
      quota: storageNumber(quota.quota)
    }
  };
}

export async function discoverNextcloudCalendars(connection, userId) {
  const calendarHome = `/remote.php/dav/calendars/${encodeURIComponent(
    userId
  )}/`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <c:supported-calendar-component-set/>
    <a:calendar-color/>
    <d:getetag/>
  </d:prop>
</d:propfind>`;
  const { text } = await nextcloudRequest(connection, calendarHome, {
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1'
    },
    body,
    expectedStatuses: [207]
  });
  return parseMultiStatus(text)
    .map(response => {
      const prop = propFromResponse(response);
      return {
        href: clean(response?.href, '', 2000),
        name: clean(prop?.displayname, 'Kalender', 200),
        color: clean(prop?.['calendar-color'], '#2563eb', 30),
        components: calendarComponents(prop),
        isCalendar: hasResourceType(prop, 'calendar')
      };
    })
    .filter(calendar => calendar.href && calendar.isCalendar)
    .filter(calendar =>
      calendar.components.includes('VEVENT') ||
      calendar.components.includes('VTODO')
    )
    .map(({ isCalendar, ...calendar }) => calendar);
}

function escapeXml(value) {
  return clean(value, '', 300)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

export async function ensureNextcloudCalendar(
  connection,
  userId,
  displayName = 'LX Family'
) {
  const existing = await discoverNextcloudCalendars(connection, userId);
  if (existing.some(calendar => calendar.components.includes('VEVENT'))) {
    return existing;
  }

  const calendarHref =
    `/remote.php/dav/calendars/${encodeURIComponent(userId)}/lx-family/`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<c:mkcalendar xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/">
  <d:set>
    <d:prop>
      <d:displayname>${escapeXml(displayName)}</d:displayname>
      <a:calendar-color>#15998b</a:calendar-color>
      <c:supported-calendar-component-set>
        <c:comp name="VEVENT"/>
      </c:supported-calendar-component-set>
    </d:prop>
  </d:set>
</c:mkcalendar>`;
  await nextcloudRequest(connection, calendarHref, {
    method: 'MKCALENDAR',
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    body,
    expectedStatuses: [201, 405]
  });
  return discoverNextcloudCalendars(connection, userId);
}

function parseOcsJson(text) {
  let response;
  try {
    response = JSON.parse(text)?.ocs;
  } catch {
    response = null;
  }
  if (!response) {
    throw httpError('Nextcloud hat eine unlesbare OCS-Antwort gesendet.');
  }
  const statusCode = Number(response.meta?.statuscode || 0);
  const status = clean(response.meta?.status).toLowerCase();
  if (
    status === 'failure' ||
    (statusCode && statusCode !== 100 && statusCode !== 200)
  ) {
    throw httpError(
      clean(
        response.meta?.message,
        'Nextcloud konnte das Familienkonto nicht vorbereiten.',
        300
      ),
      statusCode === 102 ? 409 : 502
    );
  }
  return response.data;
}

async function ocsJsonRequest(connection, pathname, options = {}) {
  const { text } = await nextcloudRequest(connection, pathname, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...(options.headers || {})
    },
    expectedStatuses: options.expectedStatuses || [200, 201]
  });
  return parseOcsJson(text);
}

export async function provisionNextcloudUser({
  baseUrl,
  adminUsername,
  adminPassword,
  userId,
  displayName,
  password,
  quota = '10GB',
  appVersion = '1'
}) {
  const normalizedUserId = clean(userId, '', 64).toLowerCase();
  const normalizedDisplayName = clean(displayName, 'LX Family', 200);
  const normalizedPassword = clean(password, '', 1000);
  const normalizedQuota = clean(quota, '10GB', 80);
  if (
    !/^[a-z0-9][a-z0-9._-]{2,63}$/.test(normalizedUserId) ||
    normalizedPassword.length < 24
  ) {
    throw httpError('Das automatische Nextcloud-Konto ist ungültig.', 400);
  }

  const adminConnection = {
    baseUrl,
    username: clean(adminUsername, '', 300),
    appPassword: clean(adminPassword, '', 1000),
    appVersion
  };
  const userPath =
    `ocs/v2.php/cloud/users/${encodeURIComponent(normalizedUserId)}?format=json`;
  const search = await ocsJsonRequest(
    adminConnection,
    `ocs/v2.php/cloud/users?format=json&search=${encodeURIComponent(
      normalizedUserId
    )}&limit=100`
  );
  const exists = Array.isArray(search?.users) &&
    search.users.some(user => clean(user).toLowerCase() === normalizedUserId);

  if (exists) {
    await ocsJsonRequest(adminConnection, userPath, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: 'password',
        value: normalizedPassword
      }).toString()
    });
  } else {
    await ocsJsonRequest(
      adminConnection,
      'ocs/v2.php/cloud/users?format=json',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          userid: normalizedUserId,
          password: normalizedPassword,
          displayName: normalizedDisplayName
        }).toString()
      }
    );
  }

  await ocsJsonRequest(adminConnection, userPath, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      key: 'quota',
      value: normalizedQuota
    }).toString()
  });

  const userConnection = {
    baseUrl,
    username: normalizedUserId,
    appPassword: normalizedPassword,
    appVersion
  };
  const appPasswordData = await ocsJsonRequest(
    userConnection,
    'ocs/v2.php/core/getapppassword?format=json'
  );
  const appPassword = clean(
    appPasswordData?.apppassword || appPasswordData?.appPassword,
    '',
    1000
  );
  if (!appPassword) {
    throw httpError(
      'Nextcloud hat kein App-Passwort für LX Family erstellt.'
    );
  }
  return {
    userId: normalizedUserId,
    displayName: normalizedDisplayName,
    quota: normalizedQuota,
    appPassword
  };
}

export async function revokeNextcloudAppPassword(connection) {
  try {
    await nextcloudRequest(
      connection,
      'ocs/v2.php/core/apppassword?format=json',
      {
        method: 'DELETE',
        headers: { Accept: 'application/json' },
        expectedStatuses: [200]
      }
    );
    return true;
  } catch {
    return false;
  }
}

export async function inspectNextcloud(connection) {
  const { text: statusText } = await nextcloudRequest(
    connection,
    'status.php',
    { headers: { Accept: 'application/json' } }
  );
  let status;
  try {
    status = JSON.parse(statusText);
  } catch {
    throw httpError('Unter dieser Adresse läuft keine kompatible Nextcloud.');
  }
  if (!status?.installed || status?.maintenance) {
    throw httpError(
      status?.maintenance
        ? 'Nextcloud befindet sich gerade im Wartungsmodus.'
        : 'Nextcloud ist noch nicht fertig eingerichtet.'
    );
  }
  const account = await fetchNextcloudAccount(connection);
  const calendars = await discoverNextcloudCalendars(
    connection,
    account.userId
  );
  return {
    ...account,
    version: clean(status.versionstring, status.version, 80),
    calendars
  };
}

function encodedFilePath(userId, folder = '', relativePath = '') {
  const pieces = [
    'remote.php',
    'dav',
    'files',
    encodeURIComponent(userId),
    ...normalizeNextcloudFolder(folder)
      .split('/')
      .map(piece => encodeURIComponent(piece)),
    ...normalizeNextcloudRelativePath(relativePath)
      .split('/')
      .filter(Boolean)
      .map(piece => encodeURIComponent(piece))
  ];
  return pieces.join('/');
}

export async function ensureNextcloudFolder(connection, userId, folder) {
  const pieces = normalizeNextcloudFolder(folder).split('/');
  let current = '';
  for (const piece of pieces) {
    current = current ? `${current}/${piece}` : piece;
    await nextcloudRequest(
      connection,
      encodedFilePath(userId, current),
      {
        method: 'MKCOL',
        expectedStatuses: [201, 405]
      }
    );
  }
  return normalizeNextcloudFolder(folder);
}

export async function uploadNextcloudFile(
  connection,
  userId,
  folder,
  fileName,
  content,
  contentType = 'application/octet-stream'
) {
  await ensureNextcloudFolder(connection, userId, folder);
  const safeName = clean(fileName, `datei-${Date.now()}`, 240)
    .replace(/[\\/:*?"<>|]/g, '-');
  const path = `${encodedFilePath(userId, folder)}/${encodeURIComponent(
    safeName
  )}`;
  const { response } = await nextcloudRequest(connection, path, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'OC-Total-Length': String(Buffer.byteLength(content))
    },
    body: content,
    expectedStatuses: [201, 204]
  });
  return {
    fileName: safeName,
    etag: clean(response.headers.get('etag'), '', 300)
  };
}

function cleanCloudEntryName(value, fallback = 'Datei') {
  const name = clean(value, fallback, 240)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/^\.+$/, fallback);
  return name || fallback;
}

export async function listNextcloudFiles(
  connection,
  userId,
  folder,
  relativePath = ''
) {
  const rootFolder = normalizeNextcloudFolder(folder);
  const currentPath = normalizeNextcloudRelativePath(relativePath);
  await ensureNextcloudFolder(connection, userId, rootFolder);
  const requestPath = encodedFilePath(userId, rootFolder, currentPath);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<d:propfind xmlns:d="DAV:">
  <d:prop>
    <d:displayname/>
    <d:resourcetype/>
    <d:getcontentlength/>
    <d:getcontenttype/>
    <d:getlastmodified/>
    <d:getetag/>
  </d:prop>
</d:propfind>`;
  const { text } = await nextcloudRequest(connection, requestPath, {
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1'
    },
    body,
    expectedStatuses: [207]
  });
  return parseMultiStatus(text)
    .slice(1)
    .map(response => {
      const prop = propFromResponse(response);
      const href = clean(response?.href, '', 4000);
      let hrefName = '';
      try {
        const pathname = new URL(href, 'https://nextcloud.invalid').pathname;
        hrefName = decodeURIComponent(
          pathname.replace(/\/+$/, '').split('/').pop() || ''
        );
      } catch {
        hrefName = '';
      }
      const name = cleanCloudEntryName(
        prop?.displayname || hrefName,
        'Datei'
      );
      const isFolder = hasResourceType(prop, 'collection');
      const entryPath = normalizeNextcloudRelativePath(
        currentPath ? `${currentPath}/${name}` : name
      );
      return {
        name,
        path: entryPath,
        type: isFolder ? 'folder' : 'file',
        mimeType: clean(
          prop?.getcontenttype,
          isFolder ? 'inode/directory' : 'application/octet-stream',
          200
        ),
        size: Math.max(0, Number(prop?.getcontentlength || 0)),
        modifiedAt: prop?.getlastmodified
          ? new Date(prop.getlastmodified).getTime() || 0
          : 0,
        etag: clean(prop?.getetag, '', 300)
      };
    })
    .sort((left, right) =>
      left.type === right.type
        ? left.name.localeCompare(right.name, 'de', {
            numeric: true,
            sensitivity: 'base'
          })
        : left.type === 'folder'
          ? -1
          : 1
    );
}

export async function createNextcloudFolder(
  connection,
  userId,
  folder,
  relativePath,
  name
) {
  const safeName = cleanCloudEntryName(name, '');
  if (!safeName) {
    throw httpError('Bitte gib dem neuen Ordner einen Namen.', 400);
  }
  const currentPath = normalizeNextcloudRelativePath(relativePath);
  const targetPath = normalizeNextcloudRelativePath(
    currentPath ? `${currentPath}/${safeName}` : safeName
  );
  await ensureNextcloudFolder(connection, userId, folder);
  await nextcloudRequest(
    connection,
    encodedFilePath(userId, folder, targetPath),
    {
      method: 'MKCOL',
      expectedStatuses: [201]
    }
  );
  return {
    name: safeName,
    path: targetPath,
    type: 'folder',
    mimeType: 'inode/directory',
    size: 0,
    modifiedAt: Date.now(),
    etag: ''
  };
}

export async function uploadNextcloudUserFile(
  connection,
  userId,
  folder,
  relativePath,
  fileName,
  content,
  contentType = 'application/octet-stream'
) {
  const currentPath = normalizeNextcloudRelativePath(relativePath);
  const safeName = cleanCloudEntryName(
    fileName,
    `datei-${Date.now()}`
  );
  await ensureNextcloudFolder(connection, userId, folder);
  const parentPath = encodedFilePath(userId, folder, currentPath);
  const path = `${parentPath}/${encodeURIComponent(safeName)}`;
  const { response } = await nextcloudRequest(connection, path, {
    method: 'PUT',
    headers: {
      'Content-Type': clean(
        contentType,
        'application/octet-stream',
        200
      ),
      'OC-Total-Length': String(Buffer.byteLength(content))
    },
    body: content,
    expectedStatuses: [201, 204]
  });
  return {
    name: safeName,
    fileName: safeName,
    path: normalizeNextcloudRelativePath(
      currentPath ? `${currentPath}/${safeName}` : safeName
    ),
    type: 'file',
    mimeType: clean(
      contentType,
      'application/octet-stream',
      200
    ),
    size: Buffer.byteLength(content),
    modifiedAt: Date.now(),
    etag: clean(response.headers.get('etag'), '', 300)
  };
}

export async function deleteNextcloudEntry(
  connection,
  userId,
  folder,
  relativePath
) {
  const targetPath = normalizeNextcloudRelativePath(relativePath);
  if (!targetPath) {
    throw httpError('Der Familienordner selbst kann nicht gelöscht werden.', 400);
  }
  await nextcloudRequest(
    connection,
    encodedFilePath(userId, folder, targetPath),
    {
      method: 'DELETE',
      expectedStatuses: [204]
    }
  );
  return true;
}

export async function downloadNextcloudFile(
  connection,
  userId,
  folder,
  relativePath
) {
  const targetPath = normalizeNextcloudRelativePath(relativePath);
  if (!targetPath) {
    throw httpError('Bitte wähle eine Datei aus.', 400);
  }
  const url = buildApiUrl(
    connection.baseUrl,
    encodedFilePath(userId, folder, targetPath)
  );
  const target = await validateTarget(url);
  let request;
  try {
    request = await fetchPinnedTarget(target, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: authorizationHeader(
          connection.username,
          connection.appPassword
        ),
        'User-Agent': `LX-Family-Planner/${connection.appVersion || '1'}`
      }
    });
  } catch {
    throw httpError('Die Datei konnte gerade nicht aus Nextcloud geladen werden.');
  }
  try {
    const response = request.response;
    if (!response.ok) {
      throw httpError(
        response.status === 404
          ? 'Die Datei wurde nicht gefunden.'
          : `Nextcloud meldet Fehler ${response.status}.`,
        response.status === 404 ? 404 : 502
      );
    }
    return {
      content: await readLimitedBuffer(response),
      contentType: clean(
        response.headers.get('content-type'),
        'application/octet-stream',
        200
      ),
      etag: clean(response.headers.get('etag'), '', 300),
      fileName: cleanCloudEntryName(
        targetPath.split('/').pop(),
        'download'
      )
    };
  } finally {
    await closePinnedResponse(request);
  }
}

function unfoldIcs(value = '') {
  return String(value)
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .replace(/\r[ \t]/g, '');
}

function customIcsValue(content, name) {
  const match = unfoldIcs(content).match(
    new RegExp(`(?:^|\\r?\\n)${name}(?:;[^:]*)?:(.*?)(?:\\r?\\n|$)`, 'i')
  );
  return clean(match?.[1], '', 1000)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

function escapeIcs(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function icsStamp(date = new Date()) {
  return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsDate(value) {
  return clean(value).replaceAll('-', '');
}

function icsTime(value) {
  return `${clean(value, '09:00').replace(':', '')}00`;
}

function addOneDay(date) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + 1);
  return result.toISOString().slice(0, 10);
}

function serializeEvent(event, uid, timeZone) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'CALSCALE:GREGORIAN',
    'PRODID:-//LX Family//Family Cloud//DE',
    'BEGIN:VEVENT',
    `UID:${escapeIcs(uid)}`,
    `DTSTAMP:${icsStamp()}`,
    `LAST-MODIFIED:${icsStamp()}`
  ];
  if (event.allDay || !event.time) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(event.date)}`);
    lines.push(
      `DTEND;VALUE=DATE:${icsDate(event.endDate || addOneDay(event.date))}`
    );
  } else {
    lines.push(
      `DTSTART;TZID=${escapeIcs(timeZone)}:${icsDate(event.date)}T${icsTime(
        event.time
      )}`
    );
    if (event.endDate || event.endTime) {
      lines.push(
        `DTEND;TZID=${escapeIcs(timeZone)}:${icsDate(
          event.endDate || event.date
        )}T${icsTime(event.endTime || event.time)}`
      );
    }
  }
  lines.push(`SUMMARY:${escapeIcs(event.title || 'Familientermin')}`);
  if (event.location) lines.push(`LOCATION:${escapeIcs(event.location)}`);
  if (event.notes) lines.push(`DESCRIPTION:${escapeIcs(event.notes)}`);
  if (event.category) lines.push(`CATEGORIES:${escapeIcs(event.category)}`);
  const rrule = calendarRecurrenceRRule(event);
  if (rrule) lines.push(`RRULE:${rrule}`);
  lines.push(
    `X-LX-RECURRENCE:${escapeIcs(JSON.stringify({
      recurrenceRule: event.recurrenceRule || 'none',
      recurrenceInterval: event.recurrenceInterval || 1,
      recurrenceUnit: event.recurrenceUnit || 'weeks',
      recurrenceUntil: event.recurrenceUntil || ''
    }))}`
  );
  lines.push(`X-LX-FAMILY-ID:${escapeIcs(event.familyId || '')}`);
  lines.push(`X-LX-EVENT-ID:${escapeIcs(event.id || '')}`);
  lines.push(`X-LX-MEMBER-ID:${escapeIcs(event.memberId || 'all')}`);
  lines.push(
    `X-LX-MEMBER-IDS:${escapeIcs(JSON.stringify(eventAudienceIds(event)))}`
  );
  lines.push(`X-LX-HOUSEHOLD:${escapeIcs(event.household || 'familie')}`);
  lines.push('END:VEVENT', 'END:VCALENDAR', '');
  return lines.join('\r\n');
}

function eventContentHash(event) {
  return createHash('sha256')
    .update(JSON.stringify({
      title: clean(event?.title),
      date: clean(event?.date),
      time: clean(event?.time),
      allDay: Boolean(event?.allDay),
      endDate: clean(event?.endDate),
      endTime: clean(event?.endTime),
      location: clean(event?.location),
      notes: clean(event?.notes),
      category: clean(event?.category),
      memberId: clean(event?.memberId, 'all'),
      memberIds: eventAudienceIds(event),
      household: clean(event?.household, 'familie'),
      recurrenceRule: clean(event?.recurrenceRule, 'none'),
      recurrenceInterval: Math.max(1, Number(event?.recurrenceInterval) || 1),
      recurrenceUnit: clean(event?.recurrenceUnit, 'weeks'),
      recurrenceUntil: clean(event?.recurrenceUntil)
    }))
    .digest('hex');
}

function remoteEvent(
  resource,
  familyId,
  defaultMemberId,
  defaultMemberIds,
  timeZone,
  allowedMemberIds,
  provider = PROVIDER,
  sourceName = 'Nextcloud'
) {
  const parsed = parseICalendar(resource.calendarData, {
    targetTimeZone: timeZone,
    rangeStart: Date.now() - 45 * 86_400_000,
    rangeEnd: Date.now() + 10 * 365 * 86_400_000,
    maxEvents: 1
  })[0];
  if (!parsed) return null;
  const remoteMemberId = customIcsValue(
    resource.calendarData,
    'X-LX-MEMBER-ID'
  );
  let remoteRecurrence = {};
  try {
    const parsedRecurrence = JSON.parse(
      customIcsValue(resource.calendarData, 'X-LX-RECURRENCE') || '{}'
    );
    if (parsedRecurrence && typeof parsedRecurrence === 'object') {
      remoteRecurrence = parsedRecurrence;
    }
  } catch {
    remoteRecurrence = {};
  }
  let remoteMemberIds = [];
  try {
    const parsedMemberIds = JSON.parse(
      customIcsValue(resource.calendarData, 'X-LX-MEMBER-IDS') || '[]'
    );
    remoteMemberIds = Array.isArray(parsedMemberIds)
      ? [...new Set(parsedMemberIds
          .map(value => clean(value, '', 100))
          .filter(value => value && allowedMemberIds?.has(value)))]
      : [];
  } catch {
    remoteMemberIds = [];
  }
  const fallbackMemberId =
    remoteMemberId &&
    (remoteMemberId === 'all' || allowedMemberIds?.has(remoteMemberId))
      ? remoteMemberId
      : defaultMemberId || 'all';
  const fallbackMemberIds = Array.isArray(defaultMemberIds)
    ? [...new Set(defaultMemberIds
        .map(memberId => clean(memberId, '', 100))
        .filter(memberId => memberId && allowedMemberIds?.has(memberId)))]
    : fallbackMemberId === 'all'
      ? []
      : [fallbackMemberId];
  return {
    ...parsed,
    familyId,
    memberId: remoteMemberIds[0] || fallbackMemberIds[0] || fallbackMemberId,
    memberIds:
      remoteMemberIds.length
        ? remoteMemberIds
        : fallbackMemberIds,
    household:
      customIcsValue(resource.calendarData, 'X-LX-HOUSEHOLD') || 'familie',
    category:
      customIcsValue(resource.calendarData, 'CATEGORIES') ||
      sourceName,
    ...normalizeCalendarRecurrence(remoteRecurrence),
    syncUid: parsed.uid,
    syncHref: resource.href,
    syncManaged: true,
    syncProvider: provider,
    nextcloudUid: parsed.uid,
    nextcloudHref: resource.href,
    nextcloudManaged: true,
    source: provider,
    readOnly: false
  };
}

function eligibleLocalEvent(event, includeGrandparents, provider = PROVIDER) {
  return Boolean(
    event?.id &&
    event?.title &&
    event?.date &&
    !event.readOnly &&
    !event.sharedEventId &&
    !event.sharedOwnerFamilyId &&
    event.nextcloudExcluded !== true &&
    event.syncExcluded !== true &&
    (!event.syncProvider || event.syncProvider === provider) &&
    (includeGrandparents || (event.household || 'familie') === 'familie') &&
    !String(event.source || '').startsWith('calendar-subscription:')
  );
}

async function listRemoteEvents(
  connection,
  calendarHref,
  request = nextcloudRequest
) {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<c:calendar-query xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav">
  <d:prop>
    <d:getetag/>
    <c:calendar-data/>
  </d:prop>
  <c:filter>
    <c:comp-filter name="VCALENDAR">
      <c:comp-filter name="VEVENT"/>
    </c:comp-filter>
  </c:filter>
</c:calendar-query>`;
  const { text } = await request(connection, calendarHref, {
    method: 'REPORT',
    remoteHref: true,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1'
    },
    body,
    expectedStatuses: [207]
  });
  const records = parseMultiStatus(text)
    .slice(0, MAX_CALENDAR_ITEMS)
    .map(response => {
      const prop = propFromResponse(response);
      return {
        href: clean(response?.href, '', 2000),
        etag: clean(prop?.getetag, '', 300),
        calendarData: clean(prop?.['calendar-data'], '', MAX_RESPONSE_BYTES)
      };
    })
    .filter(item => item.href && /BEGIN:VEVENT/i.test(item.calendarData));
  return records;
}

function remoteFileName(uid) {
  return `${createHash('sha256').update(uid).digest('hex').slice(0, 40)}.ics`;
}

function appendRemoteFile(calendarHref, uid) {
  const fileName = remoteFileName(uid);
  try {
    const url = new URL(calendarHref);
    return `${url.pathname.replace(/\/+$/, '')}/${fileName}`;
  } catch {
    return `${calendarHref.replace(/\/+$/, '')}/${fileName}`;
  }
}

async function putRemoteEvent(
  connection,
  calendarHref,
  event,
  currentHref,
  currentEtag,
  timeZone,
  request = nextcloudRequest
) {
  const uid =
    clean(event.syncUid) ||
    clean(event.nextcloudUid) ||
    `${createHash('sha256')
      .update(`${event.familyId}:${event.id}`)
      .digest('hex')}@lx-family`;
  const href = currentHref || appendRemoteFile(calendarHref, uid);
  const headers = {
    'Content-Type': 'text/calendar; charset=utf-8'
  };
  if (currentEtag) headers['If-Match'] = currentEtag;
  else headers['If-None-Match'] = '*';
  const content = serializeEvent(event, uid, timeZone);
  const { response } = await request(connection, href, {
    method: 'PUT',
    remoteHref: true,
    headers,
    body: content,
    expectedStatuses: [201, 204]
  });
  return {
    href,
    uid,
    etag: clean(response.headers.get('etag'), currentEtag, 300),
    remoteHash: eventContentHash(event)
  };
}

async function deleteRemoteEvent(
  connection,
  href,
  request = nextcloudRequest
) {
  try {
    await request(connection, href, {
      method: 'DELETE',
      remoteHref: true,
      expectedStatuses: [204, 404]
    });
  } catch (error) {
    if (error.remoteStatus !== 404) throw error;
  }
}

function saveEventMapping(
  familyId,
  event,
  remote,
  provider = PROVIDER
) {
  const localHash = eventContentHash(event);
  saveIntegrationSyncItem(familyId, provider, 'events', {
    localId: event.id,
    remoteHref: remote.href,
    remoteEtag: remote.etag,
    localHash,
    remoteHash: remote.remoteHash || localHash
  });
}

export async function syncNextcloudEvents({
  familyId,
  connection,
  calendarHref,
  defaultMemberId = 'all',
  defaultMemberIds = null,
  includeGrandparents = false,
  timeZone = 'Europe/Berlin',
  memberIds = [],
  provider = PROVIDER,
  sourceName = 'Nextcloud',
  request = nextcloudRequest
}) {
  if (!calendarHref) {
    throw httpError(`Bitte wähle zuerst einen ${sourceName}-Kalender aus.`, 400);
  }
  const stats = {
    imported: 0,
    exported: 0,
    updatedLocal: 0,
    updatedRemote: 0,
    deletedLocal: 0,
    deletedRemote: 0,
    conflicts: 0
  };
  const allowedMemberIds = new Set(memberIds);
  const remoteResources = await listRemoteEvents(
    connection,
    calendarHref,
    request
  );
  const remoteByHref = new Map(
    remoteResources.map(resource => [resource.href, resource])
  );
  const mappings = listIntegrationSyncItems(
    familyId,
    provider,
    'events'
  );
  const mappingByLocal = new Map(
    mappings.map(mapping => [mapping.localId, mapping])
  );
  const mappedRemoteHrefs = new Set(mappings.map(mapping => mapping.remoteHref));
  let localEvents = listRecords(familyId, 'events').filter(event =>
    eligibleLocalEvent(event, includeGrandparents, provider)
  );
  let localById = new Map(localEvents.map(event => [event.id, event]));

  for (const mapping of mappings) {
    let local = localById.get(mapping.localId);
    const remoteResource = remoteByHref.get(mapping.remoteHref);
    if (!local) {
      const remoteWasCreatedByLx = Boolean(
        remoteResource &&
        customIcsValue(
          remoteResource.calendarData,
          'X-LX-FAMILY-ID'
        ) === familyId
      );
      if (remoteResource && (provider === PROVIDER || remoteWasCreatedByLx)) {
        await deleteRemoteEvent(connection, mapping.remoteHref, request);
        stats.deletedRemote += 1;
      }
      deleteIntegrationSyncItem(
        familyId,
        provider,
        'events',
        mapping.localId
      );
      continue;
    }
    if (!remoteResource) {
      const localHash = eventContentHash(local);
      if (localHash === mapping.localHash) {
        deleteRecord(familyId, 'events', local.id);
        localById.delete(local.id);
        stats.deletedLocal += 1;
        deleteIntegrationSyncItem(
          familyId,
          provider,
          'events',
          local.id
        );
      } else {
        const pushed = await putRemoteEvent(
          connection,
          calendarHref,
          local,
          mapping.remoteHref,
          '',
          timeZone,
          request
        );
        local = upsertRecord(familyId, 'events', {
          ...local,
          syncUid: pushed.uid,
          syncHref: pushed.href,
          syncManaged: true,
          syncProvider: provider,
          nextcloudUid: pushed.uid,
          nextcloudHref: pushed.href,
          nextcloudManaged: true
        });
        saveEventMapping(familyId, local, pushed, provider);
        stats.updatedRemote += 1;
      }
      continue;
    }
    const remote = remoteEvent(
      remoteResource,
      familyId,
      defaultMemberId,
      defaultMemberIds,
      timeZone,
      allowedMemberIds,
      provider,
      sourceName
    );
    if (!remote) continue;
    const localHash = eventContentHash(local);
    const remoteHash = eventContentHash(remote);
    const localChanged = localHash !== mapping.localHash;
    const remoteChanged =
      remoteResource.etag !== mapping.remoteEtag ||
      remoteHash !== mapping.remoteHash;

    if (localChanged && remoteChanged && localHash !== remoteHash) {
      const conflict = upsertRecord(familyId, 'events', {
        ...remote,
        id: `${provider.replace(/[^a-z0-9-]/gi, '-')}-conflict-${randomUUID()}`,
        title: `${remote.title} · Konflikt aus ${sourceName}`,
        syncExcluded: true,
        nextcloudExcluded: true,
        nextcloudConflictOf: local.id
      });
      localEvents.push(conflict);
      const pushed = await putRemoteEvent(
        connection,
        calendarHref,
        local,
        mapping.remoteHref,
        remoteResource.etag,
        timeZone,
        request
      );
      saveEventMapping(familyId, local, pushed, provider);
      stats.conflicts += 1;
      stats.updatedRemote += 1;
      continue;
    }
    if (remoteChanged && !localChanged) {
      const merged = upsertRecord(familyId, 'events', {
        ...local,
        ...remote,
        id: local.id,
        familyId,
        reminders: local.reminders || [],
        nextcloudHref: remoteResource.href
      });
      saveEventMapping(familyId, merged, {
        href: remoteResource.href,
        etag: remoteResource.etag,
        remoteHash
      }, provider);
      localById.set(merged.id, merged);
      stats.updatedLocal += 1;
      continue;
    }
    if (localChanged && !remoteChanged) {
      const pushed = await putRemoteEvent(
        connection,
        calendarHref,
        local,
        mapping.remoteHref,
        remoteResource.etag,
        timeZone,
        request
      );
      local = upsertRecord(familyId, 'events', {
        ...local,
        syncUid: pushed.uid,
        syncHref: pushed.href,
        syncManaged: true,
        syncProvider: provider,
        nextcloudUid: pushed.uid,
        nextcloudHref: pushed.href,
        nextcloudManaged: true
      });
      saveEventMapping(familyId, local, pushed, provider);
      stats.updatedRemote += 1;
      continue;
    }
    saveEventMapping(familyId, local, {
      href: remoteResource.href,
      etag: remoteResource.etag,
      remoteHash
    }, provider);
  }

  localEvents = listRecords(familyId, 'events').filter(event =>
    eligibleLocalEvent(event, includeGrandparents, provider)
  );
  for (const local of localEvents) {
    if (
      mappingByLocal.has(local.id) ||
      local.nextcloudExcluded ||
      local.syncExcluded
    ) continue;
    const recoveredResource = remoteResources.find(resource =>
      !mappedRemoteHrefs.has(resource.href) &&
      customIcsValue(resource.calendarData, 'X-LX-EVENT-ID') === local.id
    );
    if (recoveredResource) {
      const recovered = remoteEvent(
        recoveredResource,
        familyId,
        defaultMemberId,
        defaultMemberIds,
        timeZone,
        allowedMemberIds,
        provider,
        sourceName
      );
      const pushed = await putRemoteEvent(
        connection,
        calendarHref,
        local,
        recoveredResource.href,
        recoveredResource.etag,
        timeZone,
        request
      );
      const updated = upsertRecord(familyId, 'events', {
        ...local,
        syncUid: recovered?.syncUid || pushed.uid,
        syncHref: pushed.href,
        syncManaged: true,
        syncProvider: provider,
        nextcloudUid: recovered?.nextcloudUid || pushed.uid,
        nextcloudHref: pushed.href,
        nextcloudManaged: true
      });
      saveEventMapping(familyId, updated, pushed, provider);
      mappedRemoteHrefs.add(pushed.href);
      stats.updatedRemote += 1;
      continue;
    }
    const pushed = await putRemoteEvent(
      connection,
      calendarHref,
      local,
      '',
      '',
      timeZone,
      request
    );
    const updated = upsertRecord(familyId, 'events', {
      ...local,
      syncUid: pushed.uid,
      syncHref: pushed.href,
      syncManaged: true,
      syncProvider: provider,
      nextcloudUid: pushed.uid,
      nextcloudHref: pushed.href,
      nextcloudManaged: true
    });
    saveEventMapping(familyId, updated, pushed, provider);
    mappedRemoteHrefs.add(pushed.href);
    stats.exported += 1;
  }

  const occupiedLocalIds = new Set(
    listRecords(familyId, 'events').map(event => event.id)
  );
  for (const resource of remoteResources) {
    if (mappedRemoteHrefs.has(resource.href)) continue;
    const remote = remoteEvent(
      resource,
      familyId,
      defaultMemberId,
      defaultMemberIds,
      timeZone,
      allowedMemberIds,
      provider,
      sourceName
    );
    if (!remote) continue;
    const requestedId = customIcsValue(
      resource.calendarData,
      'X-LX-EVENT-ID'
    );
    const id = requestedId && !occupiedLocalIds.has(requestedId)
      ? requestedId
      : `${provider.replace(/[^a-z0-9-]/gi, '-')}-event-${createHash('sha256')
        .update(resource.href)
        .digest('hex')
        .slice(0, 28)}`;
    const inserted = upsertRecord(familyId, 'events', {
      ...remote,
      id,
      familyId
    });
    occupiedLocalIds.add(inserted.id);
    saveEventMapping(familyId, inserted, {
      href: resource.href,
      etag: resource.etag,
      remoteHash: eventContentHash(remote)
    }, provider);
    stats.imported += 1;
  }

  return stats;
}

export function nextcloudBrowserFolderUrl(publicBaseUrl, folder) {
  const url = new URL(`${normalizeNextcloudBaseUrl(publicBaseUrl)}/`);
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/index.php/apps/files/`;
  url.searchParams.set('dir', `/${normalizeNextcloudFolder(folder)}`);
  return url.toString();
}
