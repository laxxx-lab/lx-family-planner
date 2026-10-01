import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createServer } from 'node:http';
import os from 'node:os';
import path from 'node:path';
import test, { after, mock } from 'node:test';

// Calendar fixtures below are in August 2026. Keep the discovery window stable
// so these sync regressions remain meaningful after those dates have passed.
mock.method(Date, 'now', () => new Date('2026-08-12T12:00:00Z').getTime());

const directory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'lx-family-nextcloud-')
);
process.env.DATABASE_FILE = path.join(directory, 'nextcloud.sqlite');
process.env.DISABLE_LEGACY_IMPORT = 'true';
process.env.NODE_ENV = 'test';

const databaseModule = await import('./database.js');
const {
  createFamily,
  createRecord,
  database,
  deleteRecord,
  getIntegration,
  getRecord,
  listIntegrationSyncItems,
  listRecords,
  updateRecord
} = databaseModule;
const {
  ensureNextcloudCalendar,
  ensureNextcloudFolder,
  createNextcloudFolder,
  deleteNextcloudEntry,
  downloadNextcloudFile,
  inspectNextcloud,
  listNextcloudFiles,
  provisionNextcloudUser,
  revokeNextcloudAppPassword,
  syncNextcloudEvents,
  uploadNextcloudFile,
  uploadNextcloudUserFile
} = await import('./nextcloud.js');
const { calDavRequest } = await import('./caldav.js');

const remoteEvents = new Map();
const uploadedFiles = new Map();
const createdFolders = new Set();
const provisionedUsers = new Map();
let etagCounter = 1;
const calendarHref = '/remote.php/dav/calendars/family/family/';

function calendarData(title, uid, eventId = '') {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    'DTSTART;TZID=Europe/Berlin:20260812T160000',
    `SUMMARY:${title}`,
    eventId ? `X-LX-EVENT-ID:${eventId}` : '',
    'X-LX-MEMBER-ID:all',
    'END:VEVENT',
    'END:VCALENDAR',
    ''
  ].filter(Boolean).join('\r\n');
}

