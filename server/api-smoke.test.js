import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import { createServer } from 'node:http';

const packageMetadata = JSON.parse(
  fs.readFileSync(new URL('../package.json', import.meta.url), 'utf8')
);
const apkMetadata = JSON.parse(
  fs.readFileSync(new URL('../public/apk/version.json', import.meta.url), 'utf8')
);
const currentAppVersion = packageMetadata.version;

const testDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'lx-family-api-')
);
process.env.DATABASE_FILE = path.join(testDirectory, 'test.sqlite');
process.env.BACKUP_DIRECTORY = path.join(testDirectory, 'backups');
process.env.DISABLE_LEGACY_IMPORT = 'true';
process.env.APP_SECRET = 'test-secret-only-for-automated-api-checks';
process.env.NODE_ENV = 'test';
process.env.REGISTRATION_MODE = 'open';
process.env.PUBLIC_FAMILY_DIRECTORY = 'false';
process.env.CALENDAR_ALLOW_LOOPBACK_FOR_TESTS = 'true';
process.env.PUBLIC_APP_URL = 'https://familie.example.test/vorschau';
process.env.FIREBASE_SERVICE_ACCOUNT_FILE = path.join(
  testDirectory,
  'missing-firebase-service-account.json'
);

const [
  { createApp },
  {
    database,
    deleteNativePushDevice,
    listNativePushDevices,
    saveNativePushDevice
  },
  { normalizeBringCatalog },
  { displayShoppingItemIcon, shoppingItemIcon },
  { getInstructionDurationMinutes, parseInstructionSteps },
  { parseICalendar },
  { nextTaskDueDate },
  { taskIsVisibleOnDate },
  { moveDashboardWidget, normalizeDashboardLayout }
] = await Promise.all([
  import('./app.js'),
  import('./database.js'),
  import('./bringCatalog.js'),
  import('../shared/shoppingItemIcons.js'),
  import('../shared/recipeInstructions.js'),
  import('../shared/icsCalendar.js'),
  import('../shared/taskRecurrence.js'),
  import('../shared/taskVisibility.js'),
  import('../src/utils/dashboardLayout.js')
]);

const app = createApp();
const server = app.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  server.once('listening', resolve);
  server.once('error', reject);
});
const address = server.address();
const baseUrl = `http://127.0.0.1:${address.port}`;
const gotifyMessages = [];
const gotifyServer = createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const rawBody = Buffer.concat(chunks).toString('utf8');
  res.setHeader('content-type', 'application/json');

  if (req.method === 'GET' && req.url === '/version') {
    res.end(JSON.stringify({ version: '3.0.0' }));
    return;
  }
  if (req.method === 'POST' && req.url === '/application') {
    if (
      req.headers.authorization !==
      `Basic ${Buffer.from('admin:admin').toString('base64')}`
    ) {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    res.statusCode = 201;
    res.end(JSON.stringify({
      id: 7,
      name: 'LX Family',
      token: 'A.fake-gotify-token'
    }));
    return;
  }
  if (req.method === 'POST' && req.url === '/message') {
    if (req.headers['x-gotify-key'] !== 'A.fake-gotify-token') {
      res.statusCode = 401;
      res.end(JSON.stringify({ error: 'unauthorized' }));
      return;
    }
    const message = JSON.parse(rawBody || '{}');
    gotifyMessages.push(message);
    res.end(JSON.stringify({ id: gotifyMessages.length, ...message }));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ error: 'not found' }));
});
gotifyServer.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  gotifyServer.once('listening', resolve);
  gotifyServer.once('error', reject);
});
const gotifyAddress = gotifyServer.address();
const gotifyBaseUrl = `http://127.0.0.1:${gotifyAddress.port}`;
const homeAssistantActions = [];
const homeAssistantStates = [
  {
    entity_id: 'light.kitchen',
    state: 'off',
    attributes: {
      friendly_name: 'Küchenlicht',
      icon: 'mdi:lightbulb'
    },
    last_changed: '2026-07-28T08:00:00Z',
    last_updated: '2026-07-28T08:00:00Z'
  },
  {
    entity_id: 'sensor.living_temperature',
    state: '21.4',
    attributes: {
      friendly_name: 'Wohnzimmer',
      unit_of_measurement: '°C',
      device_class: 'temperature'
    },
    last_changed: '2026-07-28T08:00:00Z',
    last_updated: '2026-07-28T08:00:00Z'
  }
];
const homeAssistantServer = createServer(async (req, res) => {
  if (req.headers.authorization !== 'Bearer ha-test-token') {
    res.statusCode = 401;
    res.end(JSON.stringify({ message: 'unauthorized' }));
    return;
  }
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
  res.setHeader('content-type', 'application/json');
  if (req.method === 'GET' && req.url === '/api/') {
    res.end(JSON.stringify({ message: 'API running.' }));
    return;
  }
  if (req.method === 'GET' && req.url === '/api/states') {
    res.end(JSON.stringify(homeAssistantStates));
    return;
  }
  if (req.method === 'GET' && req.url === '/api/states/light.kitchen') {
    res.end(JSON.stringify(homeAssistantStates[0]));
    return;
  }
  if (
    req.method === 'POST' &&
    req.url === '/api/services/light/turn_on'
  ) {
    homeAssistantActions.push(body);
    homeAssistantStates[0] = {
      ...homeAssistantStates[0],
      state: 'on'
    };
    res.end(JSON.stringify([homeAssistantStates[0]]));
    return;
  }
  res.statusCode = 404;
  res.end(JSON.stringify({ message: 'not found' }));
});
homeAssistantServer.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  homeAssistantServer.once('listening', resolve);
  homeAssistantServer.once('error', reject);
});
const homeAssistantAddress = homeAssistantServer.address();
const homeAssistantBaseUrl =
  `http://127.0.0.1:${homeAssistantAddress.port}`;
const calendarFeed = [
  'BEGIN:VCALENDAR',
  'VERSION:2.0',
  'PRODID:-//LX Test Calendar//DE',
  'BEGIN:VEVENT',
  'UID:school-weekly@example.test',
  'DTSTART;TZID=Europe/Berlin:20260728T081500',
  'RRULE:FREQ=WEEKLY;COUNT=3;BYDAY=TU',
  'EXDATE;TZID=Europe/Berlin:20260804T081500',
  'SUMMARY:Schulweg gemeinsam',
  'LOCATION:Grundschule',
  'END:VEVENT',
  'BEGIN:VEVENT',
  'UID:holiday@example.test',
  'DTSTART;VALUE=DATE:20260810',
  'SUMMARY:Ferienstart',
  'DESCRIPTION:Heute beginnt die schulfreie ',
  ' Zeit.',
  'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');
const calendarServer = createServer((req, res) => {
  if (req.url !== '/family.ics') {
    res.statusCode = 404;
    res.end('not found');
    return;
  }
  res.setHeader('content-type', 'text/calendar; charset=utf-8');
  res.end(calendarFeed);
});
calendarServer.listen(0, '127.0.0.1');
await new Promise((resolve, reject) => {
  calendarServer.once('listening', resolve);
  calendarServer.once('error', reject);
});
const calendarAddress = calendarServer.address();
const calendarFeedUrl =
  `http://127.0.0.1:${calendarAddress.port}/family.ics`;

