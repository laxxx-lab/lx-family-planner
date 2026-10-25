import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  CloudDownload,
  Link2,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import {
  formatReminderLead,
  normalizeTrashReminders,
  TRASH_DEFAULT_REMINDERS
} from '../../../shared/eventReminders.js';
import { useFamily } from '../../context/FamilyContext';
import { formatDate } from '../../utils/formatting';
import { parseICalendar } from '../../../shared/icsCalendar.js';
import { canManageFamily } from '../../constants/roles';
import { groupTrashEventsByDate, trashGroupTitle } from '../../../shared/trashSchedule.js';
import { useViewportScrollLock } from '../../hooks/useViewportScrollLock';
import EventReminderDialog from './EventReminderDialog';
import EventReminderPicker from './EventReminderPicker';

const TRASH_TYPES = [
  { id: 'rest', color: '#4b5563', icon: '🗑️' },
  { id: 'papier', color: '#2563eb', icon: '📦' },
  { id: 'bio', color: '#15803d', icon: '🍎' },
  { id: 'gelb', color: '#d97706', icon: '🟡' }
];

export function initialTrashEvents(t) {
  return TRASH_TYPES.map((type, index) => ({
    id: `trsh-${index + 1}`,
    title: t(`trash.types.${type.id}`),
    date: new Date(Date.now() + 86_400_000 * (index * 2 + 1))
      .toISOString()
      .split('T')[0],
    type: type.id,
    reminders: [...TRASH_DEFAULT_REMINDERS]
  }));
}

function detectTrashType(title) {
  const normalized = String(title || '').toLocaleLowerCase('de-DE');
  if (
    normalized.includes('papier') ||
    normalized.includes('blau') ||
    normalized.includes('paper') ||
    normalized.includes('cardboard') ||
    normalized.includes('blue')
  ) {
    return 'papier';
  }
  if (
    normalized.includes('bio') ||
    normalized.includes('braun') ||
    normalized.includes('grün') ||
    normalized.includes('organic') ||
    normalized.includes('compost') ||
    normalized.includes('brown') ||
    normalized.includes('green')
  ) {
    return 'bio';
  }
  if (
    normalized.includes('gelb') ||
    normalized.includes('wertstoff') ||
    normalized.includes('sack') ||
    normalized.includes('yellow') ||
    normalized.includes('recycl') ||
    normalized.includes('packaging') ||
    normalized.includes('plastic')
  ) {
    return 'gelb';
  }
  return 'rest';
}

function localTrashDate(date) {
  return new Date(`${date}T12:00:00`);
}