function multiStatus(responses) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<d:multistatus xmlns:d="DAV:" xmlns:c="urn:ietf:params:xml:ns:caldav" xmlns:a="http://apple.com/ns/ical/">
${responses.join('\n')}
</d:multistatus>`;
}

const davServer = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  res.setHeader('content-type', 'application/xml; charset=utf-8');

  if (req.url === '/status.php') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      installed: true,
      maintenance: false,
      version: '34.0.0',
      versionstring: '34.0.0'
    }));
    return;
  }
  if (
    req.method === 'GET' &&
    req.url?.startsWith('/ocs/v2.php/cloud/users?format=json&search=')
  ) {
    const search = new URL(req.url, 'http://localhost')
      .searchParams.get('search');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: {
          users: [...provisionedUsers.keys()].filter(user => user === search)
        }
      }
    }));
    return;
  }
  if (
    req.method === 'POST' &&
    req.url === '/ocs/v2.php/cloud/users?format=json'
  ) {
    const values = new URLSearchParams(body.toString('utf8'));
    provisionedUsers.set(values.get('userid'), {
      displayName: values.get('displayName'),
      password: values.get('password')
    });
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: { id: values.get('userid') }
      }
    }));
    return;
  }
  if (
    req.method === 'PUT' &&
    req.url?.startsWith('/ocs/v2.php/cloud/users/')
  ) {
    const userId = decodeURIComponent(
      req.url.split('/').at(-1).split('?')[0]
    );
    const values = new URLSearchParams(body.toString('utf8'));
    provisionedUsers.get(userId)[values.get('key')] = values.get('value');
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: []
      }
    }));
    return;
  }
  if (req.url === '/ocs/v2.php/core/getapppassword?format=json') {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: { apppassword: 'generated-app-password' }
      }
    }));
    return;
  }
  if (
    req.method === 'DELETE' &&
    req.url === '/ocs/v2.php/core/apppassword?format=json'
  ) {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        meta: { status: 'ok', statuscode: 200 },
        data: []
      }
    }));
    return;
  }
  if (req.url === '/ocs/v2.php/cloud/user?format=json') {
    const authorization = String(req.headers.authorization || '');
    const credentials = authorization.startsWith('Basic ')
      ? Buffer.from(authorization.slice(6), 'base64')
          .toString('utf8')
          .split(':')
      : [];
    const accountId = credentials[0] || 'family';
    const account = provisionedUsers.get(accountId);
    if (accountId.startsWith('lx-') && !account) {
      res.statusCode = 401;
      res.end('Unauthorized');
      return;
    }
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({
      ocs: {
        data: {
          id: accountId,
          displayname: account?.displayName || 'Familie Test',
          email: 'family@example.test',
          quota: {
            free: 9_999_999,
            used: 1234,
            total: 10_001_233,
            relative: 0.01,
            quota: 10_001_233
          }
        }
      }
    }));
    return;
  }
  if (
    req.method === 'PROPFIND' &&
    /^\/remote\.php\/dav\/calendars\/[^/]+\/$/.test(req.url || '')
  ) {
    const calendarUser = req.url.split('/').filter(Boolean).at(-1);
    const userCalendarHref =
      `/remote.php/dav/calendars/${calendarUser}/family/`;
    res.statusCode = 207;
    res.end(multiStatus([
      `<d:response>
        <d:href>${userCalendarHref}</d:href>
        <d:propstat><d:prop>
          <d:displayname>Familie</d:displayname>
          <d:resourcetype><d:collection/><c:calendar/></d:resourcetype>
          <c:supported-calendar-component-set>
            <c:comp name="VEVENT"/>
          </c:supported-calendar-component-set>
          <a:calendar-color>#15998b</a:calendar-color>
        </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
      </d:response>`
    ]));
    return;
  }
  if (
    req.method === 'REPORT' &&
    /^\/remote\.php\/dav\/calendars\/[^/]+\/family\/$/.test(req.url || '')
  ) {
    const reportEvents = req.url === calendarHref
      ? [...remoteEvents.entries()]
      : [];
    res.statusCode = 207;
    res.end(multiStatus(
      reportEvents.map(([href, item]) => (
        `<d:response>
          <d:href>${href}</d:href>
          <d:propstat><d:prop>
            <d:getetag>${item.etag}</d:getetag>
            <c:calendar-data><![CDATA[${item.data}]]></c:calendar-data>
          </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
        </d:response>`
      ))
    ));
    return;
  }
  if (
    req.method === 'PROPFIND' &&
    req.url?.startsWith('/remote.php/dav/files/')
  ) {
    const root = req.url.replace(/\/+$/, '');
    const prefix = `${root}/`;
    const responses = [
      `<d:response>
        <d:href>${root}/</d:href>
        <d:propstat><d:prop>
          <d:displayname>${decodeURIComponent(root.split('/').at(-1))}</d:displayname>
          <d:resourcetype><d:collection/></d:resourcetype>
        </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
      </d:response>`
    ];
    for (const folderPath of createdFolders) {
      if (
        folderPath !== root &&
        folderPath.startsWith(prefix) &&
        !folderPath.slice(prefix.length).includes('/')
      ) {
        const name = decodeURIComponent(folderPath.split('/').at(-1));
        responses.push(`<d:response>
          <d:href>${folderPath}/</d:href>
          <d:propstat><d:prop>
            <d:displayname>${name}</d:displayname>
            <d:resourcetype><d:collection/></d:resourcetype>
          </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
        </d:response>`);
      }
    }
    for (const [filePath, content] of uploadedFiles) {
      if (
        filePath.startsWith(prefix) &&
        !filePath.slice(prefix.length).includes('/')
      ) {
        const name = decodeURIComponent(filePath.split('/').at(-1));
        responses.push(`<d:response>
          <d:href>${filePath}</d:href>
          <d:propstat><d:prop>
            <d:displayname>${name}</d:displayname>
            <d:resourcetype/>
            <d:getcontentlength>${content.length}</d:getcontentlength>
            <d:getcontenttype>image/jpeg</d:getcontenttype>
            <d:getlastmodified>Wed, 29 Jul 2026 01:00:00 GMT</d:getlastmodified>
            <d:getetag>"file-view"</d:getetag>
          </d:prop><d:status>HTTP/1.1 200 OK</d:status></d:propstat>
        </d:response>`);
      }
    }
    res.statusCode = 207;
    res.end(multiStatus(responses));
    return;
  }
  if (req.method === 'MKCOL') {
    createdFolders.add(req.url.replace(/\/+$/, ''));
    res.statusCode = 201;
    res.end();
    return;
  }
  if (req.method === 'PUT' && req.url?.endsWith('.ics')) {
    const etag = `"etag-${etagCounter++}"`;
    remoteEvents.set(req.url, {
      etag,
      data: body.toString('utf8')
    });
    res.statusCode = remoteEvents.has(req.url) ? 204 : 201;
    res.setHeader('etag', etag);
    res.end();
    return;
  }
  if (req.method === 'PUT') {
    uploadedFiles.set(req.url, body);
    res.statusCode = 201;
    res.setHeader('etag', `"file-${etagCounter++}"`);
    res.end();
    return;
  }
  if (
    req.method === 'GET' &&
    uploadedFiles.has(req.url)
  ) {
    res.setHeader('content-type', 'image/jpeg');
    res.end(uploadedFiles.get(req.url));
    return;
  }
  if (req.method === 'DELETE') {
    remoteEvents.delete(req.url);
    uploadedFiles.delete(req.url);
    createdFolders.delete(req.url.replace(/\/+$/, ''));
    res.statusCode = 204;
    res.end();
    return;
  }
  res.statusCode = 404;
  res.end();
});

davServer.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  davServer.once('listening', resolve);
  davServer.once('error', reject);
});
const address = davServer.address();
const connection = {
  baseUrl: `http://127.0.0.1:${address.port}`,
  username: 'family',
  appPassword: 'app-password',
  appVersion: 'test'
};

