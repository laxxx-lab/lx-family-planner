import React, { useEffect, useState } from 'react';
import { useFamily } from '../../context/FamilyContext';

export default function NextcloudCalendarTargets() {
  const {
    members,
    nextcloudCalendarTargets,
    refreshNextcloudCalendarTargets,
    createNextcloudCalendarTarget,
    discoverNextcloudCalendars,
    deleteNextcloudCalendarTarget
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

  return (
    <section className="nextcloud-calendar-targets">
      <h3>Persönliche Kalender</h3>
      <p>Ein einzelnes Familienmitglied wird in seinen Kalender geschrieben. Gemeinsame Termine bleiben im Familienkalender.</p>
      <p><strong>Familienkalender:</strong> {nextcloudCalendarTargets.shared?.enabled ? 'aktiv' : 'nicht eingerichtet'}</p>
      {nextcloudCalendarTargets.targets.map(target => (
        <article key={target.id}>
          <strong>{members.find(member => member.id === target.memberId)?.name || target.name}</strong>
          <span> · {target.name || 'Persönlicher Kalender'}</span>
          {target.lastError && <p>{target.lastError}</p>}
          <button type="button" onClick={() => deleteNextcloudCalendarTarget(target.id)}>Entfernen</button>
        </article>
      ))}
      <form onSubmit={submit}>
        <label>Familienmitglied
          <select required value={form.memberId} onChange={event => setForm({ ...form, memberId: event.target.value })}>
            <option value="">Auswählen</option>
            {members.filter(member => !assigned.has(member.id)).map(member => <option key={member.id} value={member.id}>{member.name}</option>)}
          </select>
        </label>
        <label>Name <input value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} placeholder="z. B. Annas Kalender" /></label>
        <label>Nextcloud-Adresse <input required type="url" value={form.baseUrl} onChange={event => setForm({ ...form, baseUrl: event.target.value })} /></label>
        <label>Benutzername <input required value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
        <label>App-Passwort <input required type="password" value={form.appPassword} onChange={event => setForm({ ...form, appPassword: event.target.value })} /></label>
        <button type="button" onClick={discover} disabled={busy || !form.baseUrl || !form.username || !form.appPassword}>Kalender laden</button>
        <label>Kalender
          <select required value={form.calendarHref} onChange={event => setForm({ ...form, calendarHref: event.target.value })} disabled={!calendars.length}>
            <option value="">Kalender zuerst laden</option>
            {calendars.map(calendar => <option key={calendar.href} value={calendar.href}>{calendar.name || calendar.href}</option>)}
          </select>
        </label>
        <button disabled={busy}>{busy ? 'Wird gespeichert …' : 'Persönlichen Kalender speichern'}</button>
      </form>
    </section>
  );
}
