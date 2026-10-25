import { expandImportedCalendarEvent, importedCalendarHasReminders } from './icsImport.js';
import { normalizeEventReminders } from './eventReminders.js';

const DAY_MS = 86_400_000;

export const CALENDAR_REPEAT_RULES = new Set([
  'none',
  'daily',
  'weekly',
  'monthly',
  'yearly',
  'custom'
]);

export const CALENDAR_REPEAT_UNITS = new Set(['days', 'weeks', 'months']);

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function dateAtNoon(value) {
  if (!validDate(value)) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dateKey(value) {
  const date = value instanceof Date ? value : dateAtNoon(value);
  if (!date) return '';
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function addDays(value, amount) {
  const date = dateAtNoon(value);
  if (!date) return '';
  date.setDate(date.getDate() + Number(amount || 0));
  return dateKey(date);
}

function addMonths(value, amount, day) {
  const date = dateAtNoon(value);
  if (!date) return '';
  const targetDay = Math.max(1, Math.min(31, Number(day) || date.getDate()));
  date.setDate(1);
  date.setMonth(date.getMonth() + Number(amount || 0));
  const lastDay = new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    12
  ).getDate();
  date.setDate(Math.min(targetDay, lastDay));
  return dateKey(date);
}

function daysBetween(from, to) {
  const first = dateAtNoon(from);
  const second = dateAtNoon(to);
  if (!first || !second) return 0;
  return Math.round((second.getTime() - first.getTime()) / DAY_MS);
}

export function normalizeCalendarRecurrence(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const rule = CALENDAR_REPEAT_RULES.has(source.recurrenceRule)
    ? source.recurrenceRule
    : 'none';
  const interval = Math.max(
    1,
    Math.min(365, Math.round(Number(source.recurrenceInterval) || 1))
  );
  const unit = CALENDAR_REPEAT_UNITS.has(source.recurrenceUnit)
    ? source.recurrenceUnit
    : 'weeks';
  const until = validDate(source.recurrenceUntil)
    ? source.recurrenceUntil
    : '';
  return {
    recurrenceRule: rule,
    recurrenceInterval: interval,
    recurrenceUnit: unit,
    recurrenceUntil: rule === 'none' ? '' : until
  };
}

export function calendarRecurrenceIsActive(event) {
  return normalizeCalendarRecurrence(event).recurrenceRule !== 'none';
}

export function calendarRecurrenceSummary(event) {
  const recurrence = normalizeCalendarRecurrence(event);
  if (recurrence.recurrenceRule === 'none') return '';
  if (recurrence.recurrenceRule !== 'custom') {
    return recurrence.recurrenceRule;
  }
  return `${recurrence.recurrenceInterval}-${recurrence.recurrenceUnit}`;
}

export function calendarRecurrenceRRule(event) {
  const recurrence = normalizeCalendarRecurrence(event);
  if (recurrence.recurrenceRule === 'none') return '';
  let frequency = '';
  let interval = recurrence.recurrenceInterval;
  if (recurrence.recurrenceRule === 'custom') {
    frequency = {
      days: 'DAILY',
      weeks: 'WEEKLY',
      months: 'MONTHLY'
    }[recurrence.recurrenceUnit] || 'WEEKLY';
  } else {
    frequency = recurrence.recurrenceRule.toUpperCase();
    interval = 1;
  }
  const parts = [`FREQ=${frequency}`];
  if (interval > 1) parts.push(`INTERVAL=${interval}`);
  if (frequency === 'WEEKLY') {
    const date = dateAtNoon(event?.date);
    const weekday = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'][date?.getDay() || 0];
    parts.push(`BYDAY=${weekday}`);
  }
  if (recurrence.recurrenceUntil) {
    parts.push(`UNTIL=${recurrence.recurrenceUntil.replaceAll('-', '')}T235959`);
  }
  return parts.join(';');
}

function nextDateForIndex(event, recurrence, index) {
  if (index === 0) return event.date;
  const rule = recurrence.recurrenceRule;
  if (rule === 'daily') return addDays(event.date, index);
  if (rule === 'weekly') return addDays(event.date, index * 7);
  if (rule === 'monthly') {
    return addMonths(event.date, index, dateAtNoon(event.date)?.getDate());
  }
  if (rule === 'yearly') {
    return addMonths(event.date, index * 12, dateAtNoon(event.date)?.getDate());
  }
  if (rule === 'custom') {
    if (recurrence.recurrenceUnit === 'days') {
      return addDays(event.date, index * recurrence.recurrenceInterval);
    }
    if (recurrence.recurrenceUnit === 'months') {
      return addMonths(
        event.date,
        index * recurrence.recurrenceInterval,
        dateAtNoon(event.date)?.getDate()
      );
    }
    return addDays(event.date, index * recurrence.recurrenceInterval * 7);
  }
  return '';
}

function occurrenceFrom(event, occurrenceDate) {
  const shift = daysBetween(event.date, occurrenceDate);
  const endDate = event.endDate ? addDays(event.endDate, shift) : '';
  return {
    ...event,
    date: occurrenceDate,
    endDate,
    seriesId: event.id,
    seriesStartDate: event.date,
    seriesStartEndDate: event.endDate || '',
    occurrenceKey: `${occurrenceDate}T${event.allDay ? '' : event.time || ''}`
  };
}

/**
 * Expands locally-created event series only for the requested time window.
 * The stored record remains one compact master event, so editing or deleting
 * it always affects the whole series and no database clutter is generated.
 */
export function expandCalendarEventSeries(events, {
  rangeStart = '2000-01-01',
  rangeEnd = '2100-12-31',
  maxOccurrences = 12_000,
  remindersOnly = false
} = {}) {
  if (remindersOnly) {
    return (Array.isArray(events) ? events : [])
      .filter(event => event.icsSource
        ? importedCalendarHasReminders(event)
        : normalizeEventReminders(event.reminders).length)
      .flatMap(event => expandCalendarEventSeries([event], { rangeStart, rangeEnd, maxOccurrences }));
  }
  const result = [];
  const from = validDate(rangeStart) ? rangeStart : '2000-01-01';
  const to = validDate(rangeEnd) ? rangeEnd : '2100-12-31';
  for (const event of Array.isArray(events) ? events : []) {
    if (event?.icsSource) {
      result.push(...expandImportedCalendarEvent(event, {
        rangeStart: from, rangeEnd: to,
        maxOccurrences: Math.max(0, maxOccurrences - result.length)
      }));
      if (result.length >= maxOccurrences) return result;
      continue;
    }
    const recurrence = normalizeCalendarRecurrence(event);
    if (!validDate(event?.date) || recurrence.recurrenceRule === 'none') {
      result.push(event);
      continue;
    }
    for (let index = 0; index < maxOccurrences; index += 1) {
      const occurrenceDate = nextDateForIndex(event, recurrence, index);
      if (!occurrenceDate || occurrenceDate > to) break;
      if (recurrence.recurrenceUntil && occurrenceDate > recurrence.recurrenceUntil) {
        break;
      }
      const occurrence = occurrenceFrom(event, occurrenceDate);
      const occurrenceEnd = occurrence.endDate || occurrenceDate;
      if (occurrenceEnd >= from && occurrenceDate <= to) result.push(occurrence);
      if (result.length >= maxOccurrences) return result;
    }
  }
  return result;
}
