import test from 'node:test';
import assert from 'node:assert/strict';
import { parseICSContent, exportEventsToICSContent } from '../src/utils/icsUtils.js';
import { expandCalendarEventSeries } from '../shared/calendarRecurrence.js';
import { previewCalendarImport, calendarImportGroups, newCalendarImportId } from '../shared/icsImport.js';

const birthday = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:birthday-1
DTSTART;VALUE=DATE:19900805
DTEND;VALUE=DATE:19900806
SUMMARY:Omas Geburtstag
RRULE:FREQ=YEARLY
CATEGORIES:GEBURTSTAG,Familie
BEGIN:VALARM
ACTION:DISPLAY
TRIGGER:-P1D
DESCRIPTION:Geburtstag
END:VALARM
END:VEVENT
END:VCALENDAR`;

test('an HTTP LAN installation can generate a retry-safe import ID without randomUUID', () => {
  const provider = { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) };
  const first = newCalendarImportId(provider);
  const second = newCalendarImportId(provider);
  assert.match(first, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.notEqual(first, second);
});

test('ICS file import stores one birthday series instead of 1000 historic occurrences', () => {
  const records = parseICSContent(birthday);
  assert.equal(records.length, 1);
  assert.equal(records[0].date, '1990-08-05');
  assert.equal(records[0].category, 'GEBURTSTAG');
  assert.deepEqual(records[0].categories, ['GEBURTSTAG', 'Familie']);
  assert.deepEqual(records[0].reminders, [1440]);
  assert.ok(records[0].icsSource);
});

test('ICS imported birthdays expand in future years and keep the exclusive end date', () => {
  const records = parseICSContent(birthday);
  const events = expandCalendarEventSeries(records, {
    rangeStart: '2026-01-01', rangeEnd: '2027-12-31'
  });
  assert.deepEqual(events.map(event => [event.date, event.endDate]), [
    ['2026-08-05', '2026-08-06'], ['2027-08-05', '2027-08-06']
  ]);
  assert.ok(events.every(event => event.seriesId === records[0].id));
});

test('ICS import/export retains UID, RRULE, categories and nested alarm boundaries', () => {
  const content = exportEventsToICSContent(parseICSContent(birthday), 'Tests');
  assert.match(content, /UID:birthday-1\r?\n/);
  assert.match(content, /RRULE:FREQ=YEARLY/);
  assert.match(content, /CATEGORIES:GEBURTSTAG,Familie/);
  assert.match(content, /BEGIN:VALARM[\s\S]*TRIGGER:-P1D[\s\S]*END:VALARM/);
  assert.equal((content.match(/BEGIN:VEVENT/g) || []).length, 1);
});

test('ICS recurrence keeps excluded, moved and ordinal monthly occurrences', () => {
  const content = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:monthly
DTSTART:20260105T170000
DTEND:20260105T180000
SUMMARY:Sport
RRULE:FREQ=MONTHLY;BYDAY=1MO;COUNT=4
EXDATE:20260202T170000
END:VEVENT
BEGIN:VEVENT
UID:monthly
RECURRENCE-ID:20260302T170000
DTSTART:20260303T180000
DTEND:20260303T190000
SUMMARY:Verschoben
END:VEVENT
END:VCALENDAR`;
  const records = parseICSContent(content);
  assert.equal(records.length, 1);
  const events = expandCalendarEventSeries(records, {
    rangeStart: '2026-01-01', rangeEnd: '2026-05-01'
  });
  assert.deepEqual(events.map(event => [event.date, event.time, event.title]), [
    ['2026-01-05', '17:00', 'Sport'],
    ['2026-03-03', '18:00', 'Verschoben'],
    ['2026-04-06', '17:00', 'Sport']
  ]);
});

test('preview warns when an alarm can be preserved but cannot notify in LX', () => {
  const preview = previewCalendarImport(birthday.replace('-P1D', '-P30D'));
  assert.deepEqual(preview.warnings, ['alarms']);
  assert.deepEqual(preview.records[0].reminders, []);
  assert.match(exportEventsToICSContent(preview.records), /TRIGGER:-P30D/);
});

test('preview rejects incomplete files instead of silently discarding their events', () => {
  assert.throws(() => previewCalendarImport(birthday.replace('UID:birthday-1\n', '')), /ICS_MISSING_UID/);
  assert.throws(() => previewCalendarImport(birthday.replace('FREQ=YEARLY', 'FREQ=SECONDLY')), /ICS_FREQUENCY_UNSUPPORTED/);
});

