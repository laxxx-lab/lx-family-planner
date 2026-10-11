import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { normalizeSchoolTimetable } from '../../../shared/schoolTimetable.js';

export default function SchoolTimetableTemplate({ template, onSave }) {
  const { t } = useTranslation('familyLife');
  const [periods, setPeriods] = useState([]);
  const [subjects, setSubjects] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const count = Math.max(8, ...((template?.periods || []).map(entry => entry.period)));
    setPeriods(Array.from({ length: count }, (_, index) =>
      template?.periods?.find(entry => entry.period === index + 1) ||
      { period: index + 1, label: '', time: '', endTime: '' }
    ));
    setSubjects(template?.subjects?.length ? template.subjects.join(', ') : t('school.template.defaultSubjects'));
  }, [template, t]);
  const changePeriod = (index, key, value) => {
    setError('');
    setPeriods(previous => previous.map((entry, entryIndex) => entryIndex === index ? { ...entry, [key]: value } : entry));
  };
  return <details className="family-life-creator school-template-editor">
    <summary>{t('school.template.title')}</summary>
    <form className="family-life-form" onSubmit={async event => {
      event.preventDefault();
      setError('');
      let normalized;
      try { normalized = normalizeSchoolTimetable({ periods, subjects: subjects.split(',') }); }
      catch { setError(t('school.template.invalidTimes')); return; }
      setSaving(true);
      try { await onSave(normalized); } finally { setSaving(false); }
    }}>
      <p>{t('school.template.hint')}</p>
      {periods.map((entry, index) => <div className="form-row" key={entry.period}>
        <label><span>{entry.period}. {t('school.form.period')}</span>
          <input aria-label={`${entry.period}. ${t('school.template.label')}`} value={entry.label} maxLength={60}
            onChange={event => changePeriod(index, 'label', event.target.value)} />
        </label>
        <label><span>{t('school.form.startsAt')}</span>
          <input type="time" aria-label={`${entry.period}. ${t('school.form.startsAt')}`} value={entry.time}
            onChange={event => changePeriod(index, 'time', event.target.value)} />
        </label>
        <label><span>{t('school.form.endsAt')}</span>
          <input type="time" aria-label={`${entry.period}. ${t('school.form.endsAt')}`} value={entry.endTime}
            onChange={event => changePeriod(index, 'endTime', event.target.value)} />
        </label>
      </div>)}
      {periods.length < 20 && <button type="button" className="btn-secondary" onClick={() =>
        setPeriods(previous => [...previous, { period: previous.length + 1, label: '', time: '', endTime: '' }])
      }>{t('school.template.addPeriod')}</button>}
      <label><span>{t('school.template.subjects')}</span>
        <input value={subjects} maxLength={4000} onChange={event => setSubjects(event.target.value)} />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="family-life-primary" disabled={saving}>{t('common:actions.save')}</button>
    </form>
  </details>;
}