after(async () => {
  await new Promise(resolve => davServer.close(resolve));
  database.close();
  fs.rmSync(directory, { recursive: true, force: true });
});

test('Nextcloud discovery, WebDAV files and two-way calendar sync stay safe', async () => {
  const inspection = await inspectNextcloud(connection);
  assert.equal(inspection.userId, 'family');
  assert.equal(inspection.calendars.length, 1);
  assert.deepEqual(inspection.calendars[0].components, ['VEVENT']);
  assert.equal(inspection.storage.used, 1234);
  assert.equal(inspection.storage.total, 10_001_233);

  await ensureNextcloudFolder(connection, 'family', 'LX Family/Backups');
  const uploaded = await uploadNextcloudFile(
    connection,
    'family',
    'LX Family/Backups',
    'test.lxbackup',
    Buffer.from('encrypted-family-data')
  );
  assert.equal(uploaded.fileName, 'test.lxbackup');
  assert.equal(
    [...uploadedFiles.values()][0].toString('utf8'),
    'encrypted-family-data'
  );

  await createNextcloudFolder(
    connection,
    'family',
    'LX Family',
    '',
    'Fotos'
  );
  const photo = Buffer.from('family-photo');
  const uploadedPhoto = await uploadNextcloudUserFile(
    connection,
    'family',
    'LX Family',
    'Fotos',
    'Sommer.jpg',
    photo,
    'image/jpeg'
  );
  assert.equal(uploadedPhoto.name, 'Sommer.jpg');
  assert.equal(uploadedPhoto.path, 'Fotos/Sommer.jpg');

  const fileListing = await listNextcloudFiles(
    connection,
    'family',
    'LX Family',
    'Fotos'
  );
  assert.deepEqual(
    fileListing.map(entry => ({
      name: entry.name,
      type: entry.type,
      size: entry.size
    })),
    [{
      name: 'Sommer.jpg',
      type: 'file',
      size: photo.length
    }]
  );

  const downloadedPhoto = await downloadNextcloudFile(
    connection,
    'family',
    'LX Family',
    'Fotos/Sommer.jpg'
  );
  assert.equal(downloadedPhoto.content.toString('utf8'), 'family-photo');
  assert.equal(downloadedPhoto.contentType, 'image/jpeg');

  await deleteNextcloudEntry(
    connection,
    'family',
    'LX Family',
    'Fotos/Sommer.jpg'
  );
  assert.equal(
    (
      await listNextcloudFiles(
        connection,
        'family',
        'LX Family',
        'Fotos'
      )
    ).length,
    0
  );

  const familyId = 'family-nextcloud';
  createFamily({
    id: familyId,
    familyName: 'Familie Cloud',
    password: 'long-test-password',
    members: [{
      id: 'adult-1',
      name: 'Alex',
      role: 'adult',
      position: 'mama'
    }]
  });
  createRecord(familyId, 'events', {
    id: 'event-local',
    title: 'Kinoabend',
    date: '2026-08-12',
    time: '16:00',
    memberId: 'all',
    household: 'familie'
  });

  const firstSync = await syncNextcloudEvents({
    familyId,
    connection,
    calendarHref
  });
  assert.equal(firstSync.exported, 1);
  assert.equal(remoteEvents.size, 1);
  assert.equal(
    listIntegrationSyncItems(familyId, 'nextcloud', 'events').length,
    1
  );

  const [remoteHref, remote] = [...remoteEvents.entries()][0];
  remoteEvents.set(remoteHref, {
    etag: `"etag-${etagCounter++}"`,
    data: calendarData('Kinoabend verschoben', 'remote-uid', 'event-local')
  });
  const remoteChange = await syncNextcloudEvents({
    familyId,
    connection,
    calendarHref
  });
  assert.equal(remoteChange.updatedLocal, 1);
  assert.equal(
    getRecord(familyId, 'events', 'event-local').title,
    'Kinoabend verschoben'
  );

  updateRecord(familyId, 'events', 'event-local', {
    title: 'Lokaler Wunsch'
  });
  remoteEvents.set(remoteHref, {
    etag: `"etag-${etagCounter++}"`,
    data: calendarData('Cloud-Wunsch', 'remote-uid', 'event-local')
  });
  const conflict = await syncNextcloudEvents({
    familyId,
    connection,
    calendarHref
  });
  assert.equal(conflict.conflicts, 1);
  assert.equal(
    listRecords(familyId, 'events').some(event =>
      event.title.includes('Konflikt aus Nextcloud')
    ),
    true
  );
  assert.match(remoteEvents.get(remoteHref).data, /SUMMARY:Lokaler Wunsch/);

  deleteRecord(familyId, 'events', 'event-local');
  const deletion = await syncNextcloudEvents({
    familyId,
    connection,
    calendarHref
  });
  assert.equal(deletion.deletedRemote, 1);
  assert.equal(remoteEvents.has(remoteHref), false);
});

