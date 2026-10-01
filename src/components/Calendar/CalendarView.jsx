import React, { useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  Calendar as CalendarIcon,
  CalendarPlus,
  CakeSlice,
  BellRing,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Download,
  Grid2X2,
  History,
  HeartHandshake,
  List,
  LockKeyhole,
  MapPin,
  Plus,
  Radio,
  Trash2,
  Upload,
  UserRound
} from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import {
  canManageFamily,
  isManagedProfile
} from '../../constants/roles';
import {
  DEFAULT_MEMBER_AVATAR,
  handleImgError
} from '../../utils/imageFallback';
import { formatDate } from '../../utils/formatting';
import CalendarSubscriptionManager from './CalendarSubscriptionManager';
import EventReminderDialog from './EventReminderDialog';
import CalendarEventDialog from './CalendarEventDialog';
import {
  calendarEventColor,
  eventAudienceMembers,
  eventIsForMember,
  eventLastDate
} from '../../../shared/calendarAudience.js';
import {
  formatReminderLead,
  normalizeEventReminders
} from '../../../shared/eventReminders.js';
import {
  birthdayEventCopy,
  nextBirthdayOccurrencesOnly
} from '../../../shared/birthdays.js';
import {
  calendarDaysForView,
  calendarEventsForDay,
  shiftCalendarAnchor
} from '../../../shared/calendarGrid.js';
import {
  calendarTimelineBounds,
  layoutTimelineEvents,
  timelineEventPlacement,
  timelineAllDayEvents,
  timelineEventsForDay
} from '../../../shared/calendarTimeline.js';

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const CALENDAR_LAYOUTS = new Set(['agenda', 'week', 'month']);

function calendarViewStorageKey(activeHousehold, activeMemberId) {
  return `lx_calendar_view:${activeHousehold || 'familie'}:${activeMemberId || 'default'}`;
}

function storedCalendarView(activeHousehold, activeMemberId) {
  try {
    const value = localStorage.getItem(
      calendarViewStorageKey(activeHousehold, activeMemberId)
    );
    return CALENDAR_LAYOUTS.has(value) ? value : 'agenda';
  } catch {
    return 'agenda';
  }
}

function dateFromKey(value) {
  return new Date(`${value}T12:00:00`);
}

