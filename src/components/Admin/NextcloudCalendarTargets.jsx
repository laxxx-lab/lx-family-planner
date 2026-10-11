import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { formatDateTime } from '../../utils/formatting';

export default function NextcloudCalendarTargets() {
  const { t } = useTranslation('admin');
  const {
    members,
    nextcloudCalendarTargets,
    refreshNextcloudCalendarTargets,
    createNextcloudCalendarTarget,
    discoverNextcloudCalendars,
    deleteNextcloudCalendarTarget,
    manageNextcloudCalendarTarget
  } = useFamily();
  const [form, setForm] = useState({
    memberId: '', name: '', baseUrl: '', username: '', appPassword: '', calendarHref: ''
  });
  const [busy, setBusy] = useState(false);
  const [calendars, setCalendars] = useState([]);
  const assigned = new Set(nextcloudCalendarTargets.targets.map(target => target.memberId));

  useEffect(() => { void refreshNextcloudCalendarTargets(); }, [refreshNextcloudCalendarTargets]);

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    const result = await createNextcloudCalendarTarget(form);
    setBusy(false);
    if (result) setForm({ memberId: '', name: '', baseUrl: '', username: '', appPassword: '', calendarHref: '' });
  };

  const discover = async () => {
    setBusy(true);
    const found = await discoverNextcloudCalendars(form);
    setBusy(false);
    if (found) {
      setCalendars(found);
      setForm(previous => ({ ...previous, calendarHref: found[0]?.href || '' }));
    }
  };

  const manage = async (target, action, changes) => {
    setBusy(true);
    try { await manageNextcloudCalendarTarget(target.id, action, changes); }
    finally { setBusy(false); }
  };

  return (
    <section className="nextcloud-calendar-targets">
      <h3>{t('calendarTargets.title')}</h3>
      <p>{t('calendarTargets.intro')}</p>
      <p><strong>{t('calendarTargets.shared')}:</strong> {nextcloudCalendarTargets.shared?.enabled ? t('calendarTargets.active') : t('calendarTargets.notConfigured')}</p>
      {nextcloudCalendarTargets.targets.map(target => (
        <article key={target.id}>
          <strong>{members.find(member => member.id === target.memberId)?.name || target.name}</strong>
          <span> · {target.name || t('calendarTargets.title')}</span>
          <p>{t('calendarTargets.lastSync')}: {target.lastSuccessAt ? formatDateTime(new Date(target.lastSuccessAt)) : '—'}</p>
          {target.lastError && <p>{target.lastError}</p>}
          <button type="button" disabled={busy} onClick={() => manage(target, 'test')}>{t('calendarTargets.check')}</button>
          <button type="button" disabled={busy} onClick={() => manage(target, 'sync')}>{t('calendarTargets.sync')}</button>
          <button type="button" disabled={busy} onClick={() => manage(target, 'update', { enabled: !target.enabled })}>{t(target.enabled ? 'calendarTargets.pause' : 'calendarTargets.resume')}</button>
          <button type="button" disabled={busy} onClick={async () => {
            if (!window.confirm(t('calendarTargets.removeConfirm'))) return;
            setBusy(true);
            try { await deleteNextcloudCalendarTarget(target.id); }
            finally { setBusy(false); }
          }}>{t('common:actions.delete')}</button>
        </article>
      ))}
      <form onSubmit={submit}>
        <label>{t('calendarTargets.member')}
          <select required value={form.memberId} onChange={event => setForm({ ...form, memberId: event.target.value })}>
            <option value="">—</option>
            {members.filter(member => !assigned.has(member.id)).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <label>{t('calendarTargets.name')} <input value={form.name} maxLength={200} onChange={event => setForm({ ...form, name: event.target.value })} /></label>
        <label>{t('calendarTargets.address')} <input required type="url" value={form.baseUrl} onChange={event => { setCalendars([]); setForm({ ...form, baseUrl: event.target.value, calendarHref: '' }); }} /></label>
        <label>{t('calendarTargets.username')} <input required value={form.username} onChange={event => { setCalendars([]); setForm({ ...form, username: event.target.value, calendarHref: '' }); }} /></label>
        <label>{t('calendarTargets.password')} <input required type="password" autoComplete="new-password" value={form.appPassword} onChange={event => { setCalendars([]); setForm({ ...form, appPassword: event.target.value, calendarHref: '' }); }} /></label>
        <button type="button" onClick={discover} disabled={busy || !form.baseUrl || !form.username || !form.appPassword}>{t('calendarTargets.load')}</button>
        <label>{t('calendarTargets.calendar')}
          <select required value={form.calendarHref} onChange={event => setForm({ ...form, calendarHref: event.target.value })} disabled={!calendars.length}>
            <option value="">{t('calendarTargets.load')}</option>
            {calendars.map(calendar => <option key={calendar.href} value={calendar.href}>{calendar.name || calendar.href}</option>)}
          </select>
        </label>
        <button disabled={busy || !calendars.length}>{t('common:actions.save')}</button>
      </form>
    </section>
  );
}
