import ICAL from 'ical.js';
import { parseIcsDateProperty } from './icsCalendar.js';
import { normalizeEventReminders } from './eventReminders.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_RECORDS = 2000;
const MAX_ITERATIONS = 100_000;

export function newCalendarImportId(cryptoProvider = globalThis.crypto) {
  if (cryptoProvider.randomUUID) return cryptoProvider.randomUUID();
  // randomUUID requires HTTPS, getRandomValues also works on local HTTP LANs.
  const bytes = cryptoProvider.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 15) | 64;
  bytes[8] = (bytes[8] & 63) | 128;
  const hex = [...bytes].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function alarmReminderMinutes(alarm) {
  const trigger = alarm.getFirstProperty('trigger');
  const duration = trigger?.getFirstValue();
  const minutes = duration instanceof ICAL.Duration ? -duration.toSeconds() / 60 : -1;
  return alarm.getFirstPropertyValue('action') === 'DISPLAY' &&
    trigger?.getParameter('related') !== 'END' && !alarm.hasProperty('repeat') &&
    Number.isInteger(minutes) && minutes >= 0 && minutes <= 10080
    ? minutes : null;
}

function dateFields(time, component, name) {
  if (!time.isDate && time.zone !== ICAL.Timezone.localTimezone) {
    const utc = new Date(time.toUnixTime() * 1000).toISOString()
      .replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    return parseIcsDateProperty({ value: utc, parameters: {} }, 'Europe/Berlin');
  }
  return parseIcsDateProperty({
    value: time.toICALString(),
    parameters: time.isDate ? { VALUE: 'DATE' } : {
      TZID: component.getFirstProperty(name)?.getParameter('tzid') ||
        component.getFirstProperty('dtstart')?.getParameter('tzid')
    }
  }, 'Europe/Berlin');
}

function fields(event, start = event.startDate, end = event.endDate) {
  const first = dateFields(start, event.component, 'dtstart');
  const last = dateFields(end, event.component, 'dtend');
  const hasEnd = start.isDate || event.component.hasProperty('dtend') || event.component.hasProperty('duration');
  const categories = event.component.getAllProperties('categories')
    .flatMap(property => property.getValues());
  const reminders = event.component.getAllSubcomponents('valarm')
    .map(alarmReminderMinutes).filter(minutes => minutes !== null);
  return {
    uid: event.uid,
    title: event.summary || 'Kalendertermin',
    notes: event.description || '',
    location: event.location || '',
    date: first.date, time: first.time, allDay: first.allDay,
    endDate: hasEnd ? last.date : '', endTime: hasEnd ? last.time : '',
    categories, category: categories[0] || 'Importiert',
    reminders: normalizeEventReminders(reminders)
  };
}

function readCalendar(content) {
  if (typeof content !== 'string' || new TextEncoder().encode(content).length > MAX_FILE_BYTES) {
    throw new Error('ICS_FILE_TOO_LARGE');
  }
  const calendar = new ICAL.Component(ICAL.parse(content));
  if (calendar.name !== 'vcalendar') throw new Error('ICS_INVALID_CALENDAR');
  return calendar;
}

