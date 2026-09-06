import { isIP } from 'net';
import { XMLParser } from 'fast-xml-parser';
import {
  closePinnedResponse,
  fetchPinnedTarget,
  resolvePinnedTarget
} from './pinnedFetch.js';

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 8 * 1024 * 1024;
const MAX_FILE_BYTES = 50 * 1024 * 1024;
const XML = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true
});
const PROPFIND_BODY = `<?xml version="1.0" encoding="UTF-8"?>
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

export function normalizeWebDavBaseUrl(value) {
  let url;
  try {
    url = new URL(clean(value, '', 2000));
  } catch {
    throw httpError('Die WebDAV-Adresse ist ungültig.', 400);
  }
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw httpError(
      'Die WebDAV-Adresse muss mit http:// oder https:// beginnen.',
      400
    );
  }
  if (url.username || url.password || url.search || url.hash) {
    throw httpError(
      'Die WebDAV-Adresse darf keine Zugangsdaten oder Parameter enthalten.',
      400
    );
  }
  url.pathname = `${url.pathname.replace(/\/+$/, '')}/`;
  return url.href;
}

export function normalizeWebDavRelativePath(value = '') {
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
    throw httpError('Der WebDAV-Pfad ist ungültig.', 400);
  }
  return pieces.join('/');
}

function cleanEntryName(value, fallback = 'Datei') {
  const name = clean(value, fallback, 240)
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-')
    .replace(/^\.+$/, fallback);
  return name || fallback;
}

function buildWebDavUrl(baseUrl, relativePath = '') {
  const base = new URL(normalizeWebDavBaseUrl(baseUrl));
  const path = normalizeWebDavRelativePath(relativePath);
  if (!path) return base;
  base.pathname += path
    .split('/')
    .map(piece => encodeURIComponent(piece))
    .join('/');
  return base;
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
    if (first === 127) return process.env.NODE_ENV !== 'test';
    const privateNetwork = first === 10 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168);
    if (privateNetwork) {
      return process.env.WEBDAV_ALLOW_PRIVATE_HOSTS !== 'true' &&
        process.env.NODE_ENV !== 'test';
    }
    return false;
  }
  if (isIP(normalized) === 6) {
    if (normalized === '::1') return process.env.NODE_ENV !== 'test';
    const privateNetwork = normalized.startsWith('fc') || normalized.startsWith('fd');
    if (privateNetwork) {
      return process.env.WEBDAV_ALLOW_PRIVATE_HOSTS !== 'true' &&
        process.env.NODE_ENV !== 'test';
    }
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
        'Diese WebDAV-Adresse zeigt auf eine gesperrte Geräteadresse.',
        400
      );
    }
    if (error?.code === 'PINNED_TARGET_NOT_FOUND') {
      throw httpError('Der WebDAV-Server konnte nicht gefunden werden.', 400);
    }
    throw error;
  }
}

async function readLimitedBuffer(response, maximumBytes) {
  const announced = Number(response.headers.get('content-length') || 0);
  if (announced > maximumBytes) {
    throw httpError('Die Antwort des WebDAV-Servers ist zu groß.', 413);
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
      throw httpError('Die Antwort des WebDAV-Servers ist zu groß.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return Buffer.concat(chunks);
}

function authorizationHeader(username, password) {
  return `Basic ${Buffer.from(`${username}:${password}`, 'utf8').toString('base64')}`;
}

async function webDavRequest(
  connection,
  relativePath,
  { method = 'GET', headers = {}, body, expectedStatuses = [200] } = {}
) {
  const url = buildWebDavUrl(connection.baseUrl, relativePath);
  const target = await validateTarget(url);
  let request;
  try {
    request = await fetchPinnedTarget(target, {
      method,
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: authorizationHeader(
          clean(connection.username, '', 300),
          clean(connection.password, '', 1000)
        ),
        'User-Agent': `LX-Family-Planner/${connection.appVersion || '1'}`,
        ...headers
      },
      body
    });
  } catch (error) {
    if (error?.statusCode) throw error;
    throw httpError('Der WebDAV-Server ist gerade nicht erreichbar.');
  }
  try {
    const response = request.response;
    const text = response.status === 204
      ? ''
      : (await readLimitedBuffer(response, MAX_RESPONSE_BYTES)).toString('utf8');
    if (!expectedStatuses.includes(response.status)) {
      const message =
        response.status === 401 || response.status === 403
          ? 'Der WebDAV-Server hat Benutzername oder Passwort abgelehnt.'
          : response.status === 404
            ? 'Der angeforderte WebDAV-Pfad wurde nicht gefunden.'
            : response.status === 409
              ? 'Der übergeordnete WebDAV-Ordner fehlt.'
              : `Der WebDAV-Server meldet Fehler ${response.status}.`;
      const error = httpError(
        message,
        response.status === 401 || response.status === 403
          ? 401
          : response.status === 404
            ? 404
            : 502
      );
      error.remoteStatus = response.status;
      error.responseText = text.slice(0, 1000);
      throw error;
    }
    return { response, text, url };
  } finally {
    await closePinnedResponse(request);
  }
}

function parseMultiStatus(text) {
  let parsed;
  try {
    parsed = XML.parse(text);
  } catch {
    throw httpError('Der WebDAV-Server hat eine unlesbare DAV-Antwort gesendet.');
  }
  const responses = asArray(parsed?.multistatus?.response);
  if (!responses.length) {
    throw httpError('Der WebDAV-Server hat keine DAV-Ressourcen gemeldet.');
  }
  return responses;
}

function propFromResponse(response) {
  for (const propstat of asArray(response?.propstat)) {
    const status = clean(propstat?.status);
    if (!status || status.includes(' 200 ')) return propstat?.prop || {};
  }
  return {};
}

function hasResourceType(prop, type) {
  const resources = prop?.resourcetype;
  return Boolean(resources && Object.hasOwn(resources, type));
}

function decodedPathname(value, baseUrl) {
  try {
    const base = new URL(baseUrl);
    base.pathname = `${base.pathname.replace(/\/+$/, '')}/`;
    return decodeURIComponent(new URL(clean(value), base).pathname)
      .replace(/\/+$/, '');
  } catch {
    return '';
  }
}

export async function inspectWebDav(connection) {
  const { response, text, url } = await webDavRequest(connection, '', {
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '0'
    },
    body: PROPFIND_BODY,
    expectedStatuses: [207]
  });
  const resource = parseMultiStatus(text)[0];
  const prop = propFromResponse(resource);
  if (!hasResourceType(prop, 'collection')) {
    throw httpError('Die WebDAV-Adresse zeigt nicht auf einen Ordner.', 400);
  }
  return {
    baseUrl: normalizeWebDavBaseUrl(connection.baseUrl),
    displayName: cleanEntryName(prop?.displayname, 'WebDAV'),
    davCapabilities: clean(response.headers.get('dav'), '', 500),
    path: decodedPathname(resource?.href, url) || url.pathname
  };
}

export async function listWebDavEntries(connection, relativePath = '') {
  const currentPath = normalizeWebDavRelativePath(relativePath);
  const { text, url } = await webDavRequest(connection, currentPath, {
    method: 'PROPFIND',
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      Depth: '1'
    },
    body: PROPFIND_BODY,
    expectedStatuses: [207]
  });
  const requestedPath = decodeURIComponent(url.pathname).replace(/\/+$/, '');
  return parseMultiStatus(text)
    .flatMap(resource => {
      const resourcePath = decodedPathname(resource?.href, url);
      if (!resourcePath || resourcePath === requestedPath) return [];
      const prefix = `${requestedPath}/`;
      if (!resourcePath.startsWith(prefix)) return [];
      const suffix = resourcePath.slice(prefix.length);
      if (!suffix || suffix.includes('/')) return [];
      const prop = propFromResponse(resource);
      const name = cleanEntryName(prop?.displayname || suffix, 'Datei');
      const isFolder = hasResourceType(prop, 'collection');
      return [{
        name,
        path: normalizeWebDavRelativePath(
          currentPath ? `${currentPath}/${name}` : name
        ),
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
      }];
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

export async function createWebDavFolder(
  connection,
  relativePath,
  name
) {
  const safeName = cleanEntryName(name, '');
  if (!safeName) {
    throw httpError('Bitte gib dem neuen Ordner einen Namen.', 400);
  }
  const currentPath = normalizeWebDavRelativePath(relativePath);
  const targetPath = normalizeWebDavRelativePath(
    currentPath ? `${currentPath}/${safeName}` : safeName
  );
  await webDavRequest(connection, targetPath, {
    method: 'MKCOL',
    expectedStatuses: [201]
  });
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

export async function uploadWebDavFile(
  connection,
  relativePath,
  fileName,
  content,
  contentType = 'application/octet-stream'
) {
  const currentPath = normalizeWebDavRelativePath(relativePath);
  const safeName = cleanEntryName(fileName, `datei-${Date.now()}`);
  const size = Buffer.byteLength(content);
  if (size > MAX_FILE_BYTES) {
    throw httpError('Die Datei ist für den WebDAV-Upload zu groß.', 413);
  }
  const targetPath = normalizeWebDavRelativePath(
    currentPath ? `${currentPath}/${safeName}` : safeName
  );
  const { response } = await webDavRequest(connection, targetPath, {
    method: 'PUT',
    headers: {
      'Content-Type': clean(contentType, 'application/octet-stream', 200),
      'Content-Length': String(size)
    },
    body: content,
    expectedStatuses: [200, 201, 204]
  });
  return {
    name: safeName,
    fileName: safeName,
    path: targetPath,
    type: 'file',
    mimeType: clean(contentType, 'application/octet-stream', 200),
    size,
    modifiedAt: Date.now(),
    etag: clean(response.headers.get('etag'), '', 300)
  };
}

export async function deleteWebDavEntry(connection, relativePath) {
  const targetPath = normalizeWebDavRelativePath(relativePath);
  if (!targetPath) {
    throw httpError('Der WebDAV-Stammordner kann nicht gelöscht werden.', 400);
  }
  await webDavRequest(connection, targetPath, {
    method: 'DELETE',
    expectedStatuses: [200, 204]
  });
  return true;
}

export async function downloadWebDavFile(connection, relativePath) {
  const targetPath = normalizeWebDavRelativePath(relativePath);
  if (!targetPath) {
    throw httpError('Bitte wähle eine Datei aus.', 400);
  }
  const url = buildWebDavUrl(connection.baseUrl, targetPath);
  const target = await validateTarget(url);
  let request;
  try {
    request = await fetchPinnedTarget(target, {
      method: 'GET',
      redirect: 'error',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      headers: {
        Authorization: authorizationHeader(
          clean(connection.username, '', 300),
          clean(connection.password, '', 1000)
        ),
        'User-Agent': `LX-Family-Planner/${connection.appVersion || '1'}`
      }
    });
  } catch {
    throw httpError('Die Datei konnte gerade nicht per WebDAV geladen werden.');
  }
  try {
    const response = request.response;
    if (!response.ok) {
      throw httpError(
        response.status === 404
          ? 'Die Datei wurde nicht gefunden.'
          : `Der WebDAV-Server meldet Fehler ${response.status}.`,
        response.status === 404 ? 404 : 502
      );
    }
    return {
      content: await readLimitedBuffer(response, MAX_FILE_BYTES),
      contentType: clean(
        response.headers.get('content-type'),
        'application/octet-stream',
        200
      ),
      etag: clean(response.headers.get('etag'), '', 300),
      fileName: cleanEntryName(targetPath.split('/').pop(), 'download')
    };
  } finally {
    await closePinnedResponse(request);
  }
}