export default function TrashCalendarView() {
  const { t } = useTranslation('calendar');
  const { t: tShared } = useTranslation('shared');
  const {
    showToast,
    trashEvents,
    addTrashEvent,
    addTrashEvents,
    updateTrashEvent,
    deleteTrashEvent,
    activeHousehold,
    activeMember,
    calendarSubscriptions,
    addCalendarSubscription,
    syncCalendarSubscription,
    deleteCalendarSubscription
  } = useFamily();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState(() => t('trash.types.rest'));
  const [newDate, setNewDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [newType, setNewType] = useState('rest');
  const [newReminders, setNewReminders] = useState([
    ...TRASH_DEFAULT_REMINDERS
  ]);
  const [reminderEvent, setReminderEvent] = useState(null);
  const [isFeedOpen, setIsFeedOpen] = useState(false);
  const [feedBusy, setFeedBusy] = useState('');
  const [feedForm, setFeedForm] = useState({ name: '', url: '' });
  useViewportScrollLock(isAddOpen || isFeedOpen || Boolean(reminderEvent));
  const canManage = canManageFamily(activeMember);
  const trashSubscriptions = useMemo(
    () => calendarSubscriptions.filter(subscription => subscription.kind === 'trash'),
    [calendarSubscriptions]
  );

  const upcomingTrash = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return trashEvents
      .filter(
        item =>
          item.date >= today &&
          (item.household || 'familie') === activeHousehold
      )
      .sort((left, right) => left.date.localeCompare(right.date));
  }, [activeHousehold, trashEvents]);
  const upcomingTrashGroups = useMemo(
    () => groupTrashEventsByDate(upcomingTrash),
    [upcomingTrash]
  );

  const closeAddDialog = () => {
    setIsAddOpen(false);
    setNewReminders([...TRASH_DEFAULT_REMINDERS]);
  };

  const handleImportTrashICS = event => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async loadEvent => {
      const parsed = parseICalendar(loadEvent.target.result, { maxEvents: 1000 });
      if (!parsed.length) {
        showToast(
          t('trash.toast.importFailedTitle'),
          t('trash.toast.importFailedBody'),
          'warning'
        );
        return;
      }

      const importedTrash = parsed.map(entry => ({
        id: `trsh-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: entry.title,
        date: entry.date,
        type: detectTrashType(entry.title),
        reminders: [...TRASH_DEFAULT_REMINDERS]
      }));
      const result = await addTrashEvents(importedTrash);
      if (!result) return;
      showToast(
        t('trash.toast.importSuccessTitle'),
        t('trash.toast.importSuccessBody', { count: importedTrash.length }),
        'success'
      );
      event.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleAddManual = async event => {
    event.preventDefault();
    const result = await addTrashEvent({
      id: `trsh-${Date.now()}`,
      title: newTitle,
      date: newDate,
      type: newType,
      reminders: newReminders
    });
    if (!result) return;
    closeAddDialog();
    showToast(
      t('trash.toast.addedTitle'),
      t('trash.toast.addedBody', {
        date: formatDate(localTrashDate(newDate))
      }),
      'success'
    );
  };

  const connectTrashFeed = async event => {
    event.preventDefault();
    setFeedBusy('connect');
    const result = await addCalendarSubscription({
      ...feedForm,
      kind: 'trash',
      color: '#66736e',
      memberId: 'all',
      household: activeHousehold
    });
    setFeedBusy('');
    if (result) setFeedForm({ name: '', url: '' });
  };

  const syncTrashFeed = async subscriptionId => {
    setFeedBusy(`sync:${subscriptionId}`);
    await syncCalendarSubscription(subscriptionId);
    setFeedBusy('');
  };

  const removeTrashFeed = async subscription => {
    if (!window.confirm(t('trash.feed.confirmRemove', { name: subscription.name }))) {
      return;
    }
    setFeedBusy(`delete:${subscription.id}`);
    await deleteCalendarSubscription(subscription.id);
    setFeedBusy('');
  };

  const saveTrashReminders = async (event, reminders) => {
    const result = await updateTrashEvent(event.id, { reminders });
    if (result) {
      showToast(
        reminders.length
          ? t('trash.toast.reminderSavedTitle')
          : t('trash.toast.reminderOffTitle'),
        reminders.length
          ? t('trash.toast.reminderSavedBody', {
              leads: reminders
                .map(minutes => formatReminderLead(minutes, false, tShared))
                .join(', ')
            })
          : t('trash.toast.reminderOffBody', { title: event.title }),
        'success'
      );
    }
    return result;
  };

  const nextPickup = upcomingTrashGroups[0];
  const typeForItem = item =>
    TRASH_TYPES.find(type => type.id === item.type) || TRASH_TYPES[0];
  const titleForItem = item => item.titleKey ? t(item.titleKey) : item.title;
  const nextPickupTitle = trashGroupTitle(nextPickup, titleForItem);

  return (
    <div className="trash-calendar">
      <section className="card trash-calendar-header">
        <div className="trash-calendar-heading">
          <span className="trash-calendar-heading-mark">
            <Trash2 size={25} />
          </span>
          <div>
            <h2 className="card-title">{t('trash.header.title')}</h2>
            <p>{t('trash.header.description')}</p>
          </div>
        </div>

        <div className="trash-calendar-actions">
          {canManage && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setIsFeedOpen(true)}
            >
              <Link2 size={16} /> {t('trash.header.connectUrl')}
            </button>
          )}
          <label className="btn-secondary trash-calendar-import">
            <Upload size={16} /> {t('trash.header.import')}
            <input
              type="file"
              accept=".ics,text/calendar"
              onChange={handleImportTrashICS}
            />
          </label>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setIsAddOpen(true)}
          >
            <Plus size={16} /> {t('trash.header.add')}
          </button>
        </div>
      </section>

      {nextPickup ? (
        <section className="trash-next-pickup">
          <div className="trash-next-pickup-main">
            <span className="trash-next-pickup-icon trash-next-pickup-icons">
              {nextPickup.items.map(item => (
                <i key={item.id}>{typeForItem(item).icon}</i>
              ))}
            </span>
            <div>
              <span>{t('trash.next.kicker')}</span>
              <h3>{nextPickupTitle}</h3>
              <p>
                {formatDate(localTrashDate(nextPickup.date), {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </p>
            </div>
          </div>
          <div className="trash-next-pickup-callout">
            {t('trash.next.callout')}
          </div>
        </section>
      ) : null}

      <section className="card trash-schedule">
        <header>
          <div>
            <span>{t('trash.schedule.kicker')}</span>
            <h3>{t('trash.schedule.title')}</h3>
          </div>
          <b>{upcomingTrashGroups.length}</b>
        </header>

        {!upcomingTrashGroups.length ? (
          <div className="trash-schedule-empty">
            <span>🗓️</span>
            <strong>{t('trash.schedule.emptyTitle')}</strong>
            <p>{t('trash.schedule.emptyDescription')}</p>
          </div>
        ) : (
          <div className="trash-schedule-list">
            {upcomingTrashGroups.map(group => {
              const item = group.items[0];
              const type = typeForItem(item);
              const reminders = normalizeTrashReminders(item.reminders);
              const itemTitle = trashGroupTitle(group, titleForItem);
              return (
                <article
                  key={group.date}
                  className="trash-schedule-row is-group"
                  style={{ '--trash-color': type.color }}
                >
                  <span className="trash-schedule-icon trash-schedule-icons">
                    {group.items.map(entry => (
                      <i key={entry.id}>{typeForItem(entry).icon}</i>
                    ))}
                  </span>
                  <div className="trash-schedule-copy">
                    <strong>{itemTitle}</strong>
                    <span>
                      {formatDate(localTrashDate(group.date), {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                    <button
                      type="button"
                      className={
                        reminders.length
                          ? 'trash-reminder-summary is-active'
                          : 'trash-reminder-summary'
                      }
                      onClick={() =>
                        setReminderEvent({
                          ...item,
                          allDay: true,
                          reminderKind: 'trash',
                          reminders
                        })
                      }
                    >
                      {reminders.length ? (
                        <Bell size={13} />
                      ) : (
                        <BellOff size={13} />
                      )}
                      {reminders.length
                        ? reminders
                            .map(minutes =>
                              formatReminderLead(minutes, true, tShared)
                            )
                            .join(' · ')
                        : t('trash.schedule.reminderOff')}
                    </button>
                    {group.items.slice(1).map(entry => {
                      const entryReminders = normalizeTrashReminders(entry.reminders);
                      const entryTitle = titleForItem(entry);
                      return (
                        <button
                          key={entry.id}
                          type="button"
                          className={
                            entryReminders.length
                              ? 'trash-reminder-summary is-active'
                              : 'trash-reminder-summary'
                          }
                          onClick={() =>
                            setReminderEvent({
                              ...entry,
                              allDay: true,
                              reminderKind: 'trash',
                              reminders: entryReminders
                            })
                          }
                        >
                          {entryReminders.length ? <Bell size={13} /> : <BellOff size={13} />}
                          <strong>{entryTitle}</strong>
                          {entryReminders.length
                            ? entryReminders
                                .map(minutes =>
                                  formatReminderLead(minutes, true, tShared)
                                )
                                .join(' Â· ')
                            : t('trash.schedule.reminderOff')}
                        </button>
                      );
                    })}
                  </div>
                  <div className="trash-schedule-row-actions">
                    <button
                      type="button"
                      className="icon-circle-btn"
                      onClick={() =>
                        setReminderEvent({
                          ...item,
                          allDay: true,
                          reminderKind: 'trash',
                          reminders
                        })
                      }
                      title={t('trash.schedule.editReminderTitle')}
                      aria-label={t('trash.schedule.editReminderAria', {
                        title: itemTitle
                      })}
                    >
                      <Bell size={16} />
                    </button>
                    <button
                      type="button"
                      className="icon-circle-btn trash-delete-button"
                      onClick={() => deleteTrashEvent(item.id)}
                      title={t('trash.schedule.removeTitle')}
                      aria-label={t('trash.schedule.removeAria', {
                        title: itemTitle
                      })}
                    >
                      <Trash2 size={16} />
                    </button>
                    {group.items.slice(1).map(entry => {
                      const entryReminders = normalizeTrashReminders(entry.reminders);
                      const entryTitle = titleForItem(entry);
                      return (
                        <span className="trash-group-action-pair" key={entry.id}>
                          <button
                            type="button"
                            className="icon-circle-btn"
                            onClick={() =>
                              setReminderEvent({
                                ...entry,
                                allDay: true,
                                reminderKind: 'trash',
                                reminders: entryReminders
                              })
                            }
                            title={t('trash.schedule.editReminderTitle')}
                            aria-label={t('trash.schedule.editReminderAria', {
                              title: entryTitle
                            })}
                          >
                            <Bell size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-circle-btn trash-delete-button"
                            onClick={() => deleteTrashEvent(entry.id)}
                            title={t('trash.schedule.removeTitle')}
                            aria-label={t('trash.schedule.removeAria', {
                              title: entryTitle
                            })}
                          >
                            <Trash2 size={16} />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {isAddOpen
        ? createPortal(
          <div className="modal-backdrop" onClick={closeAddDialog}>
          <div
            className="modal-card trash-add-dialog"
            onClick={event => event.stopPropagation()}
          >
            <div className="card-header">
              <div>
                <span className="trash-dialog-eyebrow">
                  {t('trash.dialog.eyebrow')}
                </span>
                <h2 className="card-title">{t('trash.dialog.title')}</h2>
              </div>
              <button
                type="button"
                className="icon-circle-btn"
                onClick={closeAddDialog}
                aria-label={t('common:actions.close')}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddManual}>
              <div className="form-group">
                <label className="form-label">
                  {t('trash.dialog.typeLabel')}
                </label>
                <select
                  className="form-select"
                  value={newType}
                  onChange={event => {
                    setNewType(event.target.value);
                    setNewTitle(t(`trash.types.${event.target.value}`));
                  }}
                >
                  {TRASH_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {t(`trash.types.${type.id}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('trash.dialog.nameLabel')}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={newTitle}
                  onChange={event => setNewTitle(event.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  {t('trash.dialog.dateLabel')}
                </label>
                <input
                  type="date"
                  className="form-input"
                  value={newDate}
                  onChange={event => setNewDate(event.target.value)}
                  required
                />
              </div>

              <EventReminderPicker
                value={newReminders}
                onChange={setNewReminders}
              />

              <div className="trash-add-actions">
                <button type="button" className="btn-secondary" onClick={closeAddDialog}>
                  {t('common:actions.cancel')}
                </button>
                <button type="submit" className="btn-primary">
                  {t('trash.dialog.save')}
                </button>
              </div>
            </form>
          </div>
          </div>,
          document.body
        )
        : null}

      {isFeedOpen
        ? createPortal(
          <div className="modal-backdrop" onClick={() => setIsFeedOpen(false)}>
            <section
              className="modal-card trash-feed-dialog"
              onClick={event => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="trash-feed-title"
            >
              <header className="trash-feed-heading">
                <span><CloudDownload size={22} /></span>
                <div>
                  <small>{t('trash.feed.kicker')}</small>
                  <h2 id="trash-feed-title">{t('trash.feed.title')}</h2>
                  <p>{t('trash.feed.description')}</p>
                </div>
                <button
                  type="button"
                  className="icon-circle-btn"
                  onClick={() => setIsFeedOpen(false)}
                  aria-label={t('common:actions.close')}
                >
                  <X size={19} />
                </button>
              </header>

              <div className="trash-feed-body">
                <div className="trash-feed-list">
                  {trashSubscriptions.length ? trashSubscriptions.map(subscription => (
                    <article key={subscription.id}>
                      <span><CloudDownload size={17} /></span>
                      <div>
                        <strong>{subscription.name}</strong>
                        <small>
                          {subscription.host} · {t('trash.feed.pickupCount', {
                            count: subscription.eventCount
                          })}
                        </small>
                        {subscription.lastError && <em>{subscription.lastError}</em>}
                      </div>
                      <button
                        type="button"
                        onClick={() => void syncTrashFeed(subscription.id)}
                        disabled={Boolean(feedBusy)}
                        title={t('trash.feed.sync')}
                      >
                        <RefreshCw
                          size={16}
                          className={feedBusy === `sync:${subscription.id}` ? 'spin' : ''}
                        />
                      </button>
                      <button
                        type="button"
                        className="is-danger"
                        onClick={() => void removeTrashFeed(subscription)}
                        disabled={Boolean(feedBusy)}
                        title={t('trash.feed.remove')}
                      >
                        <Trash2 size={16} />
                      </button>
                    </article>
                  )) : (
                    <div className="trash-feed-empty">{t('trash.feed.empty')}</div>
                  )}
                </div>

                <form className="trash-feed-form" onSubmit={connectTrashFeed}>
                  <label>
                    <span>{t('trash.feed.name')}</span>
                    <input
                      value={feedForm.name}
                      onChange={event => setFeedForm(previous => ({
                        ...previous,
                        name: event.target.value
                      }))}
                      placeholder={t('trash.feed.namePlaceholder')}
                      maxLength={100}
                      required
                    />
                  </label>
                  <label>
                    <span>{t('trash.feed.url')}</span>
                    <input
                      type="url"
                      value={feedForm.url}
                      onChange={event => setFeedForm(previous => ({
                        ...previous,
                        url: event.target.value
                      }))}
                      placeholder="https://…/abfallkalender.ics"
                      maxLength={4000}
                      required
                    />
                  </label>
                  <p>{t('trash.feed.security')}</p>
                  <button className="btn-primary" disabled={Boolean(feedBusy)}>
                    <Link2 size={16} />
                    {feedBusy === 'connect'
                      ? t('trash.feed.connecting')
                      : t('trash.feed.connect')}
                  </button>
                </form>
              </div>
            </section>
          </div>,
          document.body
        )
        : null}

      <EventReminderDialog
        event={reminderEvent}
        onClose={() => setReminderEvent(null)}
        onSave={saveTrashReminders}
      />
    </div>
  );
}