/** Keep one master per UID, including its exception components and timezones. */
export function previewCalendarImport(content) {
  const calendar = readCalendar(content);
  const components = calendar.getAllSubcomponents('vevent');
  const warnings = new Set();
  const groups = new Map();
  for (const component of components) {
    const uid = component.getFirstPropertyValue('uid');
    if (!uid) throw new Error('ICS_MISSING_UID');
    if (!groups.has(uid)) groups.set(uid, []);
    groups.get(uid).push(component);
  }
  if (groups.size > MAX_RECORDS) throw new Error('ICS_TOO_MANY_EVENTS');
  if (calendar.getAllSubcomponents().some(component =>
    !['vevent', 'vtimezone'].includes(component.name))) warnings.add('otherComponents');
  const records = [];
  let storedBytes = 0;
  const year = new Date().getFullYear();
  for (const group of groups.values()) {
    const masters = group.filter(component => !component.hasProperty('recurrence-id'));
    if (masters.length !== 1) throw new Error('ICS_INVALID_SERIES');
    const master = masters[0];
    if (master.getFirstPropertyValue('status') === 'CANCELLED') continue;
    if (!master.hasProperty('dtstart')) throw new Error('ICS_MISSING_START');
    const isolated = new ICAL.Component('vcalendar');
    isolated.updatePropertyWithValue('version', '2.0');
    for (const timezone of calendar.getAllSubcomponents('vtimezone')) {
      isolated.addSubcomponent(new ICAL.Component(structuredClone(timezone.toJSON())));
    }
    for (const component of group) {
      isolated.addSubcomponent(new ICAL.Component(structuredClone(component.toJSON())));
      for (const rule of component.getAllProperties('rrule')) {
        const frequency = rule.getFirstValue().freq;
        if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) {
          throw new Error('ICS_FREQUENCY_UNSUPPORTED');
        }
      }
      for (const alarm of component.getAllSubcomponents('valarm')) {
        if (alarmReminderMinutes(alarm) === null) warnings.add('alarms');
      }
      if (component.getAllSubcomponents('valarm').length > 8) warnings.add('alarms');
    }
    const event = new ICAL.Event(isolated.getAllSubcomponents('vevent')
      .find(component => !component.hasProperty('recurrence-id')));
    const record = {
      ...fields(event), memberId: 'all',
      icsSource: isolated.toString(),
      icsRecurring: event.isRecurring()
    };
    storedBytes += new TextEncoder().encode(record.icsSource).length;
    if (storedBytes > MAX_FILE_BYTES * 2) throw new Error('ICS_IMPORT_TOO_LARGE');
    // Validate expansion before offering an import. Never save an unreadable series.
    expandImportedCalendarEvent(record, { rangeStart: record.date, rangeEnd: record.date, maxOccurrences: 1 });
    expandImportedCalendarEvent(record, {
      rangeStart: `${year - 1}-01-01`, rangeEnd: `${year + 5}-12-31`, maxOccurrences: 1
    });
    records.push(record);
  }
  return { records, warnings: [...warnings] };
}

export function importedCalendarComponent(record) {
  const calendar = readCalendar(record.icsSource);
  const master = calendar.getAllSubcomponents('vevent')
    .find(component => !component.hasProperty('recurrence-id'));
  if (!master) throw new Error('ICS_INVALID_SERIES');
  const original = fields(new ICAL.Event(master));
  for (const [key, name] of [['title', 'summary'], ['notes', 'description'], ['location', 'location']]) {
    if (record[key] !== undefined && record[key] !== original[key]) {
      for (const component of calendar.getAllSubcomponents('vevent')) {
        component.updatePropertyWithValue(name, record[key]);
      }
    }
  }
  if (record.category !== undefined && record.category !== original.category) {
    for (const component of calendar.getAllSubcomponents('vevent')) {
      component.removeAllProperties('categories');
      const property = new ICAL.Property('categories');
      property.setValues([record.category]);
      component.addProperty(property);
    }
  }
  if (record.reminders && JSON.stringify(normalizeEventReminders(record.reminders)) !== JSON.stringify(original.reminders)) {
    for (const component of calendar.getAllSubcomponents('vevent')) {
      for (const alarm of [...component.getAllSubcomponents('valarm')]) {
        if (alarmReminderMinutes(alarm) !== null) component.removeSubcomponent(alarm);
      }
      for (const minutes of normalizeEventReminders(record.reminders)) {
        const alarm = new ICAL.Component('valarm');
        alarm.updatePropertyWithValue('action', 'DISPLAY');
        alarm.updatePropertyWithValue('description', record.title || original.title);
        alarm.updatePropertyWithValue('trigger', ICAL.Duration.fromSeconds(-minutes * 60));
        component.addSubcomponent(alarm);
      }
    }
  }
  return calendar;
}