function dayHeading(dateKey, todayKey, t) {
  const date = dateFromKey(dateKey);
  const tomorrow = new Date(dateFromKey(todayKey).getTime() + 86_400_000);
  if (dateKey === todayKey) return t('view.day.today');
  if (dateKey === localDateKey(tomorrow)) return t('view.day.tomorrow');
  return formatDate(date, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

function eventDateValue(event) {
  return new Date(`${event.date}T${event.time || '00:00'}:00`).getTime();
}

function previousLocalDate(value) {
  const date = dateFromKey(value);
  date.setDate(date.getDate() - 1);
  return localDateKey(date);
}

function calendarRangeLabel(anchorDate, view, language) {
  const anchor = dateFromKey(anchorDate);
  if (view === 'month') {
    return new Intl.DateTimeFormat(language, {
      month: 'long',
      year: 'numeric'
    }).format(anchor);
  }
  const week = calendarDaysForView(anchorDate, 'week');
  const first = dateFromKey(week[0]);
  const last = dateFromKey(week.at(-1));
  const formatter = new Intl.DateTimeFormat(language, {
    day: 'numeric',
    month: 'short'
  });
  return `${formatter.format(first)} – ${formatter.format(last)}`;
}

function timelineTimeLabel(minutes) {
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function CalendarTimeline({
  anchorDate,
  events,
  members,
  onCreateFromSlot,
  onSelectEvent,
  t,
  todayKey
}) {
  const { i18n } = useTranslation();
  const slotStartRef = useRef(null);
  const [slotSelection, setSlotSelection] = useState(null);
  const days = useMemo(
    () => calendarDaysForView(anchorDate, 'week'),
    [anchorDate]
  );
  const entries = useMemo(
    () => days.map(dateKey => ({
      dateKey,
      allDay: timelineAllDayEvents(events, dateKey),
      timed: layoutTimelineEvents(timelineEventsForDay(events, dateKey))
    })),
    [days, events]
  );
  const bounds = useMemo(
    () => calendarTimelineBounds(entries.flatMap(entry => entry.timed)),
    [entries]
  );
  const startMinutes = bounds.startHour * 60;
  const minuteHeight = 1.1;
  const timelineHeight = (bounds.endHour - bounds.startHour) * 60 * minuteHeight;
  const hours = Array.from(
    { length: bounds.endHour - bounds.startHour + 1 },
    (_, index) => bounds.startHour + index
  );
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const showNow = days.includes(todayKey) &&
    nowMinutes >= startMinutes && nowMinutes <= bounds.endHour * 60;
  const hasAllDay = entries.some(entry => entry.allDay.length > 0);
  const lastSlotStart = bounds.endHour * 60 - 30;

  const minutesAtPointer = pointerEvent => {
    const rectangle = pointerEvent.currentTarget.getBoundingClientRect();
    const rawMinutes = startMinutes + (
      (pointerEvent.clientY - rectangle.top) / minuteHeight
    );
    return Math.max(
      startMinutes,
      Math.min(lastSlotStart, Math.round(rawMinutes / 30) * 30)
    );
  };

  const beginSlotSelection = (pointerEvent, dateKey) => {
    if (pointerEvent.button !== 0 || pointerEvent.target.closest('button')) {
      return;
    }
    const start = minutesAtPointer(pointerEvent);
    slotStartRef.current = { dateKey, start };
    setSlotSelection({ dateKey, start, end: start + 30 });
    pointerEvent.currentTarget.setPointerCapture?.(pointerEvent.pointerId);
  };

  const updateSlotSelection = pointerEvent => {
    const selected = slotStartRef.current;
    if (!selected) return;
    const current = minutesAtPointer(pointerEvent);
    const start = Math.min(selected.start, current);
    const end = Math.min(bounds.endHour * 60, Math.max(selected.start, current) + 30);
    setSlotSelection({ dateKey: selected.dateKey, start, end });
  };

  const finishSlotSelection = pointerEvent => {
    const selected = slotStartRef.current;
    if (!selected) return;
    const current = minutesAtPointer(pointerEvent);
    const start = Math.min(selected.start, current);
    const end = Math.min(bounds.endHour * 60, Math.max(selected.start, current) + 30);
    slotStartRef.current = null;
    setSlotSelection(null);
    onCreateFromSlot?.({
      date: selected.dateKey,
      time: timelineTimeLabel(start),
      endTime: timelineTimeLabel(end)
    });
  };

  return (
    <section className="calendar-timeline">
      <header className="calendar-date-grid-heading">
        <div>
          <span>{t('view.timeline.kicker')}</span>
          <h2>{calendarRangeLabel(anchorDate, 'week', i18n.language)}</h2>
          <p className="calendar-timeline-selection-hint">
            {t('view.timeline.selectHint')}
          </p>
        </div>
        <strong>{events.length}</strong>
      </header>
      <div className="calendar-timeline-scroller">
        <div
          className="calendar-timeline-board"
          style={{ '--timeline-height': `${timelineHeight}px` }}
        >
          <div className="calendar-timeline-days-heading">
            <span aria-hidden="true" />
            {entries.map(({ dateKey }) => {
              const date = dateFromKey(dateKey);
              return (
                <time
                  key={dateKey}
                  dateTime={dateKey}
                  className={dateKey === todayKey ? 'is-today' : ''}
                >
                  <span>{new Intl.DateTimeFormat(i18n.language, {
                    weekday: 'short'
                  }).format(date)}</span>
                  <strong>{date.getDate()}</strong>
                </time>
              );
            })}
          </div>
          {hasAllDay && (
            <div className="calendar-timeline-all-day">
              <span>{t('view.timeline.allDay')}</span>
              <div>
                {entries.map(({ dateKey, allDay }) => (
                  <section key={dateKey}>
                    {allDay.map(event => {
                      const accent = calendarEventColor(event, members);
                      return (
                        <button
                          key={event.id}
                          type="button"
                          style={{ '--event-color': accent }}
                          onClick={() => onSelectEvent(event)}
                          title={event.title}
                          aria-label={t('view.event.openAria', { title: event.title })}
                        >
                          {birthdayEventCopy(event, t).title}
                        </button>
                      );
                    })}
                  </section>
                ))}
              </div>
            </div>
          )}
          <div className="calendar-timeline-body">
            <div className="calendar-timeline-time-axis" aria-hidden="true">
              {hours.map(hour => <span key={hour}>{`${String(hour).padStart(2, '0')}:00`}</span>)}
            </div>
            <div className="calendar-timeline-days">
              {entries.map(({ dateKey, timed }) => (
                <section
                  key={dateKey}
                  className={`calendar-timeline-day ${
                    dateKey === todayKey ? 'is-today' : ''
                  }`}
                  onPointerDown={event => beginSlotSelection(event, dateKey)}
                  onPointerMove={updateSlotSelection}
                  onPointerUp={finishSlotSelection}
                  onPointerCancel={() => {
                    slotStartRef.current = null;
                    setSlotSelection(null);
                  }}
                >
                  {slotSelection?.dateKey === dateKey && (
                    <span
                      className="calendar-timeline-slot-selection"
                      style={{
                        '--selection-top': `${(slotSelection.start - startMinutes) * minuteHeight}px`,
                        '--selection-height': `${Math.max(33, (slotSelection.end - slotSelection.start) * minuteHeight)}px`
                      }}
                    />
                  )}
                  {timed.map((segment, index) => {
                    const event = segment.event;
                    const accent = calendarEventColor(event, members);
                    // An overlap is indicated horizontally only. The top edge
                    // must stay at the real start time; otherwise a 10:00
                    // appointment visually drifts later in the day.
                    const placement = timelineEventPlacement(
                      segment,
                      startMinutes,
                      minuteHeight
                    );
                    const displayEvent = birthdayEventCopy(event, t);
                    return (
                      <button
                        key={`${dateKey}-${event.id}`}
                        type="button"
                        className={`calendar-timeline-event ${
                          segment.stackIndex ? 'is-stacked' : ''
                        }`}
                        style={{
                          '--event-color': accent,
                          '--event-top': `${placement.top}px`,
                          '--event-height': `${placement.height}px`,
                          '--event-inset': `${placement.horizontalInset}%`,
                          '--event-layer': index + 1
                        }}
                        onClick={() => onSelectEvent(event)}
                        title={displayEvent.title}
                        aria-label={t('view.event.openAria', {
                          title: displayEvent.title
                        })}
                      >
                        <strong>{displayEvent.title}</strong>
                        <span>{timelineTimeLabel(segment.start)} – {timelineTimeLabel(segment.end)}</span>
                      </button>
                    );
                  })}
                </section>
              ))}
              {showNow && (
                <span
                  className="calendar-timeline-now"
                  style={{ '--now-top': `${(nowMinutes - startMinutes) * minuteHeight}px` }}
                >
                  <i />
                  <b>{t('view.timeline.now')}</b>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CalendarDateGrid({
  anchorDate,
  events,
  members,
  onSelectEvent,
  t,
  todayKey,
  view
}) {
  const { i18n } = useTranslation();
  const days = useMemo(
    () => calendarDaysForView(anchorDate, view),
    [anchorDate, view]
  );
  const anchorMonth = dateFromKey(anchorDate).getMonth();
  const weekdays = useMemo(() => {
    const start = dateFromKey('2026-08-03');
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start.getTime());
      date.setDate(date.getDate() + index);
      return new Intl.DateTimeFormat(i18n.language, {
        weekday: 'short'
      }).format(date);
    });
  }, [i18n.language]);

  return (
    <section className={`calendar-date-grid is-${view}`}>
      <header className="calendar-date-grid-heading">
        <div>
          <span>{t(`view.layouts.${view}`)}</span>
          <h2>{calendarRangeLabel(anchorDate, view, i18n.language)}</h2>
        </div>
        <strong>{events.length}</strong>
      </header>
      <div className="calendar-grid-weekdays" aria-hidden="true">
        {weekdays.map(day => <span key={day}>{day}</span>)}
      </div>
      <div className="calendar-grid-days">
        {days.map(dateKey => {
          const dayEvents = calendarEventsForDay(events, dateKey);
          const date = dateFromKey(dateKey);
          const outsideMonth = view === 'month' && date.getMonth() !== anchorMonth;
          return (
            <section
              key={dateKey}
              className={`calendar-grid-day ${
                dateKey === todayKey ? 'is-today' : ''
              } ${outsideMonth ? 'is-outside-month' : ''}`}
            >
              <header>
                <time dateTime={dateKey}>
                  <strong>{date.getDate()}</strong>
                  <span>{new Intl.DateTimeFormat(i18n.language, {
                    weekday: 'short'
                  }).format(date)}</span>
                </time>
                {dateKey === todayKey && <em>{t('view.layouts.today')}</em>}
              </header>
              <div className="calendar-grid-events">
                {dayEvents.slice(0, view === 'month' ? 3 : 6).map(event => {
                  const accent = calendarEventColor(event, members);
                  const displayEvent = birthdayEventCopy(event, t);
                  return (
                    <button
                      key={`${dateKey}-${event.id}`}
                      type="button"
                      style={{ '--event-color': accent }}
                      onClick={() => onSelectEvent(event)}
                      title={displayEvent.title}
                      aria-label={t('view.event.openAria', {
                        title: displayEvent.title
                      })}
                    >
                      <span>{event.allDay || !event.time
                        ? t('view.event.allDay')
                        : event.time}</span>
                      <strong>{displayEvent.title}</strong>
                    </button>
                  );
                })}
                {dayEvents.length > (view === 'month' ? 3 : 6) && (
                  <span className="calendar-grid-more">
                    {t('view.layouts.more', {
                      count: dayEvents.length - (view === 'month' ? 3 : 6)
                    })}
                  </span>
                )}
                {!dayEvents.length && <span className="calendar-grid-free">
                  {t('view.layouts.free')}
                </span>}
              </div>
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default function CalendarView() {
  const { t } = useTranslation('calendar');
  const { t: tShared } = useTranslation('shared');
  const {
    events,
    addEvent,
    deleteEvent,
    updateEvent,
    members,
    activeMember,
    calendarSubscriptions,
    exportICS,
    importICS,
    setIsQuickAddOpen,
    setQuickAddDefaultType,
    setQuickAddEventPreset,
    activeHousehold
  } = useFamily();
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');
  const [showPast, setShowPast] = useState(false);
  const [calendarView, setCalendarView] = useState(() =>
    storedCalendarView(activeHousehold, activeMember?.id)
  );
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() =>
    localDateKey()
  );
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [selectedReminderEvent, setSelectedReminderEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const todayKey = localDateKey();
  const canManage = canManageFamily(activeMember);

  const chooseCalendarView = nextView => {
    if (!CALENDAR_LAYOUTS.has(nextView)) return;
    setCalendarView(nextView);
    try {
      localStorage.setItem(
        calendarViewStorageKey(activeHousehold, activeMember?.id),
        nextView
      );
    } catch {
      // Die Ansicht bleibt für die geöffnete Sitzung nutzbar, auch wenn der
      // Browser keinen lokalen Speicher bereitstellt.
    }
  };

  const householdEvents = useMemo(
    () =>
      events.filter(
        event => (event.household || 'familie') === activeHousehold
      ),
    [activeHousehold, events]
  );

  const filteredEvents = useMemo(
    () => {
      const agendaEvents = nextBirthdayOccurrencesOnly(
        householdEvents,
        todayKey,
        { includePast: showPast }
      );
      return agendaEvents
        .filter(event => showPast || eventLastDate(event) >= todayKey)
        .filter(
          event =>
            selectedMemberFilter === 'all' ||
            eventIsForMember(event, selectedMemberFilter)
        )
        .sort((left, right) => eventDateValue(left) - eventDateValue(right));
    },
    [householdEvents, selectedMemberFilter, showPast, todayKey]
  );

  const gridEvents = useMemo(
    () =>
      nextBirthdayOccurrencesOnly(householdEvents, todayKey, {
        includePast: true
      })
        .filter(
          event =>
            selectedMemberFilter === 'all' ||
            eventIsForMember(event, selectedMemberFilter)
        )
        .sort((left, right) => eventDateValue(left) - eventDateValue(right)),
    [householdEvents, selectedMemberFilter, todayKey]
  );

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    filteredEvents.forEach(event => {
      const date = event.date < todayKey && eventLastDate(event) >= todayKey
        ? todayKey
        : event.date || todayKey;
      if (!groups.has(date)) groups.set(date, []);
      groups.get(date).push(event);
    });
    return [...groups.entries()];
  }, [filteredEvents, todayKey]);

  const todayEvents = householdEvents.filter(
    event => event.date <= todayKey && eventLastDate(event) >= todayKey
  );
  const upcomingEvents = householdEvents
    .filter(event => eventLastDate(event) >= todayKey)
    .sort((left, right) => eventDateValue(left) - eventDateValue(right));
  const nextEvent = upcomingEvents[0];

  const handleFileUpload = event => {
    const file = event.target.files?.[0];
    if (file) importICS(file);
    event.target.value = '';
  };

  return (
    <div className="family-calendar">
      <section className="calendar-hero">
        <div className="calendar-hero-copy">
          <span className="calendar-eyebrow">
            <Radio size={13} /> {t('view.hero.eyebrow')}
          </span>
          <h1>{t('view.hero.title')}</h1>
          <p>
            <Trans
              t={t}
              i18nKey="view.hero.todayCount"
              count={todayEvents.length}
            >
              Heute stehen <strong>{{ count: todayEvents.length }}</strong>{' '}
              Termine an.
            </Trans>{' '}
            {nextEvent
              ? t('view.hero.nextUp', { title: nextEvent.title })
              : t('view.hero.noNext')}
          </p>
        </div>

        <div className="calendar-hero-actions">
          {canManage && (
            <button
              type="button"
              className="calendar-source-button"
              onClick={() => setIsSourcesOpen(true)}
            >
              <Cloud size={17} />
              {t('view.actions.sources')}
              {calendarSubscriptions.length > 0 && (
                <span>{calendarSubscriptions.length}</span>
              )}
            </button>
          )}
          {canManage && <button
            type="button"
            className="calendar-add-button"
            onClick={() => {
              setQuickAddDefaultType('event');
              setQuickAddEventPreset(null);
              setIsQuickAddOpen(true);
            }}
          >
            <Plus size={18} /> {t('view.actions.newEvent')}
          </button>}
        </div>

        <div className="calendar-hero-orbit" aria-hidden="true">
          <CalendarIcon size={48} />
        </div>
      </section>

      <section className="calendar-control-deck">
        <div className="calendar-person-filter" aria-label={t('view.filter.ariaLabel')}>
          <button
            type="button"
            className={selectedMemberFilter === 'all' ? 'is-active' : ''}
            onClick={() => setSelectedMemberFilter('all')}
          >
            <span><UserRound size={16} /></span>
            {t('view.filter.all')}
          </button>
          {members.map(member => (
            <button
              type="button"
              key={member.id}
              className={
                selectedMemberFilter === member.id ? 'is-active' : ''
              }
              style={{ '--member-color': member.color }}
              onClick={() => setSelectedMemberFilter(member.id)}
            >
              <img
                src={member.avatar || DEFAULT_MEMBER_AVATAR}
                onError={event =>
                  handleImgError(event, DEFAULT_MEMBER_AVATAR)
                }
                alt=""
              />
              <span className="calendar-person-name">
                <span
                  className="calendar-person-label"
                  title={member.name}
                >
                  {isManagedProfile(member)
                    ? member.name
                    : member.name.split(' ')[0]}
                </span>
                {isManagedProfile(member) && (
                  <small>{t('view.filter.managed')}</small>
                )}
              </span>
            </button>
          ))}
        </div>

        <div className="calendar-tools">
          <div
            className="calendar-view-switcher"
            role="group"
            aria-label={t('view.layouts.ariaLabel')}
          >
            <button
              type="button"
              className={calendarView === 'agenda' ? 'is-active' : ''}
              aria-pressed={calendarView === 'agenda'}
              onClick={() => chooseCalendarView('agenda')}
              title={t('view.layouts.agenda')}
            >
              <List size={16} /> <span>{t('view.layouts.agenda')}</span>
            </button>
            <button
              type="button"
              className={calendarView === 'week' ? 'is-active' : ''}
              aria-pressed={calendarView === 'week'}
              onClick={() => chooseCalendarView('week')}
              title={t('view.layouts.week')}
            >
              <CalendarDays size={16} /> <span>{t('view.layouts.week')}</span>
            </button>
            <button
              type="button"
              className={calendarView === 'month' ? 'is-active' : ''}
              aria-pressed={calendarView === 'month'}
              onClick={() => chooseCalendarView('month')}
              title={t('view.layouts.month')}
            >
              <Grid2X2 size={15} /> <span>{t('view.layouts.month')}</span>
            </button>
          </div>
          <button
            type="button"
            className="calendar-history-toggle"
            onClick={() => setShowPast(value => !value)}
          >
            <History size={15} />
            {showPast ? t('view.tools.hidePast') : t('view.tools.showPast')}
          </button>
          <button type="button" onClick={exportICS}>
            <Download size={15} /> {t('view.tools.export')}
          </button>
          {canManage && <label className="calendar-import-action">
            <Upload size={15} /> {t('view.tools.import')}
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleFileUpload}
            />
          </label>}
        </div>
      </section>

      {calendarView !== 'agenda' && (
        <section className="calendar-period-navigation">
          <button
            type="button"
            onClick={() => setCalendarAnchorDate(previous =>
              shiftCalendarAnchor(previous, calendarView, -1)
            )}
            aria-label={t('view.layouts.previous')}
            title={t('view.layouts.previous')}
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            className="calendar-period-today"
            onClick={() => setCalendarAnchorDate(todayKey)}
          >
            {t('view.layouts.today')}
          </button>
          <button
            type="button"
            onClick={() => setCalendarAnchorDate(previous =>
              shiftCalendarAnchor(previous, calendarView, 1)
            )}
            aria-label={t('view.layouts.next')}
            title={t('view.layouts.next')}
          >
            <ChevronRight size={18} />
          </button>
        </section>
      )}

      <section
        className={`calendar-agenda ${
          calendarView !== 'agenda' ? 'is-hidden' : ''
        }`}
      >
        <header className="calendar-agenda-heading">
          <div>
            <span>{t('view.agenda.kicker')}</span>
            <h2>{t('view.agenda.title')}</h2>
          </div>
          <strong>
            {t('view.agenda.count', { count: filteredEvents.length })}
          </strong>
        </header>

        {groupedEvents.length === 0 ? (
          <div className="calendar-empty-state">
            <span><CalendarPlus size={30} /></span>
            <h3>{t('view.empty.title')}</h3>
            <p>{t('view.empty.description')}</p>
            {canManage && <button
              type="button"
              onClick={() => {
                setQuickAddDefaultType('event');
                setQuickAddEventPreset(null);
                setIsQuickAddOpen(true);
              }}
            >
              <Plus size={16} /> {t('view.empty.cta')}
            </button>}
          </div>
        ) : (
          <div className="calendar-day-groups">
            {groupedEvents.map(([dateKey, dayEvents]) => (
              <section className="calendar-day-group" key={dateKey}>
                <header>
                  <time dateTime={dateKey}>
                    <strong>{dateKeyFromDay(dateKey)}</strong>
                    <span>{dayHeading(dateKey, todayKey, t)}</span>
                  </time>
                  <i />
                </header>

                <div className="calendar-day-events">
                  {dayEvents.map(event => {
                    const audienceMembers = eventAudienceMembers(event, members);
                    const accent = calendarEventColor(event, members);
                    const reminders = normalizeEventReminders(
                      event.reminders
                    );
                    const lastDate = eventLastDate(event);
                    const formattedLastDate = lastDate !== event.date
                      ? formatDate(dateFromKey(lastDate), {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '';
                    const displayEvent = birthdayEventCopy(event, t);
                    return (
                      <article
                        key={event.id}
                        className={`calendar-event-card ${
                          event.readOnly ? 'is-subscribed' : ''
                        }`}
                        style={{ '--event-color': accent }}
                        role="button"
                        tabIndex="0"
                        aria-label={t('view.event.openAria', {
                          title: displayEvent.title
                        })}
                        onClick={() => setSelectedEvent(event)}
                        onKeyDown={keyboardEvent => {
                          if (
                            keyboardEvent.key === 'Enter' ||
                            keyboardEvent.key === ' '
                          ) {
                            keyboardEvent.preventDefault();
                            setSelectedEvent(event);
                          }
                        }}
                      >
                        <div className="calendar-event-time">
                          <strong>
                            {event.allDay || !event.time
                              ? t('view.event.allDay')
                              : event.time}
                          </strong>
                          {formattedLastDate ? (
                            <span>
                              {event.allDay
                                ? t('view.event.throughDate', {
                                    date: formattedLastDate
                                  })
                                : t('view.event.untilDateTime', {
                                    date: formattedLastDate,
                                    time: event.endTime || event.time
                                  })}
                            </span>
                          ) : event.endTime ? (
                            <span>
                              {t('view.event.until', { time: event.endTime })}
                            </span>
                          ) : null}
                        </div>

                        <div className="calendar-event-copy">
                          <div className="calendar-event-title">
                            <h3>{displayEvent.title}</h3>
                            {event.readOnly && (
                              <span title={
                                event.birthdayMemberId
                                  ? t('view.event.birthdayTitle')
                                  : t('view.event.fromSubscriptionTitle')
                              }>
                                {event.birthdayMemberId
                                  ? <CakeSlice size={12} />
                                  : event.sharedEventId
                                  ? <HeartHandshake size={12} />
                                  : <LockKeyhole size={12} />}
                                {event.birthdayMemberId
                                  ? t('view.event.familyBirthday')
                                  : event.sharedEventId
                                  ? t('view.event.fromFamily', {
                                      name: event.sharedOwnerFamilyName
                                    })
                                    : displayEvent.sourceName ||
                                    t('view.event.subscriptionFallback')}
                              </span>
                            )}
                            {!event.readOnly &&
                              event.sharedWithFamilies?.length > 0 && (
                                <span title={t('view.event.sharedWithTitle')}>
                                  <HeartHandshake size={12} />
                                  {t('view.event.sharedWith', {
                                    names: event.sharedWithFamilies
                                      .map(family => family.familyName)
                                      .join(', ')
                                  })}
                                </span>
                              )}
                          </div>
                          <div className="calendar-event-details">
                            {displayEvent.location && (
                              <span>
                                <MapPin size={13} /> {displayEvent.location}
                              </span>
                            )}
                            <span>
                              <UserRound size={13} />
                              {audienceMembers.length
                                ? audienceMembers
                                    .map(entry => entry.name)
                                    .join(', ')
                                : t('view.event.wholeFamily')}
                            </span>
                            {reminders.length > 0 && (
                              <span className="calendar-event-reminders">
                                <BellRing size={13} />
                                {reminders
                                  .slice(0, 2)
                                  .map(minutes =>
                                    formatReminderLead(minutes, true, tShared)
                                  )
                                  .join(' · ')}
                                {reminders.length > 2
                                  ? ` +${reminders.length - 2}`
                                  : ''}
                              </span>
                            )}
                          </div>
                          {displayEvent.notes && <p>{displayEvent.notes}</p>}
                        </div>

                        {event.readOnly || !canManage ? (
                          <span
                            className="calendar-event-readonly"
                            title={t('view.event.readOnlyTitle')}
                          >
                            {event.birthdayMemberId
                              ? <CakeSlice size={16} />
                              : <Cloud size={16} />}
                          </span>
                        ) : (
                          <div className="calendar-event-actions">
                            {!event.sharedEventId && (
                              <button
                                type="button"
                                className="calendar-event-reminder-button"
                                onClick={clickEvent => {
                                  clickEvent.stopPropagation();
                                  setSelectedReminderEvent(event)
                                }}
                                title={t('view.event.editRemindersTitle')}
                                aria-label={t('view.event.editRemindersAria', {
                                  title: displayEvent.title
                                })}
                              >
                                <BellRing size={16} />
                              </button>
                            )}
                            <button
                              type="button"
                              className="calendar-event-delete"
                              onClick={clickEvent => {
                                clickEvent.stopPropagation();
                                deleteEvent(event.id);
                              }}
                              title={t('view.event.deleteTitle')}
                              aria-label={t('view.event.deleteAria', {
                                title: displayEvent.title
                              })}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                        <ChevronRight
                          className="calendar-event-chevron"
                          size={17}
                          aria-hidden="true"
                        />
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </section>

      {calendarView === 'week' && (
        <CalendarTimeline
          anchorDate={calendarAnchorDate}
          events={gridEvents}
          members={members}
          onCreateFromSlot={canManage ? slot => {
            setQuickAddDefaultType('event');
            setQuickAddEventPreset(slot);
            setIsQuickAddOpen(true);
          } : undefined}
          onSelectEvent={setSelectedEvent}
          t={t}
          todayKey={todayKey}
        />
      )}

      {calendarView === 'month' && (
        <CalendarDateGrid
          anchorDate={calendarAnchorDate}
          events={gridEvents}
          members={members}
          onSelectEvent={setSelectedEvent}
          t={t}
          todayKey={todayKey}
          view={calendarView}
        />
      )}

      <CalendarSubscriptionManager
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />
      <EventReminderDialog
        event={selectedReminderEvent}
        onClose={() => setSelectedReminderEvent(null)}
        onSave={(event, reminders) =>
          updateEvent(event.id, { reminders })
        }
      />
      <CalendarEventDialog
        canEdit={canManage}
        event={selectedEvent}
        members={members}
        onClose={() => setSelectedEvent(null)}
        onSave={(event, changes) => updateEvent(event, changes)}
        onDuplicate={async (_event, changes) => {
          const duplicate = await addEvent({
            ...changes,
            title: t('editor.duplicateTitle', { title: changes.title })
          });
          if (duplicate) setSelectedEvent(duplicate);
          return duplicate;
        }}
        onDelete={event => deleteEvent(event.id)}
      />
    </div>
  );
}

function dateKeyFromDay(value) {
  const date = dateFromKey(value);
  return formatDate(date, {
    day: '2-digit',
    month: 'short'
  });
}