test('import groups count stored masters and exclude legacy and regular events', () => {
  assert.deepEqual(calendarImportGroups([
    { id: 'a', importBatchId: 'batch-a', importFileName: 'family.ics' },
    { id: 'b', importBatchId: 'batch-a', importFileName: 'family.ics' },
    { id: 'c', category: 'Importiert' }, { id: 'd' }
  ]), [{ id: 'batch-a', name: 'family.ics', count: 2 }]);
});

test('edited series text and reminders survive expansion and export', () => {
  const [record] = parseICSContent(birthday);
  record.title = 'Neuer Titel';
  record.category = 'Privat';
  record.reminders = [60];
  const [event] = expandCalendarEventSeries([record], { rangeStart: '2026-01-01', rangeEnd: '2026-12-31' });
  assert.equal(event.title, 'Neuer Titel');
  assert.equal(event.category, 'Privat');
  assert.deepEqual(event.reminders, [60]);
  const content = exportEventsToICSContent([record]);
  assert.match(content, /SUMMARY:Neuer Titel/);
  assert.match(content, /TRIGGER:-PT1H/);
  assert.match(content, /RRULE:FREQ=YEARLY/);
});

test('THISANDFUTURE exceptions do not prevent a finite display-window cutoff', () => {
  const content = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:range-shift
DTSTART:20260101T090000
SUMMARY:Täglich
RRULE:FREQ=DAILY
END:VEVENT
BEGIN:VEVENT
UID:range-shift
RECURRENCE-ID;RANGE=THISANDFUTURE:20260102T090000
DTSTART:20260103T090000
SUMMARY:Ab jetzt später
END:VEVENT
END:VCALENDAR`;
  const [record] = parseICSContent(content);
  const occurrences = expandCalendarEventSeries([record], { rangeStart: '2026-10-01', rangeEnd: '2026-10-31' });
  assert.equal(occurrences.length, 31);
  assert.equal(occurrences[0].date, '2026-10-01');
  assert.equal(occurrences.at(-1).date, '2026-10-31');
});

test('embedded custom timezones preserve the real instant in the family display', () => {
  const [record] = parseICSContent(`BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VTIMEZONE
TZID:CustomTokyo
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:tokyo
DTSTART;TZID=CustomTokyo:20260812T100000
SUMMARY:Tokyo
RRULE:FREQ=DAILY;COUNT=2
END:VEVENT
END:VCALENDAR`);
  assert.equal(record.time, '03:00');
  const events = expandCalendarEventSeries([record], { rangeStart: '2026-08-12', rangeEnd: '2026-08-13' });
  assert.deepEqual(events.map(event => [event.date, event.time]), [['2026-08-12', '03:00'], ['2026-08-13', '03:00']]);
  assert.equal(record.endTime, '');
});

test('many imports cannot hide a later native event from the reminder sweep', () => {
  const [record] = parseICSContent(birthday);
  const records = Array.from({ length: 601 }, (_, index) => ({ ...record, id: `alarm-${index}` }));
  records.push({ id: 'native', date: '2026-08-05', time: '12:00', reminders: [0] });
  const events = expandCalendarEventSeries(records, {
    rangeStart: '2026-08-04', rangeEnd: '2026-08-06', maxOccurrences: 600,
    remindersOnly: true
  });
  assert.equal(events.length, 602);
  assert.ok(events.some(event => event.id === 'native'));
  const withoutAlarms = records.slice(0, -1).map(event => ({ ...event, reminders: [] }));
  const due = expandCalendarEventSeries([...withoutAlarms, records.at(-1)], {
    rangeStart: '2026-08-04', rangeEnd: '2026-08-06', maxOccurrences: 600,
    remindersOnly: true
  });
  assert.deepEqual(due.map(event => event.id), ['native']);
});

test('editing LX reminders preserves alarms that LX cannot deliver', () => {
  const [record] = parseICSContent(birthday.replace('END:VALARM', 'END:VALARM\nBEGIN:VALARM\nACTION:EMAIL\nTRIGGER:-P30D\nDESCRIPTION:Mail\nEND:VALARM'));
  record.reminders = [60];
  const exported = exportEventsToICSContent([record]);
  assert.match(exported, /ACTION:EMAIL/);
  assert.match(exported, /TRIGGER:-P30D/);
  assert.match(exported, /TRIGGER:-PT1H/);
});
