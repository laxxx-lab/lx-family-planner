import assert from 'node:assert/strict';
import test from 'node:test';
import {
  normalizePersonalCalendarTarget,
  routeEventToCalendarTarget,
  targetProvider
} from './nextcloudCalendarTargets.js';

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
