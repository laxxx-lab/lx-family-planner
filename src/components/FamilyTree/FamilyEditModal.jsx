import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowUpRight,
  Check,
  CircleHelp,
  Github,
  Home,
  LockKeyhole,
  ShieldAlert,
  Star,
  Trash2,
  Upload,
  X
} from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { compressImageDataUrl } from '../../utils/imageCompressor';
import { DEFAULT_FAMILY_AVATAR } from '../../utils/imageFallback';
import { GITHUB_REPOSITORY_URL } from '../../constants/project';
import ProjectSupportCard from '../ProjectSupportCard';
import { PRODUCT_NAME } from '../../../shared/brand.js';
import { useViewportScrollLock } from '../../hooks/useViewportScrollLock';
import { useVisualViewportDialog } from '../../hooks/useVisualViewportDialog';

export default function FamilyEditModal({ family, isOpen, onClose }) {
  const { t } = useTranslation('familyTree');
  const { appVersion, updateFamilyAccount, deleteFamily } = useFamily();
  const [familyName, setFamilyName] = useState('');
  const [badge, setBadge] = useState('');
  const [familyAvatar, setFamilyAvatar] = useState('');
  const [
    grandparentsHouseholdEnabled,
    setGrandparentsHouseholdEnabled
  ] = useState(true);
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const backdropRef = useRef(null);
  useViewportScrollLock(isOpen && Boolean(family));
  useVisualViewportDialog(isOpen && Boolean(family), backdropRef);

  useEffect(() => {
    if (!family) return;
    setFamilyName(family.familyName || '');
    setBadge(family.badge || '');
    setFamilyAvatar(family.familyAvatar || '');
    setGrandparentsHouseholdEnabled(
      family.grandparentsHouseholdEnabled !== false
    );
    setNewPassword('');
    setDeletePassword('');
    setShowDelete(false);
  }, [family, isOpen]);

  if (!isOpen || !family) return null;

  const uploadImage = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async loadEvent => {
      const compressed = await compressImageDataUrl(
        loadEvent.target.result,
        900,
        540,
        0.72
      );
      setFamilyAvatar(compressed);
    };
    reader.readAsDataURL(file);
  };

  const save = async event => {
    event.preventDefault();
    if (!familyName.trim()) return;
    setBusy(true);
    const payload = {
      familyName: familyName.trim(),
      badge: badge.trim() || t('settings.form.badgeDefault'),
      familyAvatar,
      grandparentsHouseholdEnabled
    };
    if (newPassword) payload.password = newPassword;
    const result = await updateFamilyAccount(payload);
    setBusy(false);
    if (result) onClose();
  };

  const removeFamily = async event => {
    event.preventDefault();
    setBusy(true);
    const deleted = await deleteFamily(deletePassword);
    setBusy(false);
    if (deleted) onClose();
  };

  return createPortal(
    <div
      ref={backdropRef}
      className="modal-backdrop visual-viewport-dialog"
      onClick={onClose}
    >
      <div
        className="modal-card family-settings-modal"
        onClick={event => event.stopPropagation()}
      >
        <div className="card-header">
          <div className="family-settings-heading">
            <span><Home size={22} /></span>
            <div>
              <span className="eyebrow">{t('settings.header.eyebrow')}</span>
              <h2>{t('settings.header.title')}</h2>
            </div>
          </div>
          <button className="icon-circle-btn" onClick={onClose} aria-label={t('common:actions.close')}>
            <X size={20} />
          </button>
        </div>

        {!showDelete ? (
          <form onSubmit={save}>
            <div className="family-cover-editor">
              <img src={familyAvatar || DEFAULT_FAMILY_AVATAR} alt="" />
              <label className="auth-secondary">
                <Upload size={17} /> {t('settings.form.newImage')}
                <input type="file" accept="image/*" onChange={uploadImage} />
              </label>
            </div>

            <label className="auth-field">
              <span>{t('settings.form.familyName')}</span>
              <input
                value={familyName}
                onChange={event => setFamilyName(event.target.value)}
                maxLength={100}
                required
              />
            </label>
            <label className="auth-field">
              <span>{t('settings.form.badge')}</span>
              <input
                value={badge}
                onChange={event => setBadge(event.target.value)}
                maxLength={60}
                placeholder={t('settings.form.badgePlaceholder')}
              />
            </label>

            <section className="family-feature-setting">
              <span className="family-feature-setting-icon">
                <Home size={20} />
              </span>
              <div className="family-feature-setting-copy">
                <span className="family-feature-setting-title">
                  <strong>{t('settings.household.title')}</strong>
                </span>
                <small>
                  {t('settings.household.description')}
                </small>
                <details className="family-feature-explainer">
                  <summary>
                    <CircleHelp size={14} /> {t('settings.household.why')}
                  </summary>
                  <p>
                    {t('settings.household.explainer')}
                  </p>
                </details>
              </div>
              <button
                type="button"
                className={`family-feature-switch ${
                  grandparentsHouseholdEnabled ? 'active' : ''
                }`}
                role="switch"
                aria-checked={grandparentsHouseholdEnabled}
                onClick={() =>
                  setGrandparentsHouseholdEnabled(value => !value)
                }
              >
                <span />
                {grandparentsHouseholdEnabled ? t('toggle.on') : t('toggle.off')}
              </button>
            </section>

            <label className="auth-field">
              <span>{t('settings.form.newPassword')}</span>
              <div className="auth-input-wrap">
                <LockKeyhole size={18} />
                <input
                  value={newPassword}
                  onChange={event => setNewPassword(event.target.value)}
                  type="password"
                  autoComplete="new-password"
                  minLength={4}
                  placeholder={t('settings.form.passwordPlaceholder')}
                />
              </div>
            </label>

            <div className="family-version-strip">
              <span>{PRODUCT_NAME}</span>
              <strong>{t('settings.about.version', { version: appVersion })}</strong>
            </div>

            <a
              className="family-github-card"
              href={GITHUB_REPOSITORY_URL}
              target="_blank"
              rel="noreferrer"
              aria-label={t('settings.github.aria')}
            >
              <span className="family-github-icon"><Github size={21} /></span>
              <span className="family-github-copy">
                <small>{t('settings.github.kicker')}</small>
                <strong>{t('settings.github.title')}</strong>
                <span>{t('settings.github.description')}</span>
              </span>
              <span className="family-github-action">
                <Star size={15} /> GitHub <ArrowUpRight size={15} />
              </span>
            </a>

            <ProjectSupportCard variant="settings" />

            <div className="modal-actions family-settings-actions">
              <button className="auth-primary" disabled={busy}>
                <Check size={17} /> {busy ? t('settings.actions.saving') : t('settings.actions.save')}
              </button>
              <button
                type="button"
                className="family-danger-link"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 size={16} /> {t('settings.actions.deleteAccount')}
              </button>
            </div>
          </form>
        ) : (
          <form className="family-delete-panel" onSubmit={removeFamily}>
            <span className="family-delete-icon"><ShieldAlert size={28} /></span>
            <h3>{t('settings.delete.title')}</h3>
            <p>
              {t('settings.delete.description')}
            </p>
            <label className="auth-field">
              <span>{t('settings.delete.passwordLabel')}</span>
              <input
                value={deletePassword}
                onChange={event => setDeletePassword(event.target.value)}
                type="password"
                autoComplete="current-password"
                autoFocus
                required
              />
            </label>
            <div className="modal-actions">
              <button
                className="family-delete-confirm"
                disabled={!deletePassword || busy}
              >
                <Trash2 size={16} />
                {busy ? t('settings.delete.deleting') : t('settings.delete.confirm')}
              </button>
              <button
                type="button"
                className="auth-secondary"
                onClick={() => setShowDelete(false)}
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}