test('generic CalDAV two-way sync writes LX events but preserves foreign remote events', async () => {
  remoteEvents.clear();
  const familyId = 'family-caldav-two-way';
  createFamily({
    id: familyId,
    familyName: 'Familie CalDAV',
    password: 'long-test-password',
    members: [{
      id: 'caldav-adult',
      name: 'Sam',
      role: 'adult',
      position: 'papa'
    }]
  });
  createRecord(familyId, 'events', {
    id: 'caldav-local',
    title: 'LX Termin',
    date: '2026-09-01',
    time: '18:00',
    memberId: 'all',
    household: 'familie'
  });
  const calDavConnection = {
    url: `${connection.baseUrl}${calendarHref}`,
    username: 'family',
    password: 'app-password',
    appVersion: 'test'
  };
  const syncOptions = {
    familyId,
    connection: calDavConnection,
    calendarHref: calDavConnection.url,
    provider: 'caldav:test-calendar',
    sourceName: 'NAS-Kalender',
    request: calDavRequest,
    memberIds: ['caldav-adult']
  };
  const exported = await syncNextcloudEvents(syncOptions);
  assert.equal(exported.exported, 1);
  assert.equal(
    listIntegrationSyncItems(
      familyId,
      'caldav:test-calendar',
      'events'
    ).length,
    1
  );

  const foreignHref = `${calendarHref}foreign.ics`;
  remoteEvents.set(foreignHref, {
    etag: '"foreign-1"',
    data: calendarData('Fremder Termin', 'foreign-uid')
  });
  const imported = await syncNextcloudEvents(syncOptions);
  assert.equal(imported.imported, 1);
  const foreignLocal = listRecords(familyId, 'events').find(
    event => event.title === 'Fremder Termin'
  );
  assert.equal(foreignLocal.source, 'caldav:test-calendar');

  deleteRecord(familyId, 'events', foreignLocal.id);
  const deletion = await syncNextcloudEvents(syncOptions);
  assert.equal(deletion.deletedRemote, 0);
  assert.equal(remoteEvents.has(foreignHref), true);
});

