import { previewCalendarImport, importedCalendarComponent } from '../../shared/icsImport.js';
import { calendarRecurrenceRRule } from '../../shared/calendarRecurrence.js';
import i18n from '../i18n/index.js';

function escapeIcsText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

function dateStamp() {
  return new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function icsDate(value) {
  return String(value || '').slice(0, 10).replace(/-/g, '');
}

function icsTime(value) {
  return String(value || '').replace(':', '').padEnd(4, '0').slice(0, 4) + '00';
}

function nextDateKey(value) {
  const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function exportEventsToICSContent(
  events,
  familyName = i18n.t('context:ics.defaultFamilyName')
) {
  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LX Family//Private Family OS//DE',
    `X-WR-CALNAME:${escapeIcsText(
      i18n.t('context:ics.calendarName', { familyName })
    )}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  events
    .filter(event => !event.readOnly)
    .forEach(event => {
      if (event.icsSource) {
        const calendar = importedCalendarComponent(event);
        icsContent.push(...calendar.getAllSubcomponents().map(component => component.toString()));
        return;
      }
      const eventDate = event.date || new Date().toISOString().split('T')[0];
      const formattedDate = icsDate(eventDate);
      const formattedTime = icsTime(event.time || '09:00');
      icsContent.push('BEGIN:VEVENT');
      icsContent.push(
        `UID:${escapeIcsText(event.id || `event-${formattedDate}`)}@lxfamily.local`
      );
      icsContent.push(`DTSTAMP:${dateStamp()}`);
      if (event.allDay || !event.time) {
        icsContent.push(`DTSTART;VALUE=DATE:${formattedDate}`);
        // iCalendar all-day end dates are exclusive. LX already persists them
        // in this format, so a selected inclusive end date remains intact.
        icsContent.push(
          `DTEND;VALUE=DATE:${icsDate(event.endDate || nextDateKey(eventDate))}`
        );
      } else {
        icsContent.push(`DTSTART:${formattedDate}T${formattedTime}`);
        if (event.endDate || event.endTime) {
          icsContent.push(
            `DTEND:${icsDate(event.endDate || eventDate)}T${icsTime(
              event.endTime || event.time
            )}`
          );
        }
      }
      icsContent.push(
        `SUMMARY:${escapeIcsText(
          event.title || i18n.t('context:ics.defaultEventTitle')
        )}`
      );
      if (event.location) {
        icsContent.push(`LOCATION:${escapeIcsText(event.location)}`);
      }
      if (event.notes) {
        icsContent.push(`DESCRIPTION:${escapeIcsText(event.notes)}`);
      }
      const rrule = calendarRecurrenceRRule(event);
      if (rrule) icsContent.push(`RRULE:${rrule}`);
      const categories = event.categories?.length ? event.categories : event.category ? [event.category] : [];
      if (categories.length) icsContent.push(`CATEGORIES:${categories.map(escapeIcsText).join(',')}`);
      icsContent.push('END:VEVENT');
    });

  icsContent.push('END:VCALENDAR');
  return icsContent.join('\r\n');
}

export function exportEventsToICS(
  events,
  familyName = i18n.t('context:ics.defaultFamilyName')
) {
  const content = exportEventsToICSContent(events, familyName);

  const blob = new Blob(
    [content],
    { type: 'text/calendar;charset=utf-8;' }
  );
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  link.href = objectUrl;
  link.setAttribute(
    'download',
    i18n.t('context:ics.exportFileName', {
      date: new Date().toISOString().split('T')[0]
    })
  );
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(objectUrl);
}

export function parseICSContent(icsString) {
  return previewCalendarImport(icsString).records.map(
    (event, index) => ({
      ...event,
      id: `ics-${Date.now()}-${index}-${Math.random()
        .toString(36)
        .slice(2, 6)}`,
      memberId: 'all'
    })
  );
}
