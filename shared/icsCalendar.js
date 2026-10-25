const DAY_MS = 86_400_000;
export { parseDateProperty as parseIcsDateProperty };
const WEEKDAY_INDEX = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function dateKeyFromParts(parts) {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function timeKeyFromParts(parts) {
  return `${pad(parts.hour || 0)}:${pad(parts.minute || 0)}`;
}

function unescapeIcsText(value = '') {
  return String(value)
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim();
}

function unfoldIcsLines(content = '') {
  return String(content)
    .replace(/\r\n[ \t]/g, '')
    .replace(/\n[ \t]/g, '')
    .replace(/\r[ \t]/g, '')
    .split(/\r\n|\n|\r/);
}

function parseProperty(line) {
  const separator = line.indexOf(':');
  if (separator < 0) return null;
  const descriptor = line.slice(0, separator);
  const value = line.slice(separator + 1);
  const [rawName, ...rawParameters] = descriptor.split(';');
  const parameters = Object.fromEntries(
    rawParameters.map(parameter => {
      const equals = parameter.indexOf('=');
      if (equals < 0) return [parameter.toUpperCase(), ''];
      return [
        parameter.slice(0, equals).toUpperCase(),
        parameter.slice(equals + 1).replace(/^"|"$/g, '')
      ];
    })
  );
  return {
    name: rawName.toUpperCase(),
    parameters,
    value
  };
}

function numericDateParts(value) {
  const match = String(value).match(
    /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?)?(Z)?$/
  );
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4] || 0),
    minute: Number(match[5] || 0),
    second: Number(match[6] || 0),
    hasTime: Boolean(match[4]),
    utc: Boolean(match[7])
  };
}

function zonedParts(date, timeZone) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23'
  });
  const values = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter(part => part.type !== 'literal')
      .map(part => [part.type, Number(part.value)])
  );
  return {
    year: values.year,
    month: values.month,
    day: values.day,
    hour: values.hour,
    minute: values.minute,
    second: values.second
  };
}

function isSupportedTimeZone(timeZone) {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('de-DE', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

function zonedTimeToDate(parts, timeZone) {
  let timestamp = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second
  );
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const rendered = zonedParts(new Date(timestamp), timeZone);
    const renderedTimestamp = Date.UTC(
      rendered.year,
      rendered.month - 1,
      rendered.day,
      rendered.hour,
      rendered.minute,
      rendered.second
    );
    const wantedTimestamp = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second
    );
    timestamp -= renderedTimestamp - wantedTimestamp;
  }
  return new Date(timestamp);
}

function parseDateProperty(property, targetTimeZone) {
  if (!property) return null;
  const parts = numericDateParts(property.value);
  if (!parts) return null;
  const allDay =
    property.parameters.VALUE?.toUpperCase() === 'DATE' || !parts.hasTime;
  if (allDay) {
    return {
      date: dateKeyFromParts(parts),
      time: '',
      allDay: true
    };
  }

  const sourceTimeZone = property.parameters.TZID;
  if (parts.utc || isSupportedTimeZone(sourceTimeZone)) {
    const instant = parts.utc
      ? new Date(
          Date.UTC(
            parts.year,
            parts.month - 1,
            parts.day,
            parts.hour,
            parts.minute,
            parts.second
          )
        )
      : zonedTimeToDate(parts, sourceTimeZone);
    const localized = zonedParts(instant, targetTimeZone);
    return {
      date: dateKeyFromParts(localized),
      time: timeKeyFromParts(localized),
      allDay: false
    };
  }

  return {
    date: dateKeyFromParts(parts),
    time: timeKeyFromParts(parts),
    allDay: false
  };
}

function dateValue(date, time = '') {
  return new Date(`${date}T${time || '00:00'}:00Z`).getTime();
}

function addDays(date, amount) {
  return new Date(date.getTime() + amount * DAY_MS);
}

function addMonths(date, amount, wantedDay = date.getUTCDate()) {
  const result = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth() + amount,
      1,
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    )
  );
  const lastDay = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0)
  ).getUTCDate();
  if (wantedDay > lastDay) return null;
  result.setUTCDate(wantedDay);
  return result;
}