test('bundled Nextcloud users receive isolated renewable app credentials', async () => {
  const first = await provisionNextcloudUser({
    baseUrl: connection.baseUrl,
    adminUsername: 'familyadmin',
    adminPassword: 'admin-password',
    userId: 'lx-family-test',
    displayName: 'LX Family · Test',
    password: 'a'.repeat(32),
    appVersion: 'test'
  });
  assert.deepEqual(first, {
    userId: 'lx-family-test',
    displayName: 'LX Family · Test',
    quota: '10GB',
    appPassword: 'generated-app-password'
  });
  assert.equal(
    provisionedUsers.get('lx-family-test').displayName,
    'LX Family · Test'
  );
  assert.equal(provisionedUsers.get('lx-family-test').quota, '10GB');

  await provisionNextcloudUser({
    baseUrl: connection.baseUrl,
    adminUsername: 'familyadmin',
    adminPassword: 'admin-password',
    userId: 'lx-family-test',
    displayName: 'LX Family · Test',
    password: 'b'.repeat(32),
    appVersion: 'test'
  });
  assert.equal(
    provisionedUsers.get('lx-family-test').password,
    'b'.repeat(32)
  );

  const calendars = await ensureNextcloudCalendar(
    connection,
    'family',
    'LX Family'
  );
  assert.equal(calendars.length, 1);
  assert.equal(await revokeNextcloudAppPassword(connection), true);
});