/** Transport bookkeeping is not a user edit and must not cause sync conflicts. */
export function importedCalendarFingerprint(record) {
  if (!record.icsSource) return '';
  const calendar = importedCalendarComponent(record);
  for (const component of calendar.getAllSubcomponents('vevent')) {
    for (const property of [...component.getAllProperties()]) {
      if (property.name.startsWith('x-lx-') ||
          ['dtstamp', 'last-modified', 'sequence'].includes(property.name)) component.removeProperty(property);
    }
  }
  return calendar.toString();
}

export function importedCalendarHasReminders(record) {
  return importedCalendarComponent(record).getAllSubcomponents('vevent').some(component =>
    component.getAllSubcomponents('valarm').some(alarm => alarmReminderMinutes(alarm) !== null)
  );
}

export function expandImportedCalendarEvent(record, { rangeStart, rangeEnd, maxOccurrences = 12000 }) {
  const calendar = importedCalendarComponent(record);
  const event = new ICAL.Event(calendar.getAllSubcomponents('vevent')
    .find(component => !component.hasProperty('recurrence-id')));
  const results = [];
  const iterator = event.iterator();
  const backwardShift = Math.max(0, ...Object.values(event.exceptions)
    .filter(exception => exception.modifiesFuture())
    .map(exception => -exception.startDate.subtractDate(exception.recurrenceId).toSeconds()));
  // An exception can move future occurrences backwards into the visible window.
  // Include that offset and a timezone margin, but always keep iteration bounded.
  const cutoff = new Date(Date.parse(`${rangeEnd}T12:00:00Z`) +
    (Math.ceil(backwardShift / 86400) + 2) * 86400_000).toISOString().slice(0, 10);
  const add = details => {
    if (details.item.component.getFirstPropertyValue('status') === 'CANCELLED') return;
    const occurrence = fields(details.item, details.startDate, details.endDate);
    if (occurrence.date > rangeEnd || (occurrence.endDate || occurrence.date) < rangeStart) return;
    results.push({
      ...record, ...occurrence,
      seriesId: record.id, seriesStartDate: record.date,
      seriesStartTime: record.time, seriesStartEndTime: record.endTime,
      seriesStartEndDate: record.endDate || '',
      occurrenceKey: details.recurrenceId.toString()
    });
  };
  if (!event.isRecurring()) {
    add({ item: event, startDate: event.startDate, endDate: event.endDate, recurrenceId: event.startDate });
  } else {
    let done = false;
    for (let step = 0; step < MAX_ITERATIONS; step += 1) {
      const next = iterator.next();
      if (!next) { done = true; break; }
      // Use the recurrence's own wall date; exceptions may move outside the window.
      if (next.toString().slice(0, 10) > cutoff) {
        done = true; break;
      }
      add(event.getOccurrenceDetails(next));
      if (results.length >= maxOccurrences) { done = true; break; }
    }
    if (!done) throw new Error('ICS_EXPANSION_LIMIT');
    // Moved exceptions can enter the window from outside the recurrence window.
    for (const exception of Object.values(event.exceptions)) {
      const key = exception.recurrenceId.toString();
      if (!results.some(result => result.occurrenceKey === key)) {
        add(event.getOccurrenceDetails(exception.recurrenceId));
      }
    }
  }
  return results.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`))
    .slice(0, maxOccurrences);
}

export function calendarImportGroups(records) {
  const groups = new Map();
  for (const record of records) {
    if (!record.importBatchId) continue;
    const group = groups.get(record.importBatchId) || {
      id: record.importBatchId, name: record.importFileName || 'ICS', count: 0
    };
    group.count += 1;
    groups.set(group.id, group);
  }
  return [...groups.values()];
}