function occurrenceFromDate(date, allDay) {
  return {
    date: `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(
      date.getUTCDate()
    )}`,
    time: allDay
      ? ''
      : `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
  };
}

function parseRule(value = '') {
  return Object.fromEntries(
    String(value)
      .split(';')
      .map(entry => entry.split('='))
      .filter(parts => parts.length === 2)
      .map(([key, ruleValue]) => [key.toUpperCase(), ruleValue.toUpperCase()])
  );
}

function ruleUntilValue(rule, targetTimeZone) {
  if (!rule.UNTIL) return Number.POSITIVE_INFINITY;
  const parsed = parseDateProperty(
    { value: rule.UNTIL, parameters: {} },
    targetTimeZone
  );
  return parsed
    ? dateValue(parsed.date, parsed.time || '23:59')
    : Number.POSITIVE_INFINITY;
}

function expandRecurringEvent(event, {
  rangeStart,
  rangeEnd,
  targetTimeZone,
  maxEvents
}) {
  if (!event.rrule) return [event];
  const rule = parseRule(event.rrule);
  const frequency = rule.FREQ;
  if (!['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(frequency)) {
    return [event];
  }

  const interval = Math.max(1, Math.min(100, Number(rule.INTERVAL || 1)));
  const countLimit = rule.COUNT
    ? Math.max(1, Math.min(100_000, Number(rule.COUNT)))
    : Number.POSITIVE_INFINITY;
  const until = Math.min(
    rangeEnd,
    ruleUntilValue(rule, targetTimeZone)
  );
  const start = new Date(`${event.date}T${event.time || '00:00'}:00Z`);
  const results = [];
  const seen = new Set();
  const byDays = String(rule.BYDAY || '')
    .split(',')
    .map(value => value.replace(/^[+-]?\d+/, ''))
    .map(value => WEEKDAY_INDEX[value])
    .filter(value => Number.isInteger(value));
  const byMonthDays = String(rule.BYMONTHDAY || '')
    .split(',')
    .map(Number)
    .filter(value => value > 0 && value <= 31);

  const append = candidate => {
    if (!candidate || results.length >= countLimit) return;
    const value = candidate.getTime();
    if (value < dateValue(event.date, event.time) || value > until) return;
    const occurrence = occurrenceFromDate(candidate, event.allDay);
    const key = `${occurrence.date}T${occurrence.time}`;
    if (seen.has(key)) return;
    seen.add(key);
    if (value >= rangeStart && value <= rangeEnd) {
      results.push({
        ...event,
        ...occurrence,
        occurrenceKey: key
      });
    }
  };

  let generated = 0;
  if (frequency === 'WEEKLY' && byDays.length) {
    const weekStart = addDays(start, -((start.getUTCDay() + 6) % 7));
    let pastUntil = false;
    for (
      let week = 0;
      generated < countLimit && results.length < maxEvents;
      week += interval
    ) {
      for (const weekday of byDays) {
        const mondayOffset = (weekday + 6) % 7;
        const candidate = addDays(weekStart, week * 7 + mondayOffset);
        candidate.setUTCHours(
          start.getUTCHours(),
          start.getUTCMinutes(),
          start.getUTCSeconds()
        );
        if (candidate.getTime() < start.getTime()) continue;
        if (candidate.getTime() > until) {
          pastUntil = true;
          break;
        }
        generated += 1;
        append(candidate);
        if (generated >= countLimit) break;
      }
      if (pastUntil || week > 100_000) break;
    }
  } else {
    for (
      let index = 0;
      generated < countLimit && results.length < maxEvents;
      index += 1
    ) {
      let candidate;
      if (frequency === 'DAILY') {
        candidate = addDays(start, index * interval);
      } else if (frequency === 'WEEKLY') {
        candidate = addDays(start, index * interval * 7);
      } else if (frequency === 'MONTHLY') {
        const wantedDay = byMonthDays[0] || start.getUTCDate();
        candidate = addMonths(start, index * interval, wantedDay);
      } else {
        candidate = addMonths(
          start,
          index * interval * 12,
          start.getUTCDate()
        );
      }
      if (candidate && candidate.getTime() > until) break;
      generated += 1;
      append(candidate);
      if (index > 100_000) break;
    }
  }

  return results;
}

function propertyValue(properties, name) {
  return properties.find(property => property.name === name)?.value || '';
}

function propertyValues(properties, name) {
  return properties
    .filter(property => property.name === name)
    .flatMap(property =>
      property.value.split(',').map(value => ({
        ...property,
        value
      }))
    );
}

function eventFromProperties(properties, index, targetTimeZone) {
  const startProperty = properties.find(property => property.name === 'DTSTART');
  const start = parseDateProperty(startProperty, targetTimeZone);
  if (!start) return null;
  const end = parseDateProperty(
    properties.find(property => property.name === 'DTEND'),
    targetTimeZone
  );
  const recurrence = parseDateProperty(
    properties.find(property => property.name === 'RECURRENCE-ID'),
    targetTimeZone
  );
  const uid =
    unescapeIcsText(propertyValue(properties, 'UID')) ||
    `event-${index}-${start.date}-${start.time}`;
  return {
    uid,
    title:
      unescapeIcsText(propertyValue(properties, 'SUMMARY')) ||
      'Kalendertermin',
    location: unescapeIcsText(propertyValue(properties, 'LOCATION')),
    notes: unescapeIcsText(propertyValue(properties, 'DESCRIPTION')),
    date: start.date,
    time: start.time,
    allDay: start.allDay,
    endDate: end?.date || '',
    endTime: end?.time || '',
    status: propertyValue(properties, 'STATUS').toUpperCase(),
    rrule: propertyValue(properties, 'RRULE'),
    recurrenceKey: recurrence
      ? `${recurrence.date}T${recurrence.time}`
      : '',
    exdates: propertyValues(properties, 'EXDATE')
      .map(property => parseDateProperty(property, targetTimeZone))
      .filter(Boolean)
      .map(value => `${value.date}T${value.time}`),
    rdates: propertyValues(properties, 'RDATE')
      .map(property => parseDateProperty(property, targetTimeZone))
      .filter(Boolean)
  };
}

export function parseICalendar(content, {
  targetTimeZone = 'Europe/Berlin',
  rangeStart = Number.NEGATIVE_INFINITY,
  rangeEnd = Number.POSITIVE_INFINITY,
  maxEvents = 1000
} = {}) {
  const safeTimeZone = isSupportedTimeZone(targetTimeZone)
    ? targetTimeZone
    : 'Europe/Berlin';
  const eventBlocks = [];
  let properties = null;

  for (const rawLine of unfoldIcsLines(content)) {
    const line = rawLine.trim();
    if (line === 'BEGIN:VEVENT') {
      properties = [];
      continue;
    }
    if (line === 'END:VEVENT') {
      if (properties) eventBlocks.push(properties);
      properties = null;
      continue;
    }
    if (!properties) continue;
    const property = parseProperty(line);
    if (property) properties.push(property);
  }

  const parsed = eventBlocks
    .map((block, index) => eventFromProperties(block, index, safeTimeZone))
    .filter(Boolean);
  const overrides = parsed.filter(event => event.recurrenceKey);
  const regularEvents = parsed.filter(event => !event.recurrenceKey);
  const eventMap = new Map();

  for (const event of regularEvents) {
    if (event.status === 'CANCELLED') continue;
    const occurrences = expandRecurringEvent(event, {
      rangeStart,
      rangeEnd,
      targetTimeZone: safeTimeZone,
      maxEvents
    });
    for (const occurrence of occurrences) {
      const value = dateValue(occurrence.date, occurrence.time);
      if (value < rangeStart || value > rangeEnd) continue;
      const occurrenceKey =
        occurrence.occurrenceKey ||
        `${occurrence.date}T${occurrence.time}`;
      if (event.exdates.includes(occurrenceKey)) continue;
      eventMap.set(`${event.uid}|${occurrenceKey}`, {
        ...occurrence,
        occurrenceKey
      });
      if (eventMap.size >= maxEvents) break;
    }
    for (const rdate of event.rdates) {
      const occurrenceKey = `${rdate.date}T${rdate.time}`;
      const value = dateValue(rdate.date, rdate.time);
      if (
        value >= rangeStart &&
        value <= rangeEnd &&
        !event.exdates.includes(occurrenceKey)
      ) {
        eventMap.set(`${event.uid}|${occurrenceKey}`, {
          ...event,
          ...rdate,
          occurrenceKey
        });
      }
    }
    if (eventMap.size >= maxEvents) break;
  }

  for (const override of overrides) {
    const key = `${override.uid}|${override.recurrenceKey}`;
    if (override.status === 'CANCELLED') {
      eventMap.delete(key);
      continue;
    }
    const value = dateValue(override.date, override.time);
    if (value >= rangeStart && value <= rangeEnd) {
      eventMap.set(key, {
        ...override,
        occurrenceKey: override.recurrenceKey
      });
    }
  }

  return [...eventMap.values()]
    .sort(
      (left, right) =>
        dateValue(left.date, left.time) -
        dateValue(right.date, right.time)
    )
    .slice(0, maxEvents)
    .map(event => {
      const {
        exdates,
        rdates,
        recurrenceKey,
        rrule,
        status,
        ...publicEvent
      } = event;
      return publicEvent;
    });
}
