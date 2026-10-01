import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  CalendarClock,
  CakeSlice,
  Check,
  CopyPlus,
  LockKeyhole,
  MapPin,
  Repeat2,
  Trash2,
  X
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { eventAudienceIds } from '../../../shared/calendarAudience.js';
import { normalizeEventReminders } from '../../../shared/eventReminders.js';
import { birthdayEventCopy } from '../../../shared/birthdays.js';
import { useViewportScrollLock } from '../../hooks/useViewportScrollLock';
import EventAudiencePicker from './EventAudiencePicker';
import EventReminderPicker from './EventReminderPicker';

function addLocalDays(value, days) {
  if (!value) return '';
  const date = new Date(`${value}T12:00:00`);
  date.setDate(date.getDate() + days);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function formState(event, t) {
  const displayEvent = birthdayEventCopy(event, t);
  return {
    title: displayEvent.title,
    date: event?.seriesStartDate || event?.date || '',
    time: event?.time || '09:00',
    allDay: Boolean(event?.allDay),
    endDate:
      event?.allDay && (event?.seriesStartEndDate || event?.endDate)
        ? addLocalDays(event.seriesStartEndDate || event.endDate, -1)
        : event?.seriesStartEndDate || event?.endDate || '',
    endTime: event?.endTime || '',
    memberIds: eventAudienceIds(event),
    location: displayEvent.location,
    notes: displayEvent.notes,
    reminders: normalizeEventReminders(event?.reminders),
    recurrenceRule: event?.recurrenceRule || 'none',
    recurrenceInterval: Math.max(1, Number(event?.recurrenceInterval) || 1),
    recurrenceUnit: event?.recurrenceUnit || 'weeks',
    recurrenceUntil: event?.recurrenceUntil || ''
  };
}

export default function CalendarEventDialog({
  event,
  members,
  onClose,
  onSave,
  onDuplicate,
  onDelete,
  canEdit = true
}) {
  const { t } = useTranslation('calendar');
  const [form, setForm] = useState(() => formState(event, t));
  const [saving, setSaving] = useState(false);
  const editable = Boolean(canEdit && event && !event.readOnly);
  const isBirthday = Boolean(event?.birthdayMemberId);
  // On iPhones, focusing an input opens the keyboard before people can see
  // the form. Mouse and keyboard users still get the useful desktop focus.
  const shouldAutofocusTitle = Boolean(
    typeof window !== 'undefined' &&
    window.matchMedia?.('(pointer: fine)').matches
  );
  useViewportScrollLock(Boolean(event));

  useEffect(
    () => setForm(formState(event, t)),
    [event, t]
  );

  useEffect(() => {
    const onKeyDown = keyboardEvent => {
      if (keyboardEvent.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, saving]);

  const endDateInvalid = useMemo(
    () => Boolean(form.endDate && form.date && form.endDate < form.date),
    [form.date, form.endDate]
  );

  if (!event) return null;

  const displayEvent = birthdayEventCopy(event, t);

  const patch = changes => setForm(previous => ({ ...previous, ...changes }));
  const submit = async formEvent => {
    formEvent.preventDefault();
    if (!editable || saving || endDateInvalid) return;
    setSaving(true);
    try {
      const result = await onSave(event, {
        title: form.title.trim(),
        date: form.date,
        time: form.allDay ? '' : form.time,
        allDay: form.allDay,
        endDate:
          form.allDay && form.endDate
            ? addLocalDays(form.endDate, 1)
            : form.endDate,
        endTime: form.allDay ? '' : form.endTime,
        memberIds: form.memberIds,
        memberId: form.memberIds[0] || 'all',
        location: form.location.trim(),
        notes: form.notes.trim(),
        reminders: form.reminders,
        recurrenceRule: form.recurrenceRule,
        recurrenceInterval: Number(form.recurrenceInterval),
        recurrenceUnit: form.recurrenceUnit,
        recurrenceUntil: form.recurrenceUntil
      });
      if (result) onClose();
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!editable || saving) return;
    if (!window.confirm(t('editor.deleteConfirm', { title: event.title }))) {
      return;
    }
    setSaving(true);
    try {
      const result = await onDelete(event);
      if (result !== null) onClose();
    } finally {
      setSaving(false);
    }
  };

  const duplicate = async () => {
    if (!editable || event.sharedEventId || saving || !onDuplicate) return;
    setSaving(true);
    try {
      await onDuplicate(event, {
        title: form.title.trim(),
        date: form.date,
        time: form.allDay ? '' : form.time,
        allDay: form.allDay,
        endDate:
          form.allDay && form.endDate
            ? addLocalDays(form.endDate, 1)
            : form.endDate,
        endTime: form.allDay ? '' : form.endTime,
        memberIds: form.memberIds,
        memberId: form.memberIds[0] || 'all',
        location: form.location.trim(),
        notes: form.notes.trim(),
        reminders: form.reminders,
        recurrenceRule: form.recurrenceRule,
        recurrenceInterval: Number(form.recurrenceInterval),
        recurrenceUnit: form.recurrenceUnit,
        recurrenceUntil: form.recurrenceUntil
      });
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="calendar-editor-layer"
      onPointerDown={() => !saving && onClose()}
    >
      <form
        className="calendar-editor-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="calendar-event-dialog-title"
        onSubmit={submit}
        onPointerDown={pointerEvent => pointerEvent.stopPropagation()}
      >
        <header>
          <span className="calendar-editor-mark">
            {editable
              ? <CalendarClock size={25} />
              : isBirthday
                ? <CakeSlice size={24} />
                : <LockKeyhole size={23} />}
          </span>
          <div>
            <span>
              {editable
                ? t('editor.kicker')
                : isBirthday
                  ? t('editor.birthdayKicker')
                  : t('editor.readOnlyKicker')}
            </span>
            <h2 id="calendar-event-dialog-title">
              {editable ? t('editor.title') : displayEvent.title}
            </h2>
            <p>
              {editable
                ? t('editor.description')
                : isBirthday
                  ? t('editor.birthdayDescription')
                  : t('editor.readOnlyDescription')}
            </p>
          </div>
          <button
            type="button"
            aria-label={t('common:actions.close')}
            disabled={saving}
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </header>

        <div className="calendar-editor-body">
          <label className="calendar-editor-field is-wide">
            <span>{t('editor.fields.title')}</span>
            <input
              value={form.title}
              onChange={change => patch({ title: change.target.value })}
              disabled={!editable}
              required
              autoFocus={editable && shouldAutofocusTitle}
            />
          </label>

          <label className="calendar-editor-all-day is-wide">
            <input
              type="checkbox"
              checked={form.allDay}
              disabled={!editable}
              onChange={change => patch({
                allDay: change.target.checked,
                endTime: change.target.checked ? '' : form.endTime
              })}
            />
            <span>
              <strong>{t('editor.fields.allDay')}</strong>
              <small>{t('editor.fields.allDayHint')}</small>
            </span>
          </label>

          <label className="calendar-editor-field">
            <span>{t('editor.fields.startDate')}</span>
            <input
              type="date"
              value={form.date}
              disabled={!editable}
              onChange={change => patch({ date: change.target.value })}
              required
            />
          </label>
          {!form.allDay && (
            <label className="calendar-editor-field">
              <span>{t('editor.fields.startTime')}</span>
              <input
                type="time"
                value={form.time}
                disabled={!editable}
                onChange={change => patch({ time: change.target.value })}
                required
              />
            </label>
          )}
          <label className="calendar-editor-field">
            <span>
              {form.allDay
                ? t('editor.fields.endDateInclusive')
                : t('editor.fields.endDate')}
            </span>
            <input
              type="date"
              min={form.date}
              value={form.endDate}
              disabled={!editable}
              onChange={change => patch({ endDate: change.target.value })}
            />
          </label>
          {!form.allDay && (
            <label className="calendar-editor-field">
              <span>{t('editor.fields.endTime')}</span>
              <input
                type="time"
                value={form.endTime}
                disabled={!editable}
                onChange={change => patch({ endTime: change.target.value })}
              />
            </label>
          )}

          <section className="calendar-editor-recurrence is-wide">
            <div className="calendar-editor-recurrence-heading">
              <span><Repeat2 size={15} /> {t('editor.recurrence.title')}</span>
              <small>{t('editor.recurrence.hint')}</small>
            </div>
            <div className="calendar-editor-recurrence-fields">
              <label className="calendar-editor-field">
                <span>{t('editor.recurrence.frequency')}</span>
                <select
                  value={form.recurrenceRule}
                  disabled={!editable}
                  onChange={change => patch({
                    recurrenceRule: change.target.value
                  })}
                >
                  {['none', 'daily', 'weekly', 'monthly', 'yearly', 'custom']
                    .map(rule => (
                      <option key={rule} value={rule}>
                        {t(`editor.recurrence.rules.${rule}`)}
                      </option>
                    ))}
                </select>
              </label>
              {form.recurrenceRule === 'custom' && (
                <>
                  <label className="calendar-editor-field">
                    <span>{t('editor.recurrence.every')}</span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={form.recurrenceInterval}
                      disabled={!editable}
                      onChange={change => patch({
                        recurrenceInterval: change.target.value
                      })}
                    />
                  </label>
                  <label className="calendar-editor-field">
                    <span>{t('editor.recurrence.unit')}</span>
                    <select
                      value={form.recurrenceUnit}
                      disabled={!editable}
                      onChange={change => patch({
                        recurrenceUnit: change.target.value
                      })}
                    >
                      {['days', 'weeks', 'months'].map(unit => (
                        <option key={unit} value={unit}>
                          {t(`editor.recurrence.units.${unit}`)}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {form.recurrenceRule !== 'none' && (
                <label className="calendar-editor-field">
                  <span>{t('editor.recurrence.until')}</span>
                  <input
                    type="date"
                    min={form.date}
                    value={form.recurrenceUntil}
                    disabled={!editable}
                    onChange={change => patch({
                      recurrenceUntil: change.target.value
                    })}
                  />
                </label>
              )}
            </div>
            {event.seriesId && (
              <p className="calendar-editor-recurrence-series-note">
                {t('editor.recurrence.seriesNote')}
              </p>
            )}
          </section>

          <div className="is-wide">
            <EventAudiencePicker
              members={members}
              value={form.memberIds}
              onChange={memberIds => patch({ memberIds })}
              disabled={!editable}
            />
          </div>

          <label className="calendar-editor-field is-wide">
            <span><MapPin size={14} /> {t('editor.fields.location')}</span>
            <input
              value={form.location}
              disabled={!editable}
              onChange={change => patch({ location: change.target.value })}
              placeholder={t('editor.fields.locationPlaceholder')}
            />
          </label>

          <label className="calendar-editor-field is-wide">
            <span>{t('editor.fields.notes')}</span>
            <textarea
              rows="4"
              value={form.notes}
              disabled={!editable}
              onChange={change => patch({ notes: change.target.value })}
            />
          </label>

          <div className="is-wide">
            <EventReminderPicker
              value={form.reminders}
              onChange={reminders => patch({ reminders })}
              disabled={!editable}
            />
          </div>
        </div>

        <footer>
          {editable && (
            <button
              type="button"
              className="calendar-editor-delete"
              disabled={saving}
              onClick={remove}
            >
              <Trash2 size={16} /> {t('editor.delete')}
            </button>
          )}
          {editable && !event.sharedEventId && onDuplicate && (
            <button
              type="button"
              className="calendar-editor-duplicate"
              disabled={saving}
              onClick={duplicate}
            >
              <CopyPlus size={16} /> {t('editor.duplicate')}
            </button>
          )}
          <span />
          <button
            type="button"
            className="calendar-editor-cancel"
            disabled={saving}
            onClick={onClose}
          >
            {editable
              ? t('common:actions.cancel')
              : t('common:actions.close')}
          </button>
          {editable && (
            <button
              type="submit"
              className="calendar-editor-save"
              disabled={saving || endDateInvalid}
            >
              <Check size={16} />
              {saving
                ? t('common:status.saving')
                : t('editor.save')}
            </button>
          )}
        </footer>
      </form>
    </div>,
    document.body
  );
}
