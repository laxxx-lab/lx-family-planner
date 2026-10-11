import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import {
  Edit3,
  Pin,
  Plus,
  RotateCw,
  Trash2,
  Upload,
  X,
  ZoomIn
} from 'lucide-react';
import { compressImageDataUrl } from '../../utils/imageCompressor';
import i18n from '../../i18n/index.js';
import { canManageFamily } from '../../constants/roles';

const NOTE_COLORS = [
  '#fef08a', // Yellow
  '#bbf7d0', // Mint Green
  '#bfdbfe', // Soft Blue
  '#fbcfe8', // Soft Pink
  '#fed7aa'  // Soft Orange
];

const MAX_SOURCE_PHOTO_BYTES = 20 * 1024 * 1024;
const MAX_STORED_PHOTO_LENGTH = 1_500_000;

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = event => resolve(event.target.result);
    reader.onerror = () => reject(
      new Error(i18n.t('board:photo.readError'))
    );
    reader.readAsDataURL(file);
  });
}

export default function FamilyPinboard() {
  const { t } = useTranslation('board');
  const {
    notes,
    addNote,
    updateNote,
    deleteNote,
    activeHousehold,
    activeMember,
    showToast
  } = useFamily();
  const isAdult = canManageFamily(activeMember);

  // Track flipped note cards { [noteId]: boolean }
  const [flippedCards, setFlippedCards] = useState({});

  const [editingNote, setEditingNote] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editColor, setEditColor] = useState('#fef08a');
  const [editIsShared, setEditIsShared] = useState(false);
  const [editPhoto, setEditPhoto] = useState(null);
  const [editVisibility, setEditVisibility] = useState('family');
  const [editIcon, setEditIcon] = useState('');

  // New Note Modal State
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newColor, setNewColor] = useState('#fef08a');
  const [newIsShared, setNewIsShared] = useState(false);
  const [newPhoto, setNewPhoto] = useState(null);
  const [newVisibility, setNewVisibility] = useState('family');
  const [newIcon, setNewIcon] = useState('');
  const [photoBusy, setPhotoBusy] = useState('');
  const [saving, setSaving] = useState('');
  const [lightboxPhoto, setLightboxPhoto] = useState(null);

  useEffect(() => {
    if (!lightboxPhoto) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') setLightboxPhoto(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [lightboxPhoto]);

  const toggleFlip = (noteId, e) => {
    e?.stopPropagation();
    setFlippedCards(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  const handlePhotoUpload = async (event, setPhotoFn, target) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    if (!file) return;

    input.value = '';
    if (!file.type.startsWith('image/')) {
      showToast(
        t('toasts.notImage.title'),
        t('toasts.notImage.body'),
        'warning'
      );
      return;
    }
    if (file.size > MAX_SOURCE_PHOTO_BYTES) {
      showToast(
        t('toasts.tooLarge.title'),
        t('toasts.tooLarge.body'),
        'warning'
      );
      return;
    }

    setPhotoBusy(target);
    try {
      const original = await readFileAsDataUrl(file);
      let optimized = await compressImageDataUrl(
        original,
        1400,
        1400,
        0.78
      );
      if (optimized.length > MAX_STORED_PHOTO_LENGTH) {
        optimized = await compressImageDataUrl(
          original,
          1000,
          1000,
          0.65
        );
      }
      if (optimized.length > MAX_STORED_PHOTO_LENGTH) {
        throw new Error(
          t('toasts.stillTooLarge')
        );
      }
      setPhotoFn(optimized);
      showToast(
        t('toasts.ready.title'),
        t('toasts.ready.body'),
        'success'
      );
    } catch (error) {
      showToast(t('toasts.loadFailed'), error.message, 'error');
    } finally {
      setPhotoBusy('');
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || photoBusy) return;

    setSaving('new');
    const created = await addNote({
      title: newTitle,
      content: newContent,
      color: newColor,
      isShared: newIsShared,
      photo: newPhoto,
      visibility: isAdult ? newVisibility : 'family',
      icon: newIcon
    });
    setSaving('');
    if (!created) return;

    setNewTitle('');
    setNewContent('');
    setNewPhoto(null);
    setNewVisibility('family');
    setNewIcon('');
    setIsAddNoteOpen(false);
  };

  const handleStartEdit = (note, e) => {
    e?.stopPropagation();
    setEditingNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditColor(note.color || '#fef08a');
    setEditIsShared(note.isShared || false);
    setEditPhoto(note.photo || null);
    setEditVisibility(note.visibility || 'family');
    setEditIcon(note.icon || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingNote || !editTitle.trim() || photoBusy) return;

    setSaving('edit');
    const updated = await updateNote(editingNote.id, {
      title: editTitle,
      content: editContent,
      color: editColor,
      isShared: editIsShared,
      photo: editPhoto,
      ...(isAdult ? { visibility: editVisibility } : {}),
      icon: editIcon
    });
    setSaving('');
    if (!updated) return;

    setEditingNote(null);
  };

  // Filter notes by household or shared
  const visibleNotes = notes.filter(n => {
    if (n.isShared) return true;
    const nHousehold = n.household || 'familie';
    return nHousehold === activeHousehold;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card" style={{ padding: 20 }}>
        <div className="card-header" style={{ marginBottom: 12 }}>
          <h2 className="card-title" style={{ color: 'var(--primary)' }}>
            <Pin size={24} /> {t('header.title')} ({activeHousehold === 'familie' ? t('header.householdFamily') : t('header.householdGrandparents')})
          </h2>
          <button className="btn-primary" onClick={() => setIsAddNoteOpen(true)}>
            <Plus size={18} /> {t('header.addNote')}
          </button>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {t('header.intro')}
        </p>
      </div>

      {/* Grid of Notes (supporting 3D Polaroid Flip) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
        {visibleNotes.map(note => {
          const isFlipped = !!flippedCards[note.id];
          const hasPhoto = !!note.photo;

          return (
            <div
              key={note.id}
              style={{
                perspective: 1000,
                minHeight: 260,
                position: 'relative'
              }}
            >
              {/* Pin graphic */}
              <div style={{
                position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 24, borderRadius: '50%', background: note.isShared ? '#2563eb' : '#ef4444',
                boxShadow: '0 3px 6px rgba(0,0,0,0.2)', zIndex: 10
              }} />

              {/* 3D Card Inner Container */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'relative',
                  transformStyle: 'preserve-3d',
                  transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.08)'
                }}
              >
                {/* FRONT SIDE */}
                <div style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  background: note.color || '#fef08a',
                  borderRadius: 'var(--radius-lg)',
                  padding: 20,
                  color: '#1e2923',
                  display: 'flex',
                  flexDirection: 'column',
                  justify: 'space-between',
                  minHeight: 260,
                  border: '1px solid rgba(0,0,0,0.08)'
                }}>
                  <div>
                    {note.visibility === 'adults' && <span className="badge">🔒 {t('form.adultsOnly')}</span>}
                    {note.icon && <span aria-hidden="true" style={{ fontSize: '2rem' }}>{note.icon}</span>}
                    {note.isShared && (
                      <span className="badge" style={{ background: '#2563eb', color: 'white', marginBottom: 8, fontSize: '0.75rem' }}>
                        {t('note.shared')}
                      </span>
                    )}

                    {/* Polaroid Photo if present */}
                    {hasPhoto ? (
                      <div style={{ background: 'white', padding: '10px 10px 14px 10px', borderRadius: 'var(--radius-sm)', marginBottom: 12, boxShadow: 'var(--shadow-sm)', textAlign: 'center' }}>
                        <button
                          type="button"
                          className="pinboard-photo-preview"
                          onClick={event => {
                            event.stopPropagation();
                            setLightboxPhoto({
                              src: note.photo,
                              title: note.title
                            });
                          }}
                          aria-label={t('lightbox.openAria', { title: note.title })}
                        >
                          <img src={note.photo} alt={note.title} />
                          <span><ZoomIn size={15} /> {t('note.viewLarge')}</span>
                        </button>
                        <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: 8 }}>{note.title}</div>
                        <button
                          type="button"
                          className="pinboard-flip-hint"
                          onClick={event => toggleFlip(note.id, event)}
                        >
                          <RotateCw size={12} /> {t('note.readNote')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>
                          {note.title}
                        </h3>
                        <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, opacity: 0.9, marginBottom: 14 }}>
                          {note.content}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Note Footer Metadata & Actions */}
                  <div style={{ borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 8, marginTop: 8 }}>
                    <div style={{ fontSize: '0.78rem', opacity: 0.8, display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span>✍️ <strong>{t('note.createdByLabel')}</strong> {note.createdBy || t('note.fallbackAuthor')} ({note.createdAt || t('note.today')})</span>
                      {note.updatedBy && <span>✏️ <strong>{t('note.editedLabel')}</strong> {note.updatedBy}</span>}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                      {hasPhoto && (
                        <button
                          className="icon-circle-btn pinboard-note-action rotate"
                          style={{ width: 32, height: 32 }}
                          onClick={(e) => toggleFlip(note.id, e)}
                          title={t('note.flipTitle')}
                        >
                          <RotateCw size={14} />
                        </button>
                      )}

                      <button
                        className="icon-circle-btn pinboard-note-action"
                        style={{ width: 32, height: 32 }}
                        onClick={(e) => handleStartEdit(note, e)}
                        title={t('note.editTitle')}
                      >
                        <Edit3 size={14} />
                      </button>

                      <button
                        className="icon-circle-btn pinboard-note-action danger"
                        style={{ width: 32, height: 32 }}
                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                        title={t('note.deleteTitle')}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* BACK SIDE (Text content of Polaroid) */}
                {hasPhoto && (
                  <div style={{
                    backfaceVisibility: 'hidden',
                    WebkitBackfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    position: 'absolute',
                    inset: 0,
                    background: note.color || '#fef08a',
                    borderRadius: 'var(--radius-lg)',
                    padding: 20,
                    color: '#1e2923',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    border: '1px solid rgba(0,0,0,0.08)'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>
                        {t('note.backSideLabel')}
                      </div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 8 }}>{note.title}</h3>
                      <div style={{ fontSize: '0.95rem', whiteSpace: 'pre-wrap', lineHeight: 1.5, opacity: 0.9 }}>
                        {note.content}
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.1)', paddingTop: 8 }}>
                      <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>✍️ {note.createdBy}</span>
                      <button
                        className="btn-secondary pinboard-card-back-button"
                        style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                        onClick={(e) => toggleFlip(note.id, e)}
                      >
                        <RotateCw size={12} /> {t('note.showPhoto')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* CREATE NEW NOTE MODAL */}
      {isAddNoteOpen && (
        <div className="modal-backdrop" onClick={() => setIsAddNoteOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h2 className="card-title">{t('addModal.title')}</h2>
              <button className="icon-circle-btn" onClick={() => setIsAddNoteOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <label className="form-group">
                <span className="form-label">{t('form.iconLabel')}</span>
                <input className="form-input" value={newIcon} maxLength={24} placeholder="📌"
                  onChange={event => setNewIcon(event.target.value)} />
              </label>
              {isAdult && <label className="form-group">
                <span className="form-label">{t('form.visibility')}</span>
                <select className="form-select" value={newVisibility} onChange={event => setNewVisibility(event.target.value)}>
                  <option value="family">{t('form.family')}</option>
                  <option value="adults">{t('form.adultsOnly')}</option>
                </select>
              </label>}
              <div className="form-group">
                <label className="form-label">{t('common:labels.title')}</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder={t('addModal.titlePlaceholder')}
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('addModal.contentLabel')}</label>
                <textarea
                  className="form-textarea"
                  rows="3"
                  placeholder={t('addModal.contentPlaceholder')}
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  required
                />
              </div>

              {/* Photo Upload for Note */}
              <div className="form-group">
                <label className="form-label">{t('addModal.photoLabel')}</label>
                
                {newPhoto ? (
                  <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 10 }}>
                    <img src={newPhoto} alt={t('photo.previewAlt')} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }} />
                    <button
                      type="button"
                      className="icon-circle-btn"
                      style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', width: 24, height: 24 }}
                      onClick={() => setNewPhoto(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="btn-secondary"
                    style={{
                      cursor: photoBusy ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      gap: 6
                    }}
                  >
                    <Upload size={16} />
                    {photoBusy === 'new'
                      ? t('photo.optimizing')
                      : t('photo.choose')}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={Boolean(photoBusy)}
                      onChange={(e) => handlePhotoUpload(
                        e,
                        setNewPhoto,
                        'new'
                      )}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                <small className="form-help">
                  {t('addModal.autoResizeHint')}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">{t('addModal.colorLabel')}</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {NOTE_COLORS.map(col => (
                    <div
                      key={col}
                      onClick={() => setNewColor(col)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: col, cursor: 'pointer',
                        border: `3px solid ${newColor === col ? '#1e2923' : 'transparent'}`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newIsShared}
                    onChange={e => setNewIsShared(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>{t('form.shared')}</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={Boolean(saving || photoBusy)}
                >
                  {saving === 'new'
                    ? t('addModal.pinning')
                    : t('addModal.submit')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setIsAddNoteOpen(false)}>
                  {t('common:actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT NOTE MODAL */}
      {editingNote && (
        <div className="modal-backdrop" onClick={() => setEditingNote(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <h2 className="card-title">{t('editModal.title')}</h2>
              <button className="icon-circle-btn" onClick={() => setEditingNote(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <label className="form-group">
                <span className="form-label">{t('form.iconLabel')}</span>
                <input className="form-input" value={editIcon} maxLength={24} placeholder="📌"
                  onChange={event => setEditIcon(event.target.value)} />
              </label>
              {isAdult && <label className="form-group">
                <span className="form-label">{t('form.visibility')}</span>
                <select className="form-select" value={editVisibility} onChange={event => setEditVisibility(event.target.value)}>
                  <option value="family">{t('form.family')}</option>
                  <option value="adults">{t('form.adultsOnly')}</option>
                </select>
              </label>}
              <div className="form-group">
                <label className="form-label">{t('common:labels.title')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('editModal.contentLabel')}</label>
                <textarea
                  className="form-textarea"
                  rows="4"
                  value={editContent}
                  onChange={e => setEditContent(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('editModal.photoLabel')}</label>
                {editPhoto ? (
                  <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 10 }}>
                    <img src={editPhoto} alt={t('photo.previewAlt')} style={{ width: '100%', height: '100%', objectFit: 'contain', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }} />
                    <button
                      type="button"
                      className="icon-circle-btn"
                      style={{ position: 'absolute', top: -6, right: -6, background: '#ef4444', color: 'white', width: 24, height: 24 }}
                      onClick={() => setEditPhoto(null)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <label
                    className="btn-secondary"
                    style={{
                      cursor: photoBusy ? 'wait' : 'pointer',
                      display: 'inline-flex',
                      gap: 6
                    }}
                  >
                    <Upload size={16} />
                    {photoBusy === 'edit'
                      ? t('photo.optimizing')
                      : t('photo.upload')}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={Boolean(photoBusy)}
                      onChange={(e) => handlePhotoUpload(
                        e,
                        setEditPhoto,
                        'edit'
                      )}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
                <small className="form-help">
                  {t('editModal.optimizeHint')}
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">{t('editModal.colorLabel')}</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {NOTE_COLORS.map(col => (
                    <div
                      key={col}
                      onClick={() => setEditColor(col)}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: col, cursor: 'pointer',
                        border: `3px solid ${editColor === col ? '#1e2923' : 'transparent'}`
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editIsShared}
                    onChange={e => setEditIsShared(e.target.checked)}
                    style={{ width: 18, height: 18 }}
                  />
                  <span>{t('form.shared')}</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ flex: 1 }}
                  disabled={Boolean(saving || photoBusy)}
                >
                  {saving === 'edit'
                    ? t('common:status.saving')
                    : t('editModal.submit')}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setEditingNote(null)}>
                  {t('common:actions.cancel')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {lightboxPhoto && (
        <div
          className="pinboard-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={t('lightbox.dialogAria', { title: lightboxPhoto.title })}
          onClick={() => setLightboxPhoto(null)}
        >
          <div
            className="pinboard-lightbox-content"
            onClick={event => event.stopPropagation()}
          >
            <button
              type="button"
              className="pinboard-lightbox-close"
              onClick={() => setLightboxPhoto(null)}
              aria-label={t('lightbox.closeAria')}
            >
              <X size={21} />
            </button>
            <img src={lightboxPhoto.src} alt={lightboxPhoto.title} />
            <strong>{lightboxPhoto.title}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
