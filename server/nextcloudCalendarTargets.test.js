import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test, { after } from 'node:test';
import {
  normalizePersonalCalendarTarget,
  routeEventToCalendarTarget,
  targetProvider
} from './nextcloudCalendarTargets.js';

const databaseDirectory = fs.mkdtempSync(
  path.join(os.tmpdir(), 'lx-family-calendar-targets-')
);
process.env.DATABASE_FILE = path.join(databaseDirectory, 'targets.sqlite');
process.env.DISABLE_LEGACY_IMPORT = 'true';
const {
  createFamily,
  createNextcloudCalendarTarget,
  database,
  deleteNextcloudCalendarTarget,
  getNextcloudCalendarTarget,
  listNextcloudCalendarTargets,
  updateNextcloudCalendarTarget
} = await import('./database.js');

createFamily({
  id: 'targets-family',
  familyName: 'Kalenderziele',
  password: 'test-password',
  members: [{ id: 'anna', name: 'Anna', role: 'adult' }]
});

after(() => {
  database.close();
  fs.rmSync(databaseDirectory, { recursive: true, force: true });
});

const sharedTarget = { id: 'shared', kind: 'family', enabled: true };
const personalTargets = [
  { id: 'anna', kind: 'member', memberId: 'anna', enabled: true }
];

test('one assigned member uses that member target', () => {
  const target = routeEventToCalendarTarget(
    { memberIds: ['anna'] },
    { sharedTarget, personalTargets }
  );

  assert.equal(target.id, 'anna');
});

test('family, multiple members and missing targets use the shared target', () => {
  const options = { sharedTarget, personalTargets };

  assert.equal(routeEventToCalendarTarget({ memberIds: [] }, options).id, 'shared');
  assert.equal(
    routeEventToCalendarTarget({ memberIds: ['anna', 'ben'] }, options).id,
    'shared'
  );
  assert.equal(
    routeEventToCalendarTarget({ memberIds: ['ben'] }, options).id,
    'shared'
  );
});

test('target providers keep the legacy shared name and isolate personal mappings', () => {
  assert.equal(targetProvider(sharedTarget), 'nextcloud');
  assert.equal(targetProvider(personalTargets[0]), 'nextcloud-target:anna');
});

test('personal targets require a current member and calendar URL', () => {
  const members = [{ id: 'anna' }];

  assert.throws(
    () => normalizePersonalCalendarTarget({ calendarHref: '/calendars/anna' }, members),
    /Familienmitglied/i
  );
  assert.throws(
    () => normalizePersonalCalendarTarget({ memberId: 'ben' }, members),
    /Familienmitglied/i
  );
  assert.throws(
    () => normalizePersonalCalendarTarget({ memberId: 'anna' }, members),
    /Kalender/i
  );
  assert.throws(
    () => normalizePersonalCalendarTarget(
      { memberId: 'anna', calendarHref: '/calendars/anna' },
      members,
      personalTargets
    ),
    /bereits.*Kalenderziel/i
  );
});

test('a family stores one encrypted personal target per member', () => {
  const created = createNextcloudCalendarTarget('targets-family', {
    memberId: 'anna',
    name: 'Annas Kalender',
    calendarHref: '/remote.php/dav/calendars/anna/personal/',
    secretEncrypted: 'encrypted-app-password'
  });

  assert.equal(created.memberId, 'anna');
  assert.equal(created.secretEncrypted, undefined);
  assert.equal(listNextcloudCalendarTargets('targets-family').length, 1);
  assert.equal(
    getNextcloudCalendarTarget('targets-family', created.id, {
      includeSecret: true
    }).secretEncrypted,
    'encrypted-app-password'
  );
  assert.throws(
    () => createNextcloudCalendarTarget('targets-family', {
      memberId: 'anna',
      name: 'Doppelt',
      calendarHref: '/remote.php/dav/calendars/anna/other/',
      secretEncrypted: 'another-password'
    }),
    /bereits.*Kalenderziel/i
  );
});

test('a personal target can update its status and be removed', () => {
  const target = listNextcloudCalendarTargets('targets-family')[0];
  const updated = updateNextcloudCalendarTarget('targets-family', target.id, {
    enabled: false,
    lastError: 'Server nicht erreichbar'
  });

  assert.equal(updated.enabled, false);
  assert.equal(updated.lastError, 'Server nicht erreichbar');
  assert.equal(deleteNextcloudCalendarTarget('targets-family', target.id), true);
  assert.equal(listNextcloudCalendarTargets('targets-family').length, 0);
});
