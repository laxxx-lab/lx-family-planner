import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, X } from 'lucide-react';
import { previewCalendarImport, newCalendarImportId } from '../../../shared/icsImport.js';
import { useViewportScrollLock } from '../../hooks/useViewportScrollLock';

export default function CalendarImportDialog({ initialFile, groups, onImport, onRemove, onClose }) {
  const { t } = useTranslation('calendar');
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const reading = useRef(0);
  useViewportScrollLock(true);

  const readFile = async file => {
    const request = ++reading.current;
    setPreview(null);
    setError('');
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error('size');
      const content = await file.text();
      const parsed = previewCalendarImport(content);
      if (!parsed.records.length) throw new Error('empty');
      if (request === reading.current) setPreview({
        ...parsed, content, fileName: file.name, batchId: newCalendarImportId()
      });
    } catch {
      if (request === reading.current) setError(t('fileImport.invalid'));
    } finally {
      if (request === reading.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (initialFile) readFile(initialFile);
    return () => { reading.current += 1; };
  }, [initialFile]);

  useEffect(() => {
    const escape = event => { if (event.key === 'Escape' && !busy) onClose(); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [busy, onClose]);

  const run = async action => {
    setBusy(true);
    setError('');
    try {
      if (!await action()) setError(t('fileImport.failed'));
    } catch { setError(t('fileImport.failed')); }
    finally { setBusy(false); }
  };

  return createPortal(
    <div className="calendar-editor-layer" onPointerDown={() => !busy && onClose()}>
      <section className="calendar-editor-dialog calendar-import-dialog" role="dialog"
        aria-modal="true" aria-labelledby="calendar-import-title"
        onPointerDown={event => event.stopPropagation()}>
        <header>
          <div><h2 id="calendar-import-title">{t('fileImport.title')}</h2><p>{t('fileImport.description')}</p></div>
          <button type="button" onClick={onClose} disabled={busy} aria-label={t('common:actions.close')}><X size={19} /></button>
        </header>
        <div className="calendar-editor-body calendar-import-body">
          <button type="button" className="calendar-editor-save" disabled={busy} onClick={() => inputRef.current?.click()}>
            <Upload size={16} /> {t('view.tools.import')}
          </button>
          <input ref={inputRef} type="file" hidden accept=".ics,text/calendar" disabled={busy}
            onChange={event => { readFile(event.target.files?.[0]); event.target.value = ''; }} />
          {error && <p role="alert">{error}</p>}
          {busy && <p role="status">{t('common:status.loading')}</p>}
          {preview && <section aria-label={t('fileImport.preview')}>
            <h3>{preview.fileName}</h3>
            <p>{t('fileImport.count', { count: preview.records.length })}</p>
            <p>{t('fileImport.series')}</p>
            {preview.warnings.map(warning => <p className="calendar-import-warning" key={warning}>
              {t(`fileImport.warnings.${warning}`)}
            </p>)}
            <ul>{preview.records.slice(0, 10).map((event, index) => <li key={index}>
              {event.title} · {event.date} {event.time} · {event.category}
            </li>)}</ul>
            {preview.records.length > 10 && <p>{t('fileImport.more', { count: preview.records.length - 10 })}</p>}
          </section>}
          <section>
            <h3>{t('fileImport.groups')}</h3>
            <p>{t('fileImport.legacy')}</p>
            {groups.map(group => <div className="calendar-import-group" key={group.id}>
              <span>{group.name}<small>{t('fileImport.count', { count: group.count })}</small></span>
              <button type="button" className="calendar-editor-delete" disabled={busy}
                aria-label={t('fileImport.remove', { name: group.name })}
                onClick={() => {
                  if (window.confirm(t('fileImport.removeConfirm', { name: group.name, count: group.count }))) {
                    run(() => onRemove(group.id));
                  }
                }}><Trash2 size={16} /> {t('fileImport.removeButton')}</button>
            </div>)}
          </section>
        </div>
        <footer>
          <button type="button" className="calendar-editor-cancel" disabled={busy} onClick={onClose}>{t('common:actions.close')}</button>
          <button type="button" className="calendar-editor-save" disabled={busy || !preview}
            onClick={() => run(async () => {
              const result = await onImport({ content: preview.content, fileName: preview.fileName, batchId: preview.batchId });
              if (result) onClose();
              return result;
            })}>{t('fileImport.confirm')}</button>
        </footer>
      </section>
    </div>, document.body
  );
}