async function request(pathname, options = {}, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${pathname}`, options);
  const body = await response.json();
  assert.equal(
    response.status,
    expectedStatus,
    body.error || `${pathname} returned ${response.status}`
  );
  return { body, response };
}

after(async () => {
  app.locals.stopHomeAssistantSockets?.();
  await Promise.all([
    new Promise(resolve => server.close(resolve)),
    new Promise(resolve => gotifyServer.close(resolve)),
    new Promise(resolve => calendarServer.close(resolve)),
    new Promise(resolve => homeAssistantServer.close(resolve))
  ]);
  database.close();
  fs.rmSync(testDirectory, { recursive: true, force: true });
});

test('Bring catalog is normalized, grouped and deduplicated', () => {
  const catalog = normalizeBringCatalog({
    language: 'de-DE',
    catalog: {
      sections: [
        {
          sectionId: 'Milch & Käse',
          name: 'Milch & Käse',
          items: [
            { itemId: 'Eier', name: 'Eier' },
            { itemId: 'Eier-2', name: 'Eier' }
          ]
        },
        {
          sectionId: 'Brot & Gebäck',
          name: 'Brot & Gebäck',
          items: [{ itemId: 'Brötchen', name: 'Brötchen' }]
        }
      ]
    }
  });

  assert.equal(catalog.source, 'bring');
  assert.equal(catalog.total, 2);
  assert.equal(catalog.sections[0].icon, '🥛');
  assert.deepEqual(
    catalog.sections[0].items.map(item => item.icon),
    ['🥚']
  );
  assert.deepEqual(
    catalog.sections.flatMap(section => section.items.map(item => item.name)),
    ['Eier', 'Brötchen']
  );
});

test('shopping icons describe individual products instead of only their department', () => {
  assert.equal(shoppingItemIcon('Eier'), '🥚');
  assert.equal(shoppingItemIcon('Butter'), '🧈');
  assert.equal(shoppingItemIcon('Vollmilch'), '🥛');
  assert.equal(shoppingItemIcon('Käse'), '🧀');
  assert.equal(shoppingItemIcon('Tomaten'), '🍅');
  assert.equal(shoppingItemIcon('Pasta'), '🍝');
  assert.equal(displayShoppingItemIcon('Butter', '🥛'), '🧈');
  assert.equal(displayShoppingItemIcon('Eigene Überraschung', '🎈'), '🎈');
});

test('recipe instructions are cleaned and scheduled in a useful order', () => {
  const steps = parseInstructionSteps([
    '1, Zubereitung',
    'Die Zucchini halbieren und aushöhlen.',
    'Das Hackfleisch anbraten und die Zucchini füllen.',
    'Im Ofen bei 180 Grad ca.',
    '25 Minuten backen.',
    'In der Zwischenzeit die Tomatensauce zubereiten.',
    'Dazu passt Reis.'
  ]);

  assert.equal(steps.includes('Zubereitung'), false);
  assert.equal(
    steps.some(step =>
      step.includes('180 Grad ca. 25 Minuten backen')
    ),
    true
  );
  const riceIndex = steps.findIndex(step => step.includes('Reis'));
  const ovenIndex = steps.findIndex(step => step.includes('180 Grad'));
  assert.equal(riceIndex >= 0 && riceIndex < ovenIndex, true);
  assert.equal(
    getInstructionDurationMinutes(steps[ovenIndex]),
    25
  );
});

test('ICS calendars keep recurring, excluded and folded events useful', () => {
  const events = parseICalendar(calendarFeed, {
    targetTimeZone: 'Europe/Berlin',
    rangeStart: new Date('2026-07-01T00:00:00Z').getTime(),
    rangeEnd: new Date('2026-09-01T00:00:00Z').getTime()
  });
  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map(event => event.date),
    ['2026-07-28', '2026-08-10', '2026-08-11']
  );
  assert.equal(events[0].time, '08:15');
  assert.equal(events[1].allDay, true);
  assert.equal(events[1].notes, 'Heute beginnt die schulfreie Zeit.');
  const longRunning = parseICalendar(
    [
      'BEGIN:VCALENDAR',
      'BEGIN:VEVENT',
      'UID:old-daily',
      'DTSTART;VALUE=DATE:20200101',
      'RRULE:FREQ=DAILY',
      'SUMMARY:Langlaufende Serie',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n'),
    {
      rangeStart: new Date('2026-07-27T00:00:00Z').getTime(),
      rangeEnd: new Date('2026-07-29T23:59:59Z').getTime()
    }
  );
  assert.deepEqual(
    longRunning.map(event => event.date),
    ['2026-07-27', '2026-07-28', '2026-07-29']
  );
});

test('recurring task dates stay predictable across weekends and months', () => {
  assert.equal(nextTaskDueDate('2026-07-31', 'daily'), '2026-08-01');
  assert.equal(nextTaskDueDate('2026-07-31', 'weekdays'), '2026-08-03');
  assert.equal(nextTaskDueDate('2026-07-27', 'weekly'), '2026-08-03');
  assert.equal(nextTaskDueDate('2026-01-31', 'monthly'), '2026-02-28');
  assert.equal(nextTaskDueDate('2026-02-28', 'monthly', 31), '2026-03-31');
  assert.equal(
    nextTaskDueDate('2026-01-31', 'custom', 31, 3, 'months'),
    '2026-04-30'
  );
  assert.equal(
    nextTaskDueDate('2026-07-27', 'custom', 27, 2, 'weeks'),
    '2026-08-10'
  );
  assert.equal(
    taskIsVisibleOnDate(
      { dueDate: '2026-08-20', visibilityDaysBefore: 2 },
      '2026-08-17'
    ),
    false
  );
  assert.equal(
    taskIsVisibleOnDate(
      { dueDate: '2026-08-20', visibilityDaysBefore: 2 },
      '2026-08-18'
    ),
    true
  );
});

test('dashboard layouts remain complete, ordered and never fully hidden', () => {
  const normalized = normalizeDashboardLayout(
    {
      order: ['tasks', 'unknown', 'tasks', 'calendar'],
      hidden: ['tasks', 'calendar', 'shopping'],
      density: 'compact'
    },
    ['calendar', 'tasks', 'shopping']
  );
  assert.deepEqual(normalized.order, ['tasks', 'calendar', 'shopping']);
  assert.equal(normalized.hidden.length, 2);
  assert.equal(normalized.hidden.includes('tasks'), false);
  assert.equal(normalized.density, 'compact');
  assert.deepEqual(
    moveDashboardWidget(normalized, 'shopping', 'up').order,
    ['tasks', 'shopping', 'calendar']
  );
});

test('native API access only accepts trusted app origins', async () => {
  const allowed = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      origin: 'http://localhost',
      'access-control-request-method': 'GET',
      'access-control-request-headers': 'x-lx-client'
    }
  });
  assert.equal(allowed.status, 204);
  assert.equal(
    allowed.headers.get('access-control-allow-origin'),
    'http://localhost'
  );
  assert.match(
    allowed.headers.get('access-control-allow-headers'),
    /X-LX-Client/
  );
  assert.match(
    allowed.headers.get('access-control-allow-methods'),
    /PATCH/
  );
  assert.match(
    allowed.headers.get('access-control-allow-headers'),
    /X-LX-File-Name/
  );
  assert.match(
    allowed.headers.get('access-control-allow-headers'),
    /X-LX-Language/
  );

  const rejected = await fetch(`${baseUrl}/api/health`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://not-the-family-app.example',
      'access-control-request-method': 'GET'
    }
  });
  assert.equal(rejected.status, 403);
  assert.equal(
    rejected.headers.get('access-control-allow-origin'),
    null
  );
});

test('API errors follow the language selected by the device', async () => {
  const english = await request(
    '/api/bootstrap',
    { headers: { 'x-lx-language': 'en' } },
    401
  );
  assert.equal(english.body.error, 'Please sign in first.');

  const german = await request(
    '/api/bootstrap',
    { headers: { 'x-lx-language': 'de' } },
    401
  );
  assert.equal(german.body.error, 'Bitte zuerst anmelden.');
});

test('web app manifest follows the browser language', async () => {
  const english = await request('/manifest.json', {
    headers: { 'accept-language': 'en-GB,en;q=0.9' }
  });
  assert.equal(english.body.short_name, 'LX Family');
  assert.equal(english.body.shortcuts[0].name, 'Import a recipe');

  const german = await request('/manifest.json', {
    headers: { 'accept-language': 'de-DE,de;q=0.9' }
  });
  assert.equal(german.body.short_name, 'LX Familie');
  assert.equal(german.body.shortcuts[0].name, 'Rezept importieren');
});

test('family flow stays isolated, authorized and internally consistent', async () => {
  const health = await request('/api/health');
  assert.equal(health.body.database, 'sqlite');
  assert.equal(health.body.version, currentAppVersion);
  const appRelease = await request('/api/app/version');
  assert.equal(appRelease.body.versionName, apkMetadata.versionName);
  assert.equal(appRelease.body.versionCode, apkMetadata.versionCode);
  assert.equal(appRelease.body.apkUrl, '/apk/latest.apk');
  assert.equal(
    appRelease.body.publicApkUrl,
    'https://familie.example.test/apk/latest.apk'
  );
  assert.equal(appRelease.body.fileSizeBytes > 1_000_000, true);
  assert.equal(appRelease.body.buildKind, 'release');

  const password = 'qa-family-4711';
  const lockedFamilyRegistration = await request(
    '/api/public/register',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lx-client': 'native'
      },
      body: JSON.stringify({
        familyName: 'QA Familie ohne Verwaltung',
        badge: 'Darf nicht angelegt werden',
        password,
        members: [
          {
            name: 'Nur Haushaltsmitglied',
            position: 'familienmitglied',
            role: 'member'
          }
        ]
      })
    },
    400
  );
  assert.match(
    lockedFamilyRegistration.body.error,
    /Verwaltungsrechten/
  );

  const registration = await request(
    '/api/public/register',
    {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-lx-client': 'native'
      },
      body: JSON.stringify({
        familyName: 'QA Testfamilie',
        badge: 'Automatischer Test',
        password,
        members: [
          { name: 'Testname', position: 'mama', role: 'adult' },
          { name: 'Kind Eins', position: 'kind', role: 'child' },
          { name: 'Kind Zwei', position: 'kind', role: 'child' },
          { name: 'Zweiter Elternteil', position: 'papa', role: 'adult' },
          { name: 'Luna', position: 'haustier', role: 'pet' }
        ]
      })
    },
    201
  );
  assert.match(registration.body.sessionToken, /^[a-z0-9_-]{32,}$/i);
  const cookie = registration.response.headers
    .get('set-cookie')
    .split(';')[0];
  const authenticatedHeaders = {
    cookie,
    'content-type': 'application/json'
  };
  const [adult, childOne, childTwo, secondAdult, pet] =
    registration.body.members;

  const bootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(bootstrap.body.family.id, registration.body.family.id);
  assert.equal(bootstrap.body.appVersion, currentAppVersion);
  assert.equal(bootstrap.body.releaseNotes.version, currentAppVersion);
  assert.equal(bootstrap.body.nativePushServer.configured, false);
  assert.equal(
    bootstrap.body.nativePushServer.reason,
    'missing-service-account'
  );
  assert.ok(bootstrap.body.releaseNotes.highlights.length >= 1);
  assert.equal(bootstrap.body.members.length, 5);
  assert.equal(
    bootstrap.body.family.grandparentsHouseholdEnabled,
    true
  );

  const recipeImageBytes = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLQ9wAAAABJRU5ErkJggg==',
    'base64'
  );
  const uploadedRecipeImage = await request(
    '/api/recipes/images',
    {
      method: 'PUT',
      headers: {
        ...authenticatedHeaders,
        'content-type': 'application/octet-stream',
        'x-lx-file-name': encodeURIComponent('mein rezeptbild.png')
      },
      body: recipeImageBytes
    },
    201
  );
  assert.match(
    uploadedRecipeImage.body.image,
    /^\/api\/recipes\/images\/[a-f0-9-]{36}\?family=.+&claim=.+$/i
  );
  const recipeImageResponse = await fetch(
    `${baseUrl}${uploadedRecipeImage.body.image}`
  );
  assert.equal(recipeImageResponse.status, 200);
  assert.equal(recipeImageResponse.headers.get('content-type'), 'image/png');
  assert.deepEqual(
    Buffer.from(await recipeImageResponse.arrayBuffer()),
    recipeImageBytes
  );
  const deniedRecipeImage = await fetch(
    `${baseUrl}${uploadedRecipeImage.body.image.replace(/claim=[^&]+/, 'claim=invalid')}`
  );
  assert.equal(deniedRecipeImage.status, 404);

  const nativePushStatus = await request('/api/native-push/status', {
    headers: authenticatedHeaders
  });
  assert.equal(nativePushStatus.body.server.configured, false);
  assert.equal(
    nativePushStatus.body.server.reason,
    'missing-service-account'
  );
  assert.deepEqual(nativePushStatus.body.devices, []);
  await request(
    '/api/native-push/devices',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        installationId: 'lx-android-1234567890abcdef',
        token: 'fcm-test-token-1234567890abcdef',
        deviceName: 'Test Android-App'
      })
    },
    503
  );
  const storedNativeDevice = saveNativePushDevice({
    familyId: registration.body.family.id,
    memberId: adult.id,
    installationId: 'lx-android-1234567890abcdef',
    token: 'fcm-test-token-1234567890abcdef',
    deviceName: 'Test Android-App',
    appVersion: currentAppVersion,
    preferences: { groupChat: true, showPreviews: false }
  });
  assert.equal(storedNativeDevice.platform, 'android');
  assert.equal(
    listNativePushDevices(registration.body.family.id, {
      memberId: adult.id
    })[0].preferences.showPreviews,
    false
  );
  assert.equal(
    deleteNativePushDevice(
      registration.body.family.id,
      adult.id,
      'lx-android-1234567890abcdef'
    ),
    true
  );

  const acknowledgedReleaseNotes = await request(
    '/api/release-notes/acknowledge',
    {
      method: 'POST',
      headers: authenticatedHeaders
    }
  );
  assert.equal(acknowledgedReleaseNotes.body.version, currentAppVersion);
  assert.equal(
    acknowledgedReleaseNotes.body.member.lastSeenReleaseVersion,
    currentAppVersion
  );
  const bootstrapAfterReleaseNotes = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(bootstrapAfterReleaseNotes.body.releaseNotes, null);
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: secondAdult.id })
  });
  const secondAdultBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    secondAdultBootstrap.body.releaseNotes.version,
    currentAppVersion
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id })
  });

  const backupStatus = await request('/api/admin/database-backups', {
    headers: authenticatedHeaders
  });
  assert.equal(backupStatus.body.owner, true);
  assert.equal(backupStatus.body.settings.frequency, 'weekly');
  assert.equal(backupStatus.body.settings.dayOfWeek, 2);
  assert.equal(backupStatus.body.settings.hour, 20);

  const backupSettings = await request(
    '/api/admin/database-backups/settings',
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        enabled: true,
        frequency: 'weekly',
        dayOfWeek: 2,
        hour: 20,
        keep: 8
      })
    }
  );
  assert.equal(backupSettings.body.settings.enabled, true);

  const createdBackup = await request(
    '/api/admin/database-backups',
    { method: 'POST', headers: authenticatedHeaders },
    201
  );
  assert.equal(createdBackup.body.backup.verified, true);
  assert.equal(createdBackup.body.backups.length, 1);
  await request(
    '/api/admin/database-backups/restore',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        fileName: createdBackup.body.backup.fileName,
        familyPassword: 'falsch',
        confirmation: 'WIEDERHERSTELLEN'
      })
    },
    401
  );
  let requestedRestore = '';
  app.locals.requestDatabaseRestore = fileName => {
    requestedRestore = fileName;
    return true;
  };
  await request(
    '/api/admin/database-backups/restore',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        fileName: createdBackup.body.backup.fileName,
        familyPassword: password,
        confirmation: 'WIEDERHERSTELLEN'
      })
    },
    202
  );
  assert.equal(requestedRestore, createdBackup.body.backup.fileName);

  const updatedFamilySettings = await request('/api/family', {
    method: 'PATCH',
    headers: authenticatedHeaders,
    body: JSON.stringify({ grandparentsHouseholdEnabled: false })
  });
  assert.equal(
    updatedFamilySettings.body.family.grandparentsHouseholdEnabled,
    false
  );

  const managedProfileResponse = await request(
    '/api/members',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        name: 'Oma ohne Zugang',
        position: 'oma',
        role: 'senior',
        isManaged: true,
        pin: '1234'
      })
    },
    201
  );
  const managedProfile = managedProfileResponse.body.member;
  assert.equal(managedProfile.isManaged, true);
  assert.equal(managedProfile.hasPin, false);

  await request(
    '/api/auth/member',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberId: managedProfile.id })
    },
    403
  );
  await request(
    `/api/members/${adult.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ isManaged: true })
    },
    409
  );
  const childModuleAccess = await request(
    `/api/members/${childOne.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        allowedModules: ['calendar', 'tasks', 'not-a-module', 'tasks']
      })
    }
  );
  assert.deepEqual(
    childModuleAccess.body.member.allowedModules,
    ['calendar', 'tasks']
  );
  const customTheme = await request(
    `/api/members/${adult.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        theme: 'custom',
        customThemeCss: `:root {
          --primary: #365f55;
          --bg-card: rgba(255, 253, 248, 0.96);
          --radius-lg: 18px;
        }`
      })
    }
  );
  assert.equal(
    customTheme.body.member.customThemeCss,
    '--primary: #365f55;\n' +
      '--bg-card: rgba(255, 253, 248, 0.96);\n' +
      '--radius-lg: 18px;'
  );
  assert.equal(customTheme.body.member.theme, 'custom');

  const builtInTheme = await request(
    `/api/members/${adult.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ theme: 'linen' })
    }
  );
  assert.equal(builtInTheme.body.member.theme, 'linen');
  assert.equal(
    builtInTheme.body.member.customThemeCss,
    customTheme.body.member.customThemeCss,
    'switching to a built-in theme keeps the separate custom theme available'
  );
  await request(
    `/api/members/${adult.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        customThemeCss: '--bg-main: url(https://example.test/track);'
      })
    },
    400
  );

  const managedEvent = await request(
    '/api/resources/events',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Termin für Oma',
        date: '2026-08-03',
        time: '10:30',
        memberId: managedProfile.id
      })
    },
    201
  );
  assert.equal(managedEvent.body.record.memberId, managedProfile.id);

  await request(
    `/api/resources/events/${managedEvent.body.record.id}`,
    {
      method: 'DELETE',
      headers: authenticatedHeaders
    }
  );
  const recycleBin = await request('/api/recycle-bin', {
    headers: authenticatedHeaders
  });
  const archivedEvent = recycleBin.body.records.find(entry =>
    entry.recordId === managedEvent.body.record.id
  );
  assert.equal(archivedEvent.type, 'events');
  assert.equal(archivedEvent.record.title, 'Termin für Oma');
  assert.equal(
    archivedEvent.expiresAt - archivedEvent.deletedAt,
    30 * 24 * 60 * 60 * 1000
  );
  const restoredEvent = await request(
    `/api/recycle-bin/${archivedEvent.id}/restore`,
    {
      method: 'POST',
      headers: authenticatedHeaders
    }
  );
  assert.equal(restoredEvent.body.record.id, managedEvent.body.record.id);
  const recycleBinAfterRestore = await request('/api/recycle-bin', {
    headers: authenticatedHeaders
  });
  assert.equal(
    recycleBinAfterRestore.body.records.some(entry => entry.id === archivedEvent.id),
    false
  );

  const multiMemberEvent = await request(
    '/api/resources/events',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Elternabend',
        date: '2026-08-04',
        time: '18:30',
        memberIds: [adult.id, secondAdult.id, adult.id]
      })
    },
    201
  );
  assert.deepEqual(
    multiMemberEvent.body.record.memberIds,
    [adult.id, secondAdult.id]
  );
  assert.equal(multiMemberEvent.body.record.memberId, adult.id);
  const reassignedMultiMemberEvent = await request(
    `/api/resources/events/${multiMemberEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberIds: [childOne.id, childTwo.id] })
    }
  );
  assert.deepEqual(
    reassignedMultiMemberEvent.body.record.memberIds,
    [childOne.id, childTwo.id]
  );
  await request(
    `/api/resources/events/${multiMemberEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberIds: ['member-does-not-exist'] })
    },
    400
  );

  const reminderEvent = await request(
    '/api/resources/events',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Zahnarzt',
        date: '2026-08-03',
        time: '14:00',
        location: 'Praxis am Park',
        memberId: adult.id,
        reminders: [10, 60, 1440, 60, -5]
      })
    },
    201
  );
  assert.deepEqual(
    reminderEvent.body.record.reminders,
    [1440, 60, 10]
  );
  const reminderNow = new Date('2026-08-03T13:00:00').getTime();
  const firstReminderSweep =
    await app.locals.runEventReminderSweep(reminderNow);
  assert.equal(firstReminderSweep.delivered, 1);
  const repeatedReminderSweep =
    await app.locals.runEventReminderSweep(reminderNow);
  assert.equal(repeatedReminderSweep.delivered, 0);
  const reminderNotifications = await request('/api/notifications', {
    headers: authenticatedHeaders
  });
  const reminderNotification =
    reminderNotifications.body.notifications.find(
      notification =>
        notification.dedupeKey.startsWith('event-reminder-') &&
        notification.title.includes('Zahnarzt')
    );
  assert.ok(reminderNotification);
  assert.match(reminderNotification.body, /1 Stunde/);
  const updatedReminderEvent = await request(
    `/api/resources/events/${reminderEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ reminders: [30, 10] })
    }
  );
  assert.deepEqual(updatedReminderEvent.body.record.reminders, [30, 10]);

  const trashReminderEvent = await request(
    '/api/resources/trashEvents',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Hausmüll',
        date: '2026-08-05',
        type: 'rest',
        household: 'familie'
      })
    },
    201
  );
  assert.deepEqual(trashReminderEvent.body.record.reminders, [1440]);
  const trashReminderNow = new Date('2026-08-04T09:00:00').getTime();
  const firstTrashReminderSweep =
    await app.locals.runEventReminderSweep(trashReminderNow);
  assert.equal(firstTrashReminderSweep.delivered, 1);
  const repeatedTrashReminderSweep =
    await app.locals.runEventReminderSweep(trashReminderNow);
  assert.equal(repeatedTrashReminderSweep.delivered, 0);
  const trashReminderNotifications = await request('/api/notifications', {
    headers: authenticatedHeaders
  });
  const trashReminderNotification =
    trashReminderNotifications.body.notifications.find(
      notification =>
        notification.dedupeKey.startsWith('trash-reminder-') &&
        notification.title.includes('Morgen: Hausmüll')
    );
  assert.ok(trashReminderNotification);
  assert.match(trashReminderNotification.body, /Morgen wird Hausmüll/);
  const disabledTrashReminder = await request(
    `/api/resources/trashEvents/${trashReminderEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ reminders: [] })
    }
  );
  assert.deepEqual(disabledTrashReminder.body.record.reminders, []);

  const childBirthday = await request(
    `/api/members/${childOne.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ birthDate: '2017-08-10' })
    }
  );
  assert.equal(childBirthday.body.member.birthDate, '2017-08-10');

  const childNotificationEvent = await request(
    '/api/resources/events',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Kindergeburtstag',
        date: '2026-08-06',
        time: '15:00',
        memberId: childOne.id
      })
    },
    201
  );
  await request(
    `/api/resources/events/${childNotificationEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        time: '16:00',
        endDate: '2026-08-07',
        endTime: '12:00'
      })
    }
  );
  const allDayEvent = await request(
    '/api/resources/events',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Familienwochenende',
        date: '2026-08-07',
        time: '09:00',
        allDay: true,
        endDate: '2026-08-10',
        endTime: '18:00',
        memberId: 'all'
      })
    },
    201
  );
  assert.equal(allDayEvent.body.record.allDay, true);
  assert.equal(allDayEvent.body.record.time, '');
  assert.equal(allDayEvent.body.record.endTime, '');
  assert.equal(allDayEvent.body.record.endDate, '2026-08-10');
  await request(
    `/api/resources/events/${allDayEvent.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ endDate: '2026-08-06' })
    },
    400
  );
  await request(
    `/api/resources/events/${childNotificationEvent.body.record.id}`,
    { method: 'DELETE', headers: authenticatedHeaders }
  );

  const managedTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Unterlagen mitnehmen',
        memberId: managedProfile.id,
        stars: 50
      })
    },
    201
  );
  assert.equal(managedTask.body.record.memberId, managedProfile.id);
  assert.equal(managedTask.body.record.stars, 0);
  assert.deepEqual(managedTask.body.record.rotationMemberIds, []);

  const managedBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    managedBootstrap.body.members.find(
      member => member.id === managedProfile.id
    )?.isManaged,
    true
  );

  const liveResponse = await fetch(`${baseUrl}/api/live`, {
    headers: { cookie }
  });
  assert.equal(liveResponse.status, 200);
  const liveReader = liveResponse.body.getReader();
  assert.match(
    new TextDecoder().decode((await liveReader.read()).value),
    /event: ready/
  );

  const bulk = await request('/api/resources/events/bulk', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      records: [
        { id: 'event-one', title: 'Termin eins' },
        { id: 'event-two', title: 'Termin zwei' }
      ]
    })
  });
  assert.equal(bulk.body.records.length, 2);
  assert.match(
    new TextDecoder().decode((await liveReader.read()).value),
    /event: family-update/
  );
  await liveReader.cancel();

  const calendarSubscription = await request(
    '/api/calendar/subscriptions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        name: 'Schule',
        url: calendarFeedUrl,
        color: '#2563eb',
        memberIds: [childOne.id, childTwo.id],
        household: 'familie'
      })
    },
    201
  );
  assert.equal(calendarSubscription.body.warning, '');
  assert.equal(calendarSubscription.body.records.length, 3);
  assert.equal(calendarSubscription.body.subscription.host, '127.0.0.1');
  assert.equal(
    Object.hasOwn(calendarSubscription.body.subscription, 'secretEncrypted'),
    false
  );
  const subscriptions = await request('/api/calendar/subscriptions', {
    headers: authenticatedHeaders
  });
  assert.equal(subscriptions.body.subscriptions.length, 1);
  const calendarBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  const subscribedEvents = calendarBootstrap.body.resources.events.filter(
    event => event.sourceId === calendarSubscription.body.subscription.id
  );
  assert.equal(subscribedEvents.length, 3);
  assert.equal(subscribedEvents.every(event => event.readOnly), true);
  assert.equal(subscribedEvents[0].memberId, childOne.id);
  assert.deepEqual(subscribedEvents[0].memberIds, [childOne.id, childTwo.id]);
  assert.deepEqual(
    calendarSubscription.body.subscription.memberIds,
    [childOne.id, childTwo.id]
  );
  await request(
    `/api/resources/events/${subscribedEvents[0].id}`,
    {
      method: 'DELETE',
      headers: authenticatedHeaders
    },
    409
  );

  const writableCalDav = await request(
    '/api/calendar/subscriptions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        provider: 'caldav',
        syncMode: 'two-way',
        name: 'Schreibbarer NAS-Kalender',
        url: calendarFeedUrl,
        username: 'familie',
        password: 'app-passwort',
        memberId: 'all',
        household: 'familie'
      })
    },
    201
  );
  assert.equal(writableCalDav.body.subscription.syncMode, 'two-way');
  assert.match(writableCalDav.body.warning, /HTTP 200/);
  await request(
    `/api/calendar/subscriptions/${writableCalDav.body.subscription.id}`,
    { method: 'DELETE', headers: authenticatedHeaders }
  );

  const task = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Testmission',
        memberId: childOne.id,
        stars: 15,
        dueDate: '2026-07-27',
        repeatRule: 'weekly',
        completed: false
      })
    },
    201
  );

  const customScheduledTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Bad gründlich putzen',
        memberId: childOne.id,
        category: 'Bad',
        stars: 20,
        dueDate: '2026-08-20',
        repeatRule: 'custom',
        repeatInterval: 3,
        repeatUnit: 'months',
        visibilityDaysBefore: 2
      })
    },
    201
  );
  assert.equal(customScheduledTask.body.record.category, 'Bad');
  assert.equal(customScheduledTask.body.record.repeatRule, 'custom');
  assert.equal(customScheduledTask.body.record.repeatInterval, 3);
  assert.equal(customScheduledTask.body.record.repeatUnit, 'months');
  assert.equal(customScheduledTask.body.record.visibilityDaysBefore, 2);

  const editableTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Flur aufräumen',
        description: 'Schuhe ordentlich ins Regal stellen',
        memberId: childOne.id,
        stars: 10
      })
    },
    201
  );
  const editedTask = await request(
    `/api/resources/tasks/${editableTask.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Flur und Schuhe aufräumen',
        description: 'Danach kurz durchfegen',
        dueDate: '2026-08-02',
        dueTime: '17:30',
        completed: true,
        completionStatus: 'approved'
      })
    }
  );
  assert.equal(editedTask.body.record.title, 'Flur und Schuhe aufräumen');
  assert.equal(editedTask.body.record.description, 'Danach kurz durchfegen');
  assert.equal(editedTask.body.record.dueTime, '17:30');
  assert.equal(editedTask.body.record.completed, false);
  assert.equal(editedTask.body.record.completionStatus, 'open');
  await request(
    `/api/resources/tasks/${editableTask.body.record.id}`,
    { method: 'DELETE', headers: authenticatedHeaders }
  );
  await request(
    `/api/resources/tasks/${editableTask.body.record.id}`,
    { method: 'DELETE', headers: authenticatedHeaders },
    404
  );

  const directMessage = await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Nur für Kind Eins',
        target: childOne.id
      })
    },
    201
  );
  assert.equal(directMessage.body.record.senderId, adult.id);

  await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Unpassendes Haustier-DM',
        target: pet.id
      })
    },
    403
  );
  await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Verwaltete Profile chatten nicht',
        target: managedProfile.id
      })
    },
    403
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: pet.id })
  });
  const petBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.deepEqual(petBootstrap.body.resources.chatMessages, []);
  await request(
    `/api/tasks/${task.body.record.id}/toggle`,
    {
      method: 'POST',
      headers: authenticatedHeaders
    },
    403
  );
  await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Haustiere schreiben nicht',
        target: 'group'
      })
    },
    403
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id, familyPassword: password })
  });

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childTwo.id })
  });
  const childTwoBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    childTwoBootstrap.body.resources.chatMessages.some(
      message => message.id === directMessage.body.record.id
    ),
    false
  );
  assert.equal(
    childTwoBootstrap.body.notifications.some(
      notification => notification.eventKey === 'directMessages'
    ),
    false
  );

  await request(
    '/api/auth/member',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberId: adult.id })
    },
    401
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id, familyPassword: password })
  });
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });

  const childOneBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    childOneBootstrap.body.members.some(
      member => member.id === managedProfile.id
    ),
    false
  );
  assert.equal(
    childOneBootstrap.body.resources.events.some(
      event => event.memberId === managedProfile.id
    ),
    false
  );
  assert.equal(
    childOneBootstrap.body.resources.tasks.some(
      entry => entry.memberId === managedProfile.id
    ),
    false
  );
  assert.equal(
    childOneBootstrap.body.resources.chatMessages.some(
      message => message.id === directMessage.body.record.id
    ),
    true
  );
  assert.equal(
    childOneBootstrap.body.notifications.some(
      notification => notification.eventKey === 'taskAssigned'
    ),
    true
  );
  assert.equal(
    childOneBootstrap.body.notifications.some(
      notification => notification.eventKey === 'directMessages'
    ),
    true
  );
  for (const kind of ['created', 'updated', 'deleted']) {
    assert.equal(
      childOneBootstrap.body.notifications.some(
        notification =>
          notification.eventKey === 'events' &&
          notification.dedupeKey ===
            `event-${kind}-${childNotificationEvent.body.record.id}`
      ),
      true
    );
  }
  const moodUpdate = await request(
    '/api/resources/moodCheckins',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ mood: 'okay' })
    },
    201
  );
  const moodHelp = await request(
    '/api/resources/moodCheckins',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ mood: 'hilfe' })
    },
    201
  );
  assert.equal(moodUpdate.body.record.memberId, childOne.id);
  assert.equal(moodHelp.body.record.memberId, childOne.id);
  await request(
    '/api/calendar/subscriptions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        name: 'Nicht erlaubt',
        url: calendarFeedUrl
      })
    },
    403
  );

  const completionRequest = await request(`/api/tasks/${task.body.record.id}/toggle`, {
    method: 'POST',
    headers: authenticatedHeaders
  });
  assert.equal(completionRequest.body.task.completed, false);
  assert.equal(
    completionRequest.body.task.completionStatus,
    'pending_approval'
  );
  assert.equal(completionRequest.body.action, 'approval_requested');
  assert.equal(completionRequest.body.member, null);

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      memberId: secondAdult.id,
      familyPassword: password
    })
  });
  await request(
    `/api/tasks/${task.body.record.id}/review`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ approved: true })
    },
    403
  );
  await request(
    `/api/tasks/${task.body.record.id}/toggle`,
    {
      method: 'POST',
      headers: authenticatedHeaders
    },
    403
  );
  const protectedTaskPatch = await request(
    `/api/resources/tasks/${task.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        completed: true,
        completionStatus: 'approved'
      })
    }
  );
  assert.equal(protectedTaskPatch.body.record.completed, false);
  assert.equal(
    protectedTaskPatch.body.record.completionStatus,
    'pending_approval'
  );

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id })
  });
  const approval = await request(
    `/api/tasks/${task.body.record.id}/review`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ approved: true })
    }
  );
  assert.equal(approval.body.task.completed, true);
  assert.equal(approval.body.task.completionStatus, 'approved');
  assert.equal(approval.body.member.stars, 15);
  assert.equal(approval.body.nextTask.dueDate, '2026-08-03');
  assert.equal(approval.body.nextTask.completed, false);

  const sharedTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Gemeinsam den Tisch decken',
        memberId: childOne.id,
        assignmentMode: 'shared',
        eligibleMemberIds: [childOne.id, secondAdult.id],
        stars: 10
      })
    },
    201
  );
  assert.equal(sharedTask.body.record.assignmentMode, 'shared');
  assert.deepEqual(
    sharedTask.body.record.eligibleMemberIds,
    [childOne.id, secondAdult.id]
  );
  const sharedChildCompletion = await request(
    `/api/tasks/${sharedTask.body.record.id}/complete-as`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberId: childOne.id })
    }
  );
  assert.equal(sharedChildCompletion.body.action, 'approval_requested');
  assert.equal(
    sharedChildCompletion.body.task.completionRequestedByMemberId,
    childOne.id
  );
  const sharedApproval = await request(
    `/api/tasks/${sharedTask.body.record.id}/review`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ approved: true })
    }
  );
  assert.equal(sharedApproval.body.task.completedByMemberId, childOne.id);
  assert.equal(sharedApproval.body.task.completedByName, childOne.name);
  assert.equal(sharedApproval.body.member.id, childOne.id);
  assert.equal(sharedApproval.body.member.stars, 25);

  const sharedAdultTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Gemeinsam Blumen gießen',
        memberId: adult.id,
        assignmentMode: 'shared',
        eligibleMemberIds: [adult.id, secondAdult.id],
        stars: 7
      })
    },
    201
  );
  const sharedAdultCompletion = await request(
    `/api/tasks/${sharedAdultTask.body.record.id}/complete-as`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ memberId: secondAdult.id })
    }
  );
  assert.equal(sharedAdultCompletion.body.task.completed, true);
  assert.equal(
    sharedAdultCompletion.body.task.completedByMemberId,
    secondAdult.id
  );
  assert.equal(sharedAdultCompletion.body.member.id, secondAdult.id);
  assert.equal(sharedAdultCompletion.body.member.stars, 7);

  const adultNotifications = await request('/api/notifications', {
    headers: authenticatedHeaders
  });
  assert.equal(adultNotifications.body.unreadCount > 0, true);
  assert.equal(
    adultNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'moodUpdates' &&
        notification.dedupeKey === `mood-${moodUpdate.body.record.id}`
    ),
    true
  );
  assert.equal(
    adultNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'moodHelp' &&
        notification.dedupeKey === `mood-${moodHelp.body.record.id}`
    ),
    true
  );
  const unreadNotification = adultNotifications.body.notifications.find(
    notification => !notification.read
  );
  const markedNotification = await request(
    `/api/notifications/${unreadNotification.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ read: true })
    }
  );
  assert.equal(markedNotification.body.notification.read, true);
  const allRead = await request('/api/notifications/read-all', {
    method: 'POST',
    headers: authenticatedHeaders
  });
  assert.equal(allRead.body.unreadCount, 0);

  const gotifySetup = await request(
    '/api/integrations/gotify/setup',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        baseUrl: gotifyBaseUrl,
        username: 'admin',
        password: 'admin',
        plannerUrl: baseUrl
      })
    },
    201
  );
  assert.equal(gotifySetup.body.integration.connected, true);
  assert.equal(gotifySetup.body.integration.rules.directMessages, false);
  assert.equal(gotifyMessages[0].title, 'LX Family ist verbunden');

  await request('/api/integrations/gotify/test', {
    method: 'POST',
    headers: authenticatedHeaders
  });
  assert.equal(gotifyMessages[1].title, 'Test von LX Family');

  await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Gotify Gruppenprüfung',
        target: 'group'
      })
    },
    201
  );
  for (let attempt = 0; attempt < 30 && gotifyMessages.length < 3; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  assert.equal(gotifyMessages[2].title, `Familienchat · ${adult.name}`);
  assert.equal(
    gotifyMessages[2].message,
    'Eine neue Nachricht ist da.'
  );

  const homeAssistantSetup = await request(
    '/api/integrations/home-assistant/setup',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        baseUrl: homeAssistantBaseUrl,
        token: 'ha-test-token'
      })
    },
    201
  );
  assert.equal(homeAssistantSetup.body.integration.connected, true);
  assert.equal(homeAssistantSetup.body.entities.length, 2);
  assert.equal(
    Object.hasOwn(homeAssistantSetup.body.integration, 'token'),
    false
  );

  const homeAssistantSelection = await request(
    '/api/integrations/home-assistant',
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        selectedEntities: [
          {
            entityId: 'light.kitchen',
            name: 'Küchenlicht',
            allowControl: true,
            profileIds: [childOne.id]
          },
          {
            entityId: 'sensor.living_temperature',
            name: 'Wohnzimmer',
            allowControl: false,
            profileIds: []
          }
        ]
      })
    }
  );
  assert.equal(
    homeAssistantSelection.body.integration.selectedEntities.length,
    2
  );
  const adultHomeStates = await request(
    '/api/integrations/home-assistant/states',
    { headers: authenticatedHeaders }
  );
  assert.equal(adultHomeStates.body.entities.length, 2);

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });
  const childHomeStates = await request(
    '/api/integrations/home-assistant/states',
    { headers: authenticatedHeaders }
  );
  assert.deepEqual(
    childHomeStates.body.entities.map(entity => entity.entityId),
    ['light.kitchen']
  );
  const controlledLight = await request(
    '/api/integrations/home-assistant/actions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        entityId: 'light.kitchen',
        action: 'turn_on'
      })
    }
  );
  assert.equal(controlledLight.body.entities[0].state, 'on');
  assert.deepEqual(homeAssistantActions[0], {
    entity_id: 'light.kitchen'
  });

  const problemReport = await request(
    '/api/problem-reports',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        category: 'problem',
        title: 'Kalenderknopf reagiert nicht',
        description: 'Beim ersten Tippen passiert nichts.',
        page: 'calendar',
        clientInfo: 'Test Browser'
      })
    },
    201
  );
  assert.equal(problemReport.body.report.appVersion, currentAppVersion);
  await request(
    '/api/problem-reports',
    { headers: authenticatedHeaders },
    403
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      memberId: adult.id,
      familyPassword: password
    })
  });
  const adultProblemNotifications = await request(
    '/api/notifications',
    { headers: authenticatedHeaders }
  );
  assert.equal(
    adultProblemNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'problemReports' &&
        notification.dedupeKey ===
          `problem-new-${problemReport.body.report.id}`
    ),
    true
  );
  const problemReports = await request('/api/problem-reports', {
    headers: authenticatedHeaders
  });
  assert.equal(problemReports.body.reports.length, 1);
  const resolvedProblem = await request(
    `/api/problem-reports/${problemReport.body.report.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ status: 'resolved' })
    }
  );
  assert.equal(resolvedProblem.body.report.status, 'resolved');
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });
  const reporterNotifications = await request('/api/notifications', {
    headers: authenticatedHeaders
  });
  assert.equal(
    reporterNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'problemReports' &&
        notification.dedupeKey ===
          `problem-resolved-${problemReport.body.report.id}`
    ),
    true
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      memberId: adult.id,
      familyPassword: password
    })
  });

  const pushStatus = await request('/api/push/status', {
    headers: authenticatedHeaders
  });
  assert.equal(pushStatus.body.devices.length, 0);
  assert.ok(pushStatus.body.publicKey.length > 60);
  assert.equal(pushStatus.body.defaults.directMessages, true);
  assert.equal(pushStatus.body.defaults.moodUpdates, true);
  assert.equal(pushStatus.body.defaults.problemReports, true);
  assert.equal(pushStatus.body.defaults.familyConnections, true);
  assert.equal(pushStatus.body.defaults.pocketMoney, true);
  assert.equal(pushStatus.body.defaults.showPreviews, false);

  const pushRegistration = await request(
    '/api/push/subscriptions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        deviceName: 'QA Browser',
        subscription: {
          endpoint: 'https://push.example.test/subscriptions/qa-browser',
          keys: {
            p256dh: 'qa-public-browser-key',
            auth: 'qa-auth-key'
          }
        },
        preferences: {
          groupChat: true,
          directMessages: false,
          showPreviews: false
        }
      })
    },
    201
  );
  assert.equal(pushRegistration.body.device.deviceName, 'QA Browser');
  assert.equal(
    pushRegistration.body.device.preferences.directMessages,
    false
  );
  const currentPushStatus = await request(
    '/api/push/status?endpoint=' +
      encodeURIComponent('https://push.example.test/subscriptions/qa-browser'),
    { headers: authenticatedHeaders }
  );
  assert.equal(
    currentPushStatus.body.currentDeviceId,
    pushRegistration.body.device.id
  );

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });
  const childPushRegistration = await request(
    '/api/push/subscriptions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        deviceName: 'QA Browser',
        subscription: {
          endpoint: 'https://push.example.test/subscriptions/qa-browser',
          keys: {
            p256dh: 'qa-public-browser-key',
            auth: 'qa-auth-key'
          }
        },
        preferences: {
          groupChat: false,
          taskAssigned: true,
          taskApproval: true,
          showPreviews: false
        }
      })
    },
    201
  );
  assert.notEqual(
    childPushRegistration.body.device.id,
    pushRegistration.body.device.id
  );
  const childPushStatus = await request(
    '/api/push/status?endpoint=' +
      encodeURIComponent('https://push.example.test/subscriptions/qa-browser'),
    { headers: authenticatedHeaders }
  );
  assert.equal(
    childPushStatus.body.currentDeviceId,
    childPushRegistration.body.device.id
  );
  const childPushDelete = await request('/api/push/subscriptions', {
    method: 'DELETE',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      endpoint: 'https://push.example.test/subscriptions/qa-browser'
    })
  });
  assert.equal(childPushDelete.body.unsubscribeBrowser, false);

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({
      memberId: adult.id,
      familyPassword: password
    })
  });
  const pushDevices = await request('/api/push/devices', {
    headers: authenticatedHeaders
  });
  assert.equal(pushDevices.body.devices.length, 1);
  assert.equal(pushDevices.body.devices[0].memberName, adult.name);

  await request(
    `/api/push/devices/${pushRegistration.body.device.id}`,
    {
      method: 'DELETE',
      headers: authenticatedHeaders
    }
  );
  const pushStatusAfterDelete = await request('/api/push/status', {
    headers: authenticatedHeaders
  });
  assert.equal(pushStatusAfterDelete.body.devices.length, 0);

  const dashboardLink = await request(
    '/api/resources/dashboardLinks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        id: 'link-kind-eins',
        memberId: childOne.id,
        title: 'Die Maus',
        url: 'https://www.youtube.com/@diemaus',
        coverUrl: 'https://evil.example/cover.jpg'
      })
    },
    201
  );
  assert.equal(dashboardLink.body.record.kind, 'youtube');
  assert.equal(dashboardLink.body.record.coverUrl, '');

  const spotifyWidget = await request(
    '/api/resources/dashboardLinks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        id: 'spotify-kind-eins',
        memberId: childOne.id,
        title: 'Tanzpause',
        url: 'https://open.spotify.com/playlist/37i9dQZF1DX0Yxoavh5qJV'
      })
    },
    201
  );
  assert.equal(spotifyWidget.body.record.kind, 'spotify');
  assert.equal(spotifyWidget.body.record.color, '#1db954');

  await request(
    '/api/resources/dashboardLinks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Unsicher',
        url: 'https://example.com/channel'
      })
    },
    400
  );

  const reset = await request(
    `/api/admin/members/${childOne.id}/reset-stars`,
    { method: 'POST', headers: authenticatedHeaders }
  );
  assert.equal(reset.body.member.stars, 0);

  const adultWithPoints = await request(`/api/members/${adult.id}`, {
    method: 'PATCH',
    headers: authenticatedHeaders,
    body: JSON.stringify({ stars: 37 })
  });
  assert.equal(adultWithPoints.body.member.stars, 37);
  const adultReset = await request(
    `/api/admin/members/${adult.id}/reset-stars`,
    { method: 'POST', headers: authenticatedHeaders }
  );
  assert.equal(adultReset.body.member.stars, 0);

  const clearedTasks = await request('/api/admin/tasks', {
    method: 'DELETE',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id, completedOnly: true })
  });
  assert.equal(clearedTasks.body.deleted, 2);
  const remainingChildTask = clearedTasks.body.records.find(
    entry => entry.memberId === childOne.id && entry.title === 'Testmission'
  );
  assert.equal(Boolean(remainingChildTask), true);
  assert.equal(remainingChildTask.dueDate, '2026-08-03');

  const meal = await request(
    '/api/resources/meals',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        id: 'meal-removable',
        day: 'Montag',
        meal: 'Mittagessen',
        recipe: 'Pfannkuchen'
      })
    },
    201
  );
  await request(`/api/resources/meals/${meal.body.record.id}`, {
    method: 'DELETE',
    headers: authenticatedHeaders
  });

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });
  const childDashboard = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    childDashboard.body.resources.dashboardLinks[0].title,
    'Die Maus'
  );
  assert.equal(
    childDashboard.body.resources.dashboardLinks.some(
      link => link.kind === 'spotify' && link.title === 'Tanzpause'
    ),
    true
  );
  await request(
    '/api/resources/dashboardLinks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Nicht erlaubt',
        url: 'https://www.youtube.com/@blocked'
      })
    },
    403
  );
  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id, familyPassword: password })
  });

  const routine = await request(
    '/api/resources/dailyRoutines',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Morgenstart',
        icon: '☀️',
        timeOfDay: 'morning',
        steps: [
          { id: 'wake-up', title: 'Aufstehen', icon: '1' },
          { id: 'brush', title: 'Zähne putzen', icon: '2' }
        ]
      })
    },
    201
  );
  assert.equal(routine.body.record.steps.length, 2);

  const schoolItem = await request(
    '/api/resources/schoolItems',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        kind: 'homework',
        title: 'Lesen Seite 12',
        subject: 'Deutsch',
        date: '2026-07-27'
      })
    },
    201
  );
  const futureLessonDate = new Date();
  futureLessonDate.setDate(futureLessonDate.getDate() + 7);
  const futureLessonDateKey = futureLessonDate.toLocaleDateString('en-CA');
  const lesson = await request(
    '/api/resources/schoolItems',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        kind: 'lesson',
        title: 'Mathematik',
        subject: 'Mathe',
        weekday: futureLessonDate.getDay(),
        period: 2,
        time: '08:45',
        endTime: '09:30',
        room: 'A 12',
        teacher: 'Frau Beispiel',
        color: '#648b62',
        cancellations: [futureLessonDateKey, '2020-01-01']
      })
    },
    201
  );
  assert.equal(lesson.body.record.period, 2);
  assert.equal(lesson.body.record.endTime, '09:30');
  assert.equal(lesson.body.record.color, '#648b62');
  assert.deepEqual(lesson.body.record.cancellations, [futureLessonDateKey]);
  const schoolProfileSetting = await request(
    `/api/kids/${childOne.id}/style`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({ schoolEnabled: true })
    }
  );
  assert.equal(schoolProfileSetting.body.record.schoolEnabled, true);
  const poll = await request(
    '/api/resources/familyPolls',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        question: 'Was essen wir?',
        options: [
          { id: 'pizza', label: 'Pizza', emoji: '🍕' },
          { id: 'pasta', label: 'Nudeln', emoji: '🍝' }
        ]
      })
    },
    201
  );
  const mission = await request(
    '/api/resources/familyMissions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Gemeinsam den Tisch decken',
        memberIds: [childOne.id, childTwo.id],
        icon: '🤝'
      })
    },
    201
  );
  const familyContact = await request(
    '/api/resources/familyContacts',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        name: 'Kinderarzt Muster',
        category: 'medical',
        phone: '0123 456789',
        email: 'praxis@example.test',
        address: 'Musterweg 1',
        notes: 'Impfpass mitnehmen'
      })
    },
    201
  );
  assert.equal(familyContact.body.record.category, 'medical');
  assert.equal(familyContact.body.record.phone, '0123 456789');
  await request(
    '/api/resources/encouragements',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        message: 'Du schaffst das!',
        icon: '💛'
      })
    },
    201
  );
  await request(
    '/api/resources/savingsGoals',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Neues Fahrrad',
        targetCents: 15000,
        icon: '🚲'
      })
    },
    201
  );
  const settings = await request(
    '/api/resources/familySettings',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        id: 'family-settings',
        quietHoursEnabled: true,
        quietStart: '20:30',
        quietEnd: '07:00',
        mediaScheduleEnabled: true,
        mediaStart: '15:00',
        mediaEnd: '19:30',
        disabledModules: ['trash', 'mail', 'invalid-module', 'trash'],
        emergencyContacts: [
          {
            id: 'doctor',
            name: 'Kinderarzt',
            phone: '0123 456789',
            note: 'Impfpass mitnehmen'
          }
        ]
      })
    },
    201
  );
  assert.equal(settings.body.record.quietStart, '20:30');
  assert.equal(settings.body.record.emergencyContacts.length, 1);
  assert.deepEqual(settings.body.record.disabledModules, ['trash', 'mail']);
  const settingsWithoutModuleField = await request(
    `/api/resources/familySettings/${settings.body.record.id}`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({ quietStart: '21:00' })
    }
  );
  assert.deepEqual(
    settingsWithoutModuleField.body.record.disabledModules,
    ['trash', 'mail']
  );

  const childWithStars = await request(`/api/members/${childOne.id}`, {
    method: 'PATCH',
    headers: authenticatedHeaders,
    body: JSON.stringify({ stars: 40 })
  });
  assert.equal(childWithStars.body.member.stars, 40);
  const pocketTransaction = await request(
    '/api/pocket-money/transactions',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        amountCents: 250,
        starCost: 20,
        note: '20 Sterne umgewandelt'
      })
    },
    201
  );
  assert.equal(pocketTransaction.body.transaction.amountCents, 250);
  assert.equal(pocketTransaction.body.member.stars, 20);

  const rotatingTask = await request(
    '/api/resources/tasks',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Spülmaschine',
        memberId: childOne.id,
        rotationMemberIds: [childOne.id, childTwo.id],
        stars: 5,
        dueDate: '2026-07-27',
        repeatRule: 'daily'
      })
    },
    201
  );

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: childOne.id })
  });
  await request(
    '/api/resources/dailyRoutines',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Selbst angelegt',
        steps: [{ id: 'unsafe', title: 'Nicht erlaubt' }]
      })
    },
    403
  );
  const childContacts = await request('/api/resources/familyContacts', {
    headers: authenticatedHeaders
  });
  assert.deepEqual(childContacts.body.records, []);
  const routineStep = await request(
    `/api/routines/${routine.body.record.id}/toggle`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ stepId: 'wake-up' })
    }
  );
  assert.equal(
    routineStep.body.record.completions[
      new Date().toLocaleDateString('en-CA')
    ].includes('wake-up'),
    true
  );
  const checkedSchoolItem = await request(
    `/api/school/${schoolItem.body.record.id}/toggle`,
    { method: 'POST', headers: authenticatedHeaders }
  );
  assert.equal(checkedSchoolItem.body.record.completed, true);
  const voted = await request(
    `/api/polls/${poll.body.record.id}/vote`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ optionId: 'pizza' })
    }
  );
  assert.equal(voted.body.record.votes[childOne.id], 'pizza');
  const missionProgress = await request(
    `/api/family-missions/${mission.body.record.id}/toggle`,
    { method: 'POST', headers: authenticatedHeaders }
  );
  assert.equal(
    missionProgress.body.record.completedMemberIds.includes(childOne.id),
    true
  );
  const kidStyle = await request(
    `/api/kids/${childOne.id}/style`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({ buddy: '🦊', heroTitle: 'Waldheld' })
    }
  );
  assert.equal(kidStyle.body.record.buddy, '🦊');
  assert.equal(kidStyle.body.record.schoolEnabled, true);
  const childCannotDisableSchool = await request(
    `/api/kids/${childOne.id}/style`,
    {
      method: 'PUT',
      headers: authenticatedHeaders,
      body: JSON.stringify({ schoolEnabled: false })
    }
  );
  assert.equal(childCannotDisableSchool.body.record.schoolEnabled, true);
  await request(
    `/api/tasks/${rotatingTask.body.record.id}/toggle`,
    { method: 'POST', headers: authenticatedHeaders }
  );

  await request('/api/auth/member', {
    method: 'POST',
    headers: authenticatedHeaders,
    body: JSON.stringify({ memberId: adult.id, familyPassword: password })
  });
  const rotated = await request(
    `/api/tasks/${rotatingTask.body.record.id}/review`,
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({ approved: true })
    }
  );
  assert.equal(rotated.body.nextTask.memberId, childTwo.id);
  assert.deepEqual(
    rotated.body.nextTask.rotationMemberIds,
    [childOne.id, childTwo.id]
  );

  const familyLifeBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(familyLifeBootstrap.body.resources.dailyRoutines.length, 1);
  assert.equal(familyLifeBootstrap.body.resources.schoolItems.length, 2);
  assert.equal(familyLifeBootstrap.body.resources.familyContacts.length, 1);
  assert.equal(
    familyLifeBootstrap.body.resources.pocketMoneyTransactions.length,
    1
  );
  assert.equal(familyLifeBootstrap.body.resources.kidProfiles.length, 1);

  const secondPassword = 'qa-family-5722';
  const secondRegistration = await request(
    '/api/public/register',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        familyName: 'QA Elternfamilie',
        password: secondPassword,
        members: [
          { name: 'Zweite Mama', position: 'mama', role: 'adult' }
        ]
      })
    },
    201
  );
  const secondCookie = secondRegistration.response.headers
    .get('set-cookie')
    .split(';')[0];
  const secondHeaders = {
    cookie: secondCookie,
    'content-type': 'application/json'
  };

  const relationshipRequest = await request(
    '/api/family/relationships',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        targetFamilyId: secondRegistration.body.family.id,
        relationType: 'parent'
      })
    },
    201
  );
  assert.equal(relationshipRequest.body.relationship.status, 'pending');

  const incomingConnectionNotifications = await request(
    '/api/notifications',
    { headers: secondHeaders }
  );
  assert.equal(
    incomingConnectionNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'familyConnections' &&
        notification.dedupeKey ===
          `family-connection-request-${relationshipRequest.body.relationship.id}`
    ),
    true
  );
  const incomingRelationships = await request('/api/family/relationships', {
    headers: secondHeaders
  });
  assert.equal(incomingRelationships.body.relationships[0].direction, 'incoming');
  assert.deepEqual(
    incomingRelationships.body.relationships[0].otherFamily.members,
    []
  );

  await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}`,
    {
      method: 'PATCH',
      headers: secondHeaders,
      body: JSON.stringify({ status: 'accepted' })
    }
  );
  const acceptedConnectionNotifications = await request(
    '/api/notifications',
    { headers: authenticatedHeaders }
  );
  assert.equal(
    acceptedConnectionNotifications.body.notifications.some(
      notification =>
        notification.eventKey === 'familyConnections' &&
        notification.dedupeKey ===
          `family-connection-accepted-${relationshipRequest.body.relationship.id}`
    ),
    true
  );
  const acceptedRelationships = await request('/api/family/relationships', {
    headers: authenticatedHeaders
  });
  assert.equal(acceptedRelationships.body.relationships[0].status, 'accepted');
  assert.equal(
    acceptedRelationships.body.relationships[0].otherFamily.members[0].name,
    'Zweite Mama'
  );
  assert.equal(
    acceptedRelationships.body.relationships[0].otherFamily.members[0].position,
    'mama'
  );
  const acceptedFromSecondFamily = await request(
    '/api/family/relationships',
    { headers: secondHeaders }
  );
  assert.equal(
    acceptedFromSecondFamily.body.relationships[0].otherFamily.members.some(
      member => member.id === managedProfile.id
    ),
    false
  );

  const familyGrants = await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}/grants`,
    {
      method: 'PATCH',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        sharedCalendar: true,
        tasks: true,
        rewards: true,
        pocketMoney: true
      })
    }
  );
  assert.equal(familyGrants.body.relationship.grantsToOther.tasks, true);

  const secondFamilyCapabilities = await request(
    '/api/family/relationships',
    { headers: secondHeaders }
  );
  assert.equal(
    secondFamilyCapabilities.body.relationships[0].grantsFromOther.tasks,
    true
  );

  const familyLetter = await request(
    '/api/family/mail',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        recipientFamilyId: secondRegistration.body.family.id,
        subject: 'Gemeinsamer Sonntag',
        body: 'Habt ihr Lust auf Kaffee und Kuchen?'
      })
    },
    201
  );
  assert.equal(familyLetter.body.letter.direction, 'sent');
  const receivedMail = await request('/api/family/mail', {
    headers: secondHeaders
  });
  assert.equal(receivedMail.body.letters[0].direction, 'received');
  assert.equal(receivedMail.body.letters[0].readAt, null);
  const readMail = await request(
    `/api/family/mail/${familyLetter.body.letter.id}`,
    {
      method: 'PATCH',
      headers: secondHeaders,
      body: JSON.stringify({ read: true })
    }
  );
  assert.equal(Boolean(readMail.body.letter.readAt), true);

  const secondAdultId =
    acceptedRelationships.body.relationships[0].otherFamily.members[0].id;
  const chatInvitation = await request(
    '/api/family/chat-guests',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        relationshipId: relationshipRequest.body.relationship.id,
        guestMemberId: secondAdultId
      })
    },
    201
  );
  assert.equal(chatInvitation.body.invitation.status, 'pending');
  const acceptedChatInvitation = await request(
    `/api/family/chat-guests/${chatInvitation.body.invitation.id}`,
    {
      method: 'PATCH',
      headers: secondHeaders,
      body: JSON.stringify({ status: 'accepted' })
    }
  );
  assert.equal(
    acceptedChatInvitation.body.invitation.status,
    'accepted'
  );
  const hostChatMessage = await request(
    '/api/resources/chatMessages',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        text: 'Willkommen in unserem Familienchat!',
        target: 'group'
      })
    },
    201
  );
  const guestChatMessages = await request(
    `/api/family/chat-guests/${chatInvitation.body.invitation.id}/messages`,
    { headers: secondHeaders }
  );
  assert.equal(
    guestChatMessages.body.messages.some(
      message => message.id === hostChatMessage.body.record.id
    ),
    true
  );
  const guestReply = await request(
    `/api/family/chat-guests/${chatInvitation.body.invitation.id}/messages`,
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({ text: 'Danke für die Einladung!' })
    },
    201
  );
  const hostChatBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    hostChatBootstrap.body.resources.chatMessages.some(
      message => message.id === guestReply.body.message.id
    ),
    true
  );

  const sharedEvent = await request(
    '/api/family/shared-events',
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({
        title: 'Familiengrillen',
        date: '2026-08-16',
        time: '16:00',
        reminders: [1440, 60],
        memberIds: [secondRegistration.body.members[0].id],
        recipientFamilyIds: [registration.body.family.id]
      })
    },
    201
  );
  assert.equal(sharedEvent.body.event.readOnly, false);
  assert.deepEqual(sharedEvent.body.event.reminders, [1440, 60]);
  assert.deepEqual(sharedEvent.body.event.memberIds, [
    secondRegistration.body.members[0].id
  ]);
  const sharedRecipientBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  const receivedSharedEvent =
    sharedRecipientBootstrap.body.resources.events.find(
      event => event.sharedEventId === sharedEvent.body.event.sharedEventId
    );
  assert.equal(receivedSharedEvent.readOnly, true);
  assert.equal(receivedSharedEvent.memberId, 'all');
  assert.deepEqual(receivedSharedEvent.memberIds, []);
  assert.equal(
    receivedSharedEvent.sharedOwnerFamilyName,
    secondRegistration.body.family.familyName
  );

  const updatedSharedEvent = await request(
    `/api/family/shared-events/${sharedEvent.body.event.sharedEventId}`,
    {
      method: 'PATCH',
      headers: secondHeaders,
      body: JSON.stringify({
        title: 'Familiengrillen im Park',
        date: '2026-08-16',
        time: '17:00',
        reminders: [60],
        memberIds: [secondRegistration.body.members[0].id]
      })
    }
  );
  assert.equal(updatedSharedEvent.body.event.title, 'Familiengrillen im Park');
  assert.equal(updatedSharedEvent.body.event.time, '17:00');
  const updatedSharedRecipientBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  const updatedReceivedSharedEvent =
    updatedSharedRecipientBootstrap.body.resources.events.find(
      event => event.sharedEventId === sharedEvent.body.event.sharedEventId
    );
  assert.equal(updatedReceivedSharedEvent.title, 'Familiengrillen im Park');
  assert.deepEqual(updatedReceivedSharedEvent.memberIds, []);

  const externalTask = await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}/tasks`,
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Oma beim Kuchenbacken helfen',
        dueDate: '2026-08-15',
        stars: 25
      })
    },
    201
  );
  assert.equal(externalTask.body.task.stars, 25);
  assert.equal(
    externalTask.body.task.createdByFamilyName,
    secondRegistration.body.family.familyName
  );

  const externalReward = await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}/rewards`,
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Zoobesuch mit Oma',
        costStars: 80,
        icon: 'custom',
        iconImage:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='
      })
    },
    201
  );
  assert.equal(externalReward.body.reward.forMemberId, childOne.id);
  assert.equal(externalReward.body.reward.icon, 'custom');
  assert.match(externalReward.body.reward.iconImage, /^data:image\/png;base64,/);

  await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}/rewards`,
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        title: 'Unsicheres Symbol',
        costStars: 20,
        icon: 'custom',
        iconImage:
          'data:image/svg+xml;base64,PHN2ZyBvbmxvYWQ9ImFsZXJ0KDEpIj48L3N2Zz4='
      })
    },
    400
  );

  const externalPocketMoney = await request(
    `/api/family/relationships/${relationshipRequest.body.relationship.id}/pocket-money`,
    {
      method: 'POST',
      headers: secondHeaders,
      body: JSON.stringify({
        memberId: childOne.id,
        amountCents: 500,
        note: 'Feriengeld'
      })
    },
    201
  );
  assert.equal(externalPocketMoney.body.transaction.amountCents, 500);

  const networkBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    networkBootstrap.body.resources.tasks.some(
      entry => entry.id === externalTask.body.task.id
    ),
    true
  );
  assert.equal(
    networkBootstrap.body.resources.rewards.some(
      entry => entry.id === externalReward.body.reward.id
    ),
    true
  );
  assert.equal(
    networkBootstrap.body.resources.pocketMoneyTransactions.some(
      entry => entry.id === externalPocketMoney.body.transaction.id
    ),
    true
  );

  await request(
    `/api/family/shared-events/${sharedEvent.body.event.sharedEventId}`,
    {
      method: 'DELETE',
      headers: secondHeaders
    }
  );
  const sharedEventRemoved = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(
    sharedEventRemoved.body.resources.events.some(
      event => event.sharedEventId === sharedEvent.body.event.sharedEventId
    ),
    false
  );

  process.env.DEMO_FAMILY_ID = registration.body.family.id;
  const readOnlyDemoBootstrap = await request('/api/bootstrap', {
    headers: authenticatedHeaders
  });
  assert.equal(readOnlyDemoBootstrap.body.readOnlyDemo, true);
  assert.equal(
    readOnlyDemoBootstrap.body.integrations.nextcloud.connected,
    false
  );
  assert.equal(
    readOnlyDemoBootstrap.body.integrations.homeAssistant.connected,
    false
  );
  assert.equal(
    Object.hasOwn(readOnlyDemoBootstrap.body.integrations.nextcloud, 'userId'),
    false
  );
  for (const sensitiveRead of [
    '/api/integrations',
    '/api/integrations/nextcloud/access',
    '/api/integrations/nextcloud/files?path=',
    '/api/integrations/nextcloud/files/content?path=Backups%2Ftest.lxbackup',
    '/api/integrations/home-assistant/entities'
  ]) {
    const blockedDemoRead = await request(sensitiveRead, {
      headers: authenticatedHeaders
    }, 403);
    assert.equal(blockedDemoRead.response.status, 403, sensitiveRead);
    assert.equal(blockedDemoRead.body.readOnlyDemo, true, sensitiveRead);
  }
  const skippedDemoCloud =
    await app.locals.provisionBundledCloudFamily(registration.body.family.id);
  assert.deepEqual(skippedDemoCloud, {
    skipped: true,
    familyId: registration.body.family.id,
    readOnlyDemo: true
  });
  const blockedDemoChange = await request(
    '/api/resources/notes',
    {
      method: 'POST',
      headers: authenticatedHeaders,
      body: JSON.stringify({
        title: 'Darf nicht gespeichert werden',
        content: 'Die öffentliche Demo bleibt unverändert.'
      })
    },
    403
  );
  assert.equal(blockedDemoChange.body.readOnlyDemo, true);
  assert.match(blockedDemoChange.body.error, /schreibgeschützt/i);
  delete process.env.DEMO_FAMILY_ID;

  const deletion = await request('/api/family', {
    method: 'DELETE',
    headers: authenticatedHeaders,
    body: JSON.stringify({ password })
  });
  assert.equal(deletion.body.success, true);
});