test('bundled Family Cloud provisions missing family storage automatically', async () => {
  process.env.NEXTCLOUD_ADMIN_USER = 'familyadmin';
  process.env.NEXTCLOUD_ADMIN_PASSWORD = 'admin-password';
  process.env.NEXTCLOUD_INTERNAL_URL = connection.baseUrl;
  process.env.NEXTCLOUD_PUBLIC_URL = 'https://cloud.example.test';
  process.env.NEXTCLOUD_FAMILY_QUOTA = '12GB';
  process.env.NEXTCLOUD_AUTO_PROVISION = 'true';

  const { createApp } = await import('./app.js');
  const app = createApp();
  const result = await app.locals.provisionBundledCloudFamily(
    'family-nextcloud'
  );
  assert.equal(result.skipped, false);

  const integration = getIntegration('family-nextcloud', 'nextcloud');
  assert.equal(integration.config.bundled, true);
  assert.equal(integration.config.publicBaseUrl, 'https://cloud.example.test');
  assert.equal(integration.config.quota, '12GB');
  assert.equal(integration.config.folder, 'LX Family');
  assert.equal(
    provisionedUsers.get(integration.config.userId).quota,
    '12GB'
  );
  assert.equal(
    [...createdFolders].some(folderPath =>
      folderPath.includes(
        `/remote.php/dav/files/${integration.config.userId}/LX%20Family`
      )
    ),
    true
  );

  const repeated = await app.locals.provisionBundledCloudFamily(
    'family-nextcloud'
  );
  assert.equal(repeated.skipped, true);
  assert.equal(repeated.healthy, true);

  provisionedUsers.delete(integration.config.userId);
  const repaired = await app.locals.provisionBundledCloudFamily(
    'family-nextcloud'
  );
  assert.equal(repaired.skipped, false);
  assert.equal(repaired.repaired, true);
  assert.equal(
    provisionedUsers.get(integration.config.userId).quota,
    '12GB'
  );

  const apiServer = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    apiServer.once('listening', resolve);
    apiServer.once('error', reject);
  });
  try {
    const apiAddress = apiServer.address();
    const apiBaseUrl = `http://127.0.0.1:${apiAddress.port}`;
    const familyLogin = await fetch(`${apiBaseUrl}/api/auth/family`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        familyId: 'family-nextcloud',
        password: 'long-test-password'
      })
    });
    assert.equal(familyLogin.status, 200);
    const cookie = familyLogin.headers.get('set-cookie').split(';')[0];
    const memberLogin = await fetch(`${apiBaseUrl}/api/auth/member`, {
      method: 'POST',
      headers: {
        cookie,
        'content-type': 'application/json'
      },
      body: JSON.stringify({ memberId: 'adult-1' })
    });
    assert.equal(memberLogin.status, 200);

    const folderResponse = await fetch(
      `${apiBaseUrl}/api/integrations/nextcloud/folders`,
      { headers: { cookie } }
    );
    assert.equal(folderResponse.status, 200);
    const folderPayload = await folderResponse.json();
    assert.equal(
      folderPayload.folders.some(folder => folder.path === 'Familie/Uploads'),
      true
    );
    assert.equal(
      folderPayload.folders.some(folder => folder.path === 'Profile/Alex'),
      true
    );

    const archiveContent = Buffer.from('family-chat-archive');
    const uploadResponse = await fetch(
      `${apiBaseUrl}/api/chat/attachments`,
      {
        method: 'PUT',
        headers: {
          cookie,
          'content-type': 'application/octet-stream',
          'x-lx-file-name': encodeURIComponent('Unterlagen.zip'),
          'x-lx-file-type': 'application/zip'
        },
        body: archiveContent
      }
    );
    assert.equal(uploadResponse.status, 201);
    const uploadPayload = await uploadResponse.json();
    assert.match(
      uploadPayload.attachment.cloudPath,
      /^Familie\/Chat\/\d{4}-\d{2}\//
    );
    assert.equal(uploadPayload.attachment.kind, 'archive');
    assert.match(uploadPayload.attachment.claim, /^[a-z0-9_-]{32,}$/i);

    const messageResponse = await fetch(
      `${apiBaseUrl}/api/resources/chatMessages`,
      {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          text: 'Hier ist das Archiv.',
          target: 'group',
          attachments: [uploadPayload.attachment]
        })
      }
    );
    assert.equal(messageResponse.status, 201);
    const messagePayload = await messageResponse.json();
    assert.equal(messagePayload.record.attachments.length, 1);
    assert.equal(messagePayload.record.attachments[0].claim, undefined);
    assert.equal(messagePayload.record.attachments[0].kind, 'archive');

    const downloadResponse = await fetch(
      `${apiBaseUrl}/api/chat/messages/${
        encodeURIComponent(messagePayload.record.id)
      }/attachments/${
        encodeURIComponent(messagePayload.record.attachments[0].id)
      }?inline=true`,
      { headers: { cookie } }
    );
    assert.equal(downloadResponse.status, 200);
    assert.match(
      downloadResponse.headers.get('content-disposition'),
      /^attachment;/
    );
    assert.deepEqual(
      Buffer.from(await downloadResponse.arrayBuffer()),
      archiveContent
    );

    const legacyPhotoBytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64'
    );
    const legacyPhotoResponse = await fetch(
      `${apiBaseUrl}/api/resources/chatMessages`,
      {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          text: 'Foto aus einer älteren App-Version',
          target: 'group',
          photo: `data:image/png;base64,${legacyPhotoBytes.toString('base64')}`
        })
      }
    );
    assert.equal(legacyPhotoResponse.status, 201);
    const legacyPhotoMessage = (await legacyPhotoResponse.json()).record;
    assert.equal(legacyPhotoMessage.photo, '');
    assert.equal(legacyPhotoMessage.attachments.length, 1);
    assert.equal(legacyPhotoMessage.attachments[0].kind, 'image');
    assert.match(
      legacyPhotoMessage.attachments[0].cloudPath,
      /^Familie\/Chat\/\d{4}-\d{2}\//
    );
    const legacyPhotoDownload = await fetch(
      `${apiBaseUrl}/api/chat/messages/${
        encodeURIComponent(legacyPhotoMessage.id)
      }/attachments/${
        encodeURIComponent(legacyPhotoMessage.attachments[0].id)
      }?inline=true`,
      { headers: { cookie } }
    );
    assert.equal(legacyPhotoDownload.status, 200);
    assert.match(
      legacyPhotoDownload.headers.get('content-disposition'),
      /^inline;/
    );
    assert.deepEqual(
      Buffer.from(await legacyPhotoDownload.arrayBuffer()),
      legacyPhotoBytes
    );

    const historicalPhoto = createRecord(
      'family-nextcloud',
      'chatMessages',
      {
        id: 'historical-legacy-photo',
        senderId: 'adult-1',
        senderName: 'Alex',
        text: 'Dieses Bild lag schon im bisherigen Chat.',
        target: 'group',
        timestamp: Date.now() - 60_000,
        photo: `data:image/png;base64,${legacyPhotoBytes.toString('base64')}`,
        attachments: []
      }
    );
    assert.ok(historicalPhoto.photo);
    const migrationResult =
      await app.locals.migrateLegacyChatPhotosForFamily('family-nextcloud');
    assert.equal(migrationResult.migrated, 1);
    const migratedHistoricalPhoto = getRecord(
      'family-nextcloud',
      'chatMessages',
      historicalPhoto.id
    );
    assert.equal(migratedHistoricalPhoto.photo, '');
    assert.equal(migratedHistoricalPhoto.attachments.length, 1);
    assert.equal(migratedHistoricalPhoto.attachments[0].kind, 'image');

    const privateContent = Buffer.from('private-family-document');
    const privateUploadResponse = await fetch(
      `${apiBaseUrl}/api/chat/attachments`,
      {
        method: 'PUT',
        headers: {
          cookie,
          'content-type': 'application/octet-stream',
          'x-lx-file-name': encodeURIComponent('Privat.txt'),
          'x-lx-file-type': 'text/plain',
          'x-lx-chat-target': 'adult-1'
        },
        body: privateContent
      }
    );
    assert.equal(privateUploadResponse.status, 201);
    const privateUpload = (await privateUploadResponse.json()).attachment;
    assert.match(privateUpload.cloudPath, /^\.LX-Privat\/Chat\//);
    assert.equal(privateUpload.encrypted, true);
    assert.equal(
      [...uploadedFiles.entries()]
        .find(([remotePath]) =>
          remotePath.endsWith(encodeURIComponent(
            privateUpload.cloudPath.split('/').at(-1)
          ))
        )[1]
        .equals(privateContent),
      false
    );
    const privateMessageResponse = await fetch(
      `${apiBaseUrl}/api/resources/chatMessages`,
      {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          target: 'adult-1',
          attachments: [privateUpload]
        })
      }
    );
    assert.equal(privateMessageResponse.status, 201);
    const privateMessage = (await privateMessageResponse.json()).record;
    const privateDownloadResponse = await fetch(
      `${apiBaseUrl}/api/chat/messages/${
        encodeURIComponent(privateMessage.id)
      }/attachments/${encodeURIComponent(privateMessage.attachments[0].id)}`,
      { headers: { cookie } }
    );
    assert.equal(privateDownloadResponse.status, 200);
    assert.deepEqual(
      Buffer.from(await privateDownloadResponse.arrayBuffer()),
      privateContent
    );
    const privateCloudBypass = await fetch(
      `${apiBaseUrl}/api/integrations/nextcloud/files/content?path=${
        encodeURIComponent(privateUpload.cloudPath)
      }`,
      { headers: { cookie } }
    );
    assert.equal(privateCloudBypass.status, 404);

    const tamperedResponse = await fetch(
      `${apiBaseUrl}/api/resources/chatMessages`,
      {
        method: 'POST',
        headers: {
          cookie,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          target: 'group',
          attachments: [{
            ...uploadPayload.attachment,
            name: 'Manipuliert.zip'
          }]
        })
      }
    );
    assert.equal(tamperedResponse.status, 400);
  } finally {
    await new Promise(resolve => apiServer.close(resolve));
  }
});
