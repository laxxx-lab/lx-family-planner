import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BellOff,
  BellRing,
  CakeSlice,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Edit3,
  KeyRound,
  Lock,
  PawPrint,
  Plus,
  Star,
  Send,
  Trash2,
  Upload,
  UserRound,
  X
} from 'lucide-react';
import { FUNNY_COMIC_AVATARS, useFamily } from '../context/FamilyContext';
import { compressImageDataUrl } from '../utils/imageCompressor';
import {
  POSITION_OPTIONS,
  canManageFamily,
  getPositionLabel,
  getPositionOptionLabel,
  isManagedProfile,
  isPetProfile,
  isWallProfile,
  profileModuleOptionsForMember,
  roleForPosition
} from '../constants/roles';
import { DEFAULT_FAMILY_AVATAR, handleImgError } from '../utils/imageFallback';
import { NOTIFICATION_EVENT_DEFINITIONS } from '../../shared/notificationEvents';
import { isCapacitorNative } from '../utils/apiConfig';
import { useViewportScrollLock } from '../hooks/useViewportScrollLock';

const COLOR_PRESETS = [
  '#246B58',
  '#E06B4F',
  '#E0A52E',
  '#3767A6',
  '#8A5BB7',
  '#D45D87',
  '#138A9D'
];

const EMPTY_FORM = {
  name: '',
  position: 'kind',
  role: 'child',
  color: '#E0A52E',
  avatar: FUNNY_COMIC_AVATARS[0]?.url || '',
  birthDate: '',
  pin: '',
  isManaged: false,
  allowedModules: null
};

const PROFILE_NOTIFICATION_RULES =
  NOTIFICATION_EVENT_DEFINITIONS.map(({ key, title }) => [key, title]);

export default function ProfileModal() {
  const {
    members,
    addMember,
    updateMember,
    deleteMember,
    activeMemberId,
    setActiveMemberId,
    activeMember,
    webPush,
    enableWebPush,
    disableWebPush,
    updateWebPushPreferences,
    testWebPush,
    nativePush,
    enableNativePush,
    disableNativePush,
    updateNativePushPreferences,
    testNativePush,
    isProfileModalOpen,
    setIsProfileModalOpen,
    showToast
  } = useFamily();
  const { t } = useTranslation('profile');
  const { t: tShared } = useTranslation('shared');
  const [mode, setMode] = useState('list');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [pinTarget, setPinTarget] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [profileSecretType, setProfileSecretType] = useState('pin');
  const [busy, setBusy] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const modalBodyRef = useRef(null);
  const isNative = isCapacitorNative();
  useViewportScrollLock(isProfileModalOpen);
  const push = isNative ? nativePush : webPush;
  const enablePush = isNative ? enableNativePush : enableWebPush;
  const disablePush = isNative ? disableNativePush : disableWebPush;
  const updatePushPreferences = isNative
    ? updateNativePushPreferences
    : updateWebPushPreferences;
  const testPush = isNative ? testNativePush : testWebPush;

  useEffect(() => {
    if (!isProfileModalOpen) return undefined;

    setMode('list');
    setPinTarget(null);
    setPinInput('');
    setShowNotifications(false);

    const frame = window.requestAnimationFrame(() => {
      modalBodyRef.current?.scrollTo({ top: 0 });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [isProfileModalOpen]);

  if (!isProfileModalOpen) return null;

  const canManage = canManageFamily(activeMember);
  const selectableMembers = members.filter(member => !isManagedProfile(member));
  const managedMembers = members.filter(isManagedProfile);
  const currentPushDevice = push.devices.find(
    device => device.id === push.currentDeviceId
  );
  const pushPreferences = {
    ...push.defaults,
    ...(currentPushDevice?.preferences || {})
  };
  const notificationsEnabled = Boolean(push.currentDeviceId);
  const activeProfileIsPet = isPetProfile(activeMember);
  const activeProfileIsWall = isWallProfile(activeMember);
  const close = () => {
    setMode('list');
    setPinTarget(null);
    setShowNotifications(false);
    setIsProfileModalOpen(false);
  };

  const selectProfile = async member => {
    if (member.id === activeMemberId) {
      close();
      return;
    }
    if (
      member.hasPin ||
      (canManageFamily(member) && !canManageFamily(activeMember))
    ) {
      setPinTarget(member);
      setPinInput('');
      setProfileSecretType(member.hasPin ? 'pin' : 'family-password');
      return;
    }
    setBusy(true);
    try {
      await setActiveMemberId(member.id);
      showToast(t('toasts.switched'), t('toasts.greeting', { name: member.name }), 'success');
      close();
    } catch (error) {
      showToast(t('toasts.locked'), error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const verifyPin = async event => {
    event.preventDefault();
    if (!pinTarget) return;
    setBusy(true);
    try {
      await setActiveMemberId(
        pinTarget.id,
        profileSecretType === 'pin' ? pinInput : '',
        profileSecretType === 'family-password' ? pinInput : ''
      );
      showToast(t('toasts.switched'), t('toasts.greeting', { name: pinTarget.name }), 'success');
      close();
    } catch (error) {
      showToast(t('toasts.pinIncorrect'), error.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const beginAdd = (isManaged = false) => {
    setEditingMemberId(null);
    setForm({ ...EMPTY_FORM, isManaged });
    setShowNotifications(false);
    setMode('form');
  };

  const beginEdit = (member, event) => {
    event.stopPropagation();
    if (!canManage && member.id !== activeMemberId) return;
    setEditingMemberId(member.id);
    setForm({
      name: member.name,
      position: member.position || 'familienmitglied',
      role: member.role || 'member',
      color: member.color || COLOR_PRESETS[0],
      avatar: member.avatar || FUNNY_COMIC_AVATARS[0]?.url || '',
      birthDate: member.birthDate || '',
      pin: '',
      isManaged: isManagedProfile(member),
      allowedModules: Array.isArray(member.allowedModules)
        ? member.allowedModules
        : null
    });
    setShowNotifications(false);
    setMode('form');
  };

  const updateForm = changes => setForm(previous => ({ ...previous, ...changes }));

  const handlePosition = position => {
    const role = roleForPosition(position);
    updateForm({
      position,
      role,
      theme: role === 'child' ? 'adventure' : 'light',
      ...(role === 'pet' ? { isManaged: false } : {})
    });
  };

  const handleUpload = event => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async loadEvent => {
      const compressed = await compressImageDataUrl(
        loadEvent.target.result,
        320,
        320,
        0.72
      );
      updateForm({ avatar: compressed });
    };
    reader.readAsDataURL(file);
  };

  const availableProfileModules = profileModuleOptionsForMember(form);

  const toggleProfileModule = moduleId => {
    const current = Array.isArray(form.allowedModules)
      ? form.allowedModules
      : availableProfileModules;
    updateForm({
      allowedModules: current.includes(moduleId)
        ? current.filter(value => value !== moduleId)
        : [...current, moduleId]
    });
  };

  const save = async event => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const avatar = await compressImageDataUrl(form.avatar, 320, 320, 0.72);
      const payload = {
        ...form,
        name: form.name.trim(),
        avatar,
        pin: form.pin || undefined,
        allowedModules: (form.allowedModules || availableProfileModules)
          .filter(moduleId => availableProfileModules.includes(moduleId))
      };
      if (editingMemberId) {
        await updateMember(editingMemberId, payload);
        showToast(t('toasts.updated'), t('toasts.savedMessage', { name: payload.name }), 'success');
      } else {
        await addMember(payload);
      }
      setMode('list');
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!editingMemberId) return;
    if (!window.confirm(t('confirmDelete'))) return;
    setBusy(true);
    await deleteMember(editingMemberId);
    setBusy(false);
    setMode('list');
  };

  return (
    <div className="modal-backdrop profile-modal-backdrop" onClick={close}>
      <div
        className="modal-card profile-modal-modern"
        onClick={event => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        <div className="card-header profile-modal-header">
          <div>
            <span className="eyebrow">
              {pinTarget
                ? t('modal.eyebrow.protected')
                : mode === 'form'
                  ? editingMemberId
                    ? t('modal.eyebrow.edit')
                    : t('modal.eyebrow.new')
                  : t('modal.eyebrow.family')}
            </span>
            <h2 className="card-title" id="profile-modal-title">
              <UserRound size={23} />
              {pinTarget
                ? t('modal.title.unlock', { name: pinTarget.name })
                : mode === 'form'
                  ? editingMemberId
                    ? t('modal.title.edit')
                    : t('modal.title.create')
                  : t('modal.title.whoseTurn')}
            </h2>
          </div>
          <button
            type="button"
            className="icon-circle-btn"
            onClick={close}
            aria-label={t('common:actions.close')}
          >
            <X size={20} />
          </button>
        </div>

        <div className="profile-modal-body" ref={modalBodyRef}>
          {pinTarget ? (
          <form className="profile-pin-panel" onSubmit={verifyPin}>
            <div className="profile-pin-icon"><Lock size={26} /></div>
            <h3>{t('pin.protectedHeading', { name: pinTarget.name })}</h3>
            <p>
              {profileSecretType === 'pin'
                ? t('pin.enterPin')
                : activeProfileIsPet
                  ? t('pin.petPasswordNeeded')
                  : t('pin.childPasswordNeeded')}
            </p>
            <div className="auth-input-wrap">
              <KeyRound size={18} />
              <input
                value={pinInput}
                onChange={event => setPinInput(event.target.value)}
                type="password"
                autoComplete={
                  profileSecretType === 'pin'
                    ? 'one-time-code'
                    : 'current-password'
                }
                inputMode={profileSecretType === 'pin' ? 'numeric' : undefined}
                maxLength={profileSecretType === 'pin' ? 12 : 128}
                placeholder={
                  profileSecretType === 'pin'
                    ? t('pin.pinPlaceholder')
                    : t('pin.familyPasswordPlaceholder')
                }
                autoFocus
              />
            </div>
            <div className="modal-actions">
              <button className="auth-primary" disabled={busy || !pinInput}>
                {t('pin.unlock')}
              </button>
              <button
                className="auth-secondary"
                type="button"
                onClick={() => setPinTarget(null)}
              >
                {t('common:actions.cancel')}
              </button>
            </div>
          </form>
          ) : mode === 'list' ? (
          <>
            <p className="profile-switch-intro">
              {t('list.intro')}
            </p>
            <div className="profile-switch-grid" role="list">
              {selectableMembers.map((member, index) => {
                const isActive = member.id === activeMemberId;
                const canEdit = !activeProfileIsWall && (canManage || member.id === activeMemberId);
                return (
                  <div
                    key={member.id}
                    className={`profile-switch-card ${
                      isPetProfile(member) ? 'pet' : ''
                    } ${isActive ? 'active' : ''}`}
                    style={{
                      '--member-color': member.color || '#246B58',
                      '--profile-index': index
                    }}
                    role="listitem"
                  >
                  <button
                    type="button"
                    className="profile-switch-target"
                    onClick={() => selectProfile(member)}
                    disabled={busy}
                    aria-label={t('list.selectAria', { name: member.name, position: getPositionLabel(member) })}
                  >
                    <span className="profile-switch-avatar">
                      <img
                        src={member.avatar || DEFAULT_FAMILY_AVATAR}
                        onError={handleImgError}
                        alt=""
                      />
                      {isActive && (
                        <span className="profile-active-check" aria-label={t('list.activeProfile')}>
                          <Check size={16} strokeWidth={3} />
                        </span>
                      )}
                      {member.hasPin && (
                        <span className="profile-lock-badge" aria-label={t('list.pinProtected')}>
                          <Lock size={13} />
                        </span>
                      )}
                    </span>
                    <strong>{member.name}</strong>
                    <span className="profile-switch-role">
                      {getPositionLabel(member)}
                    </span>
                    {member.role === 'child' && (
                      <span className="profile-switch-stars">
                        <Star size={13} fill="currentColor" /> {member.stars || 0}
                      </span>
                    )}
                    {isPetProfile(member) && (
                      <span className="profile-switch-pet">
                        <PawPrint size={13} /> {t('list.petBadge')}
                      </span>
                    )}
                  </button>
                  {canEdit && (
                    <button
                      type="button"
                      className="profile-switch-edit"
                      onClick={event => beginEdit(member, event)}
                      aria-label={t('list.editMember', { name: member.name })}
                      title={t('list.editMember', { name: member.name })}
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                </div>
                );
              })}
            </div>

            {canManage && managedMembers.length > 0 && (
              <section className="managed-profile-section">
                <header>
                  <span className="managed-profile-heading-icon">
                    <ClipboardList size={19} />
                  </span>
                  <div>
                    <strong>{t('list.managedHeading')}</strong>
                    <small>
                      {t('list.managedSubheading')}
                    </small>
                  </div>
                  <span className="managed-profile-count">
                    {managedMembers.length}
                  </span>
                </header>
                <div className="managed-profile-list">
                  {managedMembers.map(member => (
                    <article
                      key={member.id}
                      style={{ '--member-color': member.color || '#246B58' }}
                    >
                      <img
                        src={member.avatar || DEFAULT_FAMILY_AVATAR}
                        onError={handleImgError}
                        alt=""
                      />
                      <span>
                        <strong>{member.name}</strong>
                        <small>
                          {t('list.managedNoAccess', { position: getPositionLabel(member) })}
                        </small>
                      </span>
                      <span className="managed-profile-capabilities">
                        <i title={t('list.eventsTitle')}><CalendarDays size={14} /></i>
                        <i title={t('list.tasksTitle')}><ClipboardList size={14} /></i>
                      </span>
                      <button
                        type="button"
                        onClick={event => beginEdit(member, event)}
                        aria-label={t('list.editMember', { name: member.name })}
                        title={t('list.editMember', { name: member.name })}
                      >
                        <Edit3 size={15} />
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}

            <div className={`profile-tools ${activeProfileIsPet ? 'pet-active' : ''}`}>
              {!activeProfileIsPet && !activeProfileIsWall && (
                <button
                  type="button"
                  className="profile-tool-button"
                  aria-expanded={showNotifications}
                  aria-controls="profile-notification-settings"
                  onClick={() => setShowNotifications(value => !value)}
                >
                  <span className="profile-tool-icon">
                    {notificationsEnabled ? <BellRing size={19} /> : <BellOff size={19} />}
                  </span>
                  <span className="profile-tool-copy">
                    <strong>{t('notifications.title')}</strong>
                    <small>
                      {t('notifications.deviceHint', { name: activeMember?.name })}
                    </small>
                  </span>
                  <ChevronDown
                    className={showNotifications ? 'open' : ''}
                    size={18}
                  />
                </button>
              )}
              {activeProfileIsPet && (
                <div className="profile-pet-mode-note">
                  <PawPrint size={19} />
                  <span>
                    <strong>{t('notifications.petModeActive')}</strong>
                    <small>{t('notifications.petModeHint')}</small>
                  </span>
                </div>
              )}
              {canManage && (
                <button
                  type="button"
                  className="auth-secondary profile-add"
                  onClick={() => beginAdd(false)}
                >
                  <Plus size={18} /> {t('list.addMember')}
                </button>
              )}

            </div>

            {!activeProfileIsPet && !activeProfileIsWall && showNotifications && (
              <section
                className="profile-notification-settings"
                id="profile-notification-settings"
              >
              <div className="profile-notification-heading">
                <span className="profile-notification-icon">
                  {notificationsEnabled ? <BellRing size={20} /> : <BellOff size={20} />}
                </span>
                <div>
                  <strong>{t('notifications.headingFor', { name: activeMember?.name })}</strong>
                  <small>
                    {t('notifications.savedPerDevice')}
                  </small>
                </div>
                <button
                  type="button"
                  className={`profile-notification-switch ${
                    notificationsEnabled ? 'active' : ''
                  }`}
                  role="switch"
                  aria-checked={notificationsEnabled}
                  disabled={
                    Boolean(push.busy) ||
                    !push.supported ||
                    (isNative && !push.serverConfigured)
                  }
                  onClick={() =>
                    notificationsEnabled ? disablePush() : enablePush()
                  }
                >
                  <span />
                  {notificationsEnabled ? t('notifications.on') : t('notifications.off')}
                </button>
              </div>

              {!push.supported && (
                <p className="profile-notification-note">{push.message}</p>
              )}
              {isNative && !push.serverConfigured && (
                <p className="profile-notification-note warning">
                  {t('notifications.serverNotConfigured')}
                </p>
              )}
              {push.permission === 'denied' && (
                <p className="profile-notification-note warning">
                  {isNative
                    ? t('notifications.deniedNative')
                    : t('notifications.deniedBrowser')}
                </p>
              )}

              {notificationsEnabled && (
                <>
                  <div className="profile-notification-options">
                    {PROFILE_NOTIFICATION_RULES.map(([key, label]) => (
                      <label key={key}>
                        <input
                          type="checkbox"
                          checked={Boolean(pushPreferences[key])}
                          disabled={Boolean(push.busy)}
                          onChange={event =>
                            updatePushPreferences({
                              [key]: event.target.checked
                            })
                          }
                        />
                        <span>{tShared(`events.${key}.title`, { defaultValue: label })}</span>
                      </label>
                    ))}
                    <label>
                      <input
                        type="checkbox"
                        checked={Boolean(pushPreferences.showPreviews)}
                        disabled={Boolean(push.busy)}
                        onChange={event =>
                          updatePushPreferences({
                            showPreviews: event.target.checked
                          })
                        }
                      />
                      <span>{t('notifications.showPreviews')}</span>
                    </label>
                  </div>
                  <button
                    type="button"
                    className="profile-notification-test"
                    disabled={Boolean(push.busy)}
                    onClick={testPush}
                  >
                    <Send size={15} /> {t('notifications.sendTest')}
                  </button>
                </>
              )}
              </section>
            )}
          </>
          ) : (
          <form className="profile-editor-modern" onSubmit={save}>
            <div className="profile-editor-preview">
              <img src={form.avatar || DEFAULT_FAMILY_AVATAR} alt="" />
              <strong>{form.name || t('modal.eyebrow.new')}</strong>
              <span>
                {POSITION_OPTIONS.find(option => option.value === form.position)?.emoji}{' '}
                {getPositionOptionLabel(POSITION_OPTIONS.find(option => option.value === form.position))}
              </span>
            </div>

            <div className="profile-editor-fields">
              {canManage && form.role !== 'pet' && (
                <fieldset className="profile-access-choice">
                  <legend className="form-label">{t('form.usage')}</legend>
                  <label className={!form.isManaged ? 'selected' : ''}>
                    <input
                      type="radio"
                      name="profile-access"
                      checked={!form.isManaged}
                      onChange={() => updateForm({ isManaged: false })}
                      disabled={editingMemberId === activeMemberId}
                    />
                    <span className="profile-access-icon"><UserRound size={19} /></span>
                    <span>
                      <strong>{t('form.ownLogin')}</strong>
                      <small>
                        {t('form.ownLoginHint')}
                      </small>
                    </span>
                  </label>
                  <label className={form.isManaged ? 'selected managed' : ''}>
                    <input
                      type="radio"
                      name="profile-access"
                      checked={form.isManaged}
                      onChange={() => updateForm({ isManaged: true, pin: '' })}
                      disabled={editingMemberId === activeMemberId}
                    />
                    <span className="profile-access-icon"><ClipboardList size={19} /></span>
                    <span>
                      <strong>{t('form.managedOnly')}</strong>
                      <small>
                        {t('form.managedOnlyHint')}
                      </small>
                    </span>
                  </label>
                </fieldset>
              )}
              {form.isManaged && (
                <div className="managed-profile-editor-note">
                  <CalendarDays size={20} />
                  <span>
                    <strong>{t('form.managedNote')}</strong>
                    <small>
                      {t('form.managedNoteHint')}
                    </small>
                  </span>
                </div>
              )}
              {form.role === 'pet' && (
                <div className="pet-profile-editor-note">
                  <PawPrint size={20} />
                  <span>
                    <strong>{t('form.petNote')}</strong>
                    <small>
                      {t('form.petNoteHint')}
                    </small>
                  </span>
                </div>
              )}
              <label className="form-group">
                <span className="form-label">
                  {form.role === 'pet' ? t('form.petName') : t('common:labels.name')}
                </span>
                <input
                  className="form-input"
                  value={form.name}
                  onChange={event => updateForm({ name: event.target.value })}
                  placeholder={form.role === 'pet' ? t('form.petNamePlaceholder') : t('form.namePlaceholder')}
                  maxLength={80}
                  required
                />
              </label>

              {form.role !== 'pet' && (
                <label className="form-group profile-birthday-field">
                  <span className="form-label">
                    <CakeSlice size={15} /> {t('form.birthDate')}
                  </span>
                  <input
                    className="form-input"
                    type="date"
                    value={form.birthDate || ''}
                    max={new Date().toISOString().slice(0, 10)}
                    onInput={event => updateForm({ birthDate: event.currentTarget.value })}
                    onChange={event => updateForm({ birthDate: event.target.value })}
                  />
                  <small>{t('form.birthDateHint')}</small>
                </label>
              )}

              {canManage && (
                <label className="form-group">
                  <span className="form-label">{t('form.position')}</span>
                  <select
                    className="form-select"
                    value={form.position}
                    onChange={event => handlePosition(event.target.value)}
                  >
                    {POSITION_OPTIONS.map(option => (
                      <option value={option.value} key={option.value}>
                        {option.emoji} {getPositionOptionLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {canManage && !form.isManaged && availableProfileModules.length > 0 && (
                <fieldset className="profile-module-choice">
                  <legend className="form-label">{t('modules.profileTitle')}</legend>
                  <p>{t('modules.profileHint')}</p>
                  <div>
                    {availableProfileModules.map(moduleId => {
                      const selected = !Array.isArray(form.allowedModules) ||
                        form.allowedModules.includes(moduleId);
                      return (
                        <label className={selected ? 'selected' : ''} key={moduleId}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleProfileModule(moduleId)}
                          />
                          <span>{t(`modules.labels.${moduleId}`)}</span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

              <div className="form-group">
                <span className="form-label">{t('form.avatar')}</span>
                <div className="avatar-preset-row">
                  {FUNNY_COMIC_AVATARS.map(avatar => (
                    <button
                      type="button"
                      key={avatar.id}
                      className={form.avatar === avatar.url ? 'selected' : ''}
                      onClick={() => updateForm({ avatar: avatar.url })}
                      title={t(`avatars.${avatar.id}`, {
                        defaultValue: avatar.name
                      })}
                    >
                      <img src={avatar.url} alt="" />
                    </button>
                  ))}
                  <label className="avatar-upload-button" title={t('form.ownPhoto')}>
                    <Upload size={18} />
                    <input type="file" accept="image/*" onChange={handleUpload} />
                  </label>
                </div>
              </div>

              <div className="form-group">
                <span className="form-label">{t('form.color')}</span>
                <div className="color-preset-row">
                  {COLOR_PRESETS.map(color => (
                    <button
                      type="button"
                      key={color}
                      style={{ background: color }}
                      className={form.color === color ? 'selected' : ''}
                      onClick={() => updateForm({ color })}
                    >
                      {form.color === color && <Check size={15} />}
                    </button>
                  ))}
                </div>
              </div>

              {form.role !== 'pet' && !form.isManaged && (
                <label className="form-group">
                  <span className="form-label">
                    {editingMemberId ? t('form.newPin') : t('form.pin')}
                  </span>
                  <input
                    className="form-input"
                    type="password"
                    autoComplete="new-password"
                    inputMode="numeric"
                    value={form.pin}
                    onChange={event => updateForm({ pin: event.target.value })}
                    placeholder={editingMemberId ? t('form.pinKeepPlaceholder') : t('form.pinPlaceholder')}
                    maxLength={12}
                  />
                </label>
              )}
            </div>

            <div className="modal-actions profile-editor-actions">
              <button className="auth-primary" disabled={busy}>
                <Check size={17} /> {busy ? t('form.saving') : t('form.save')}
              </button>
              <button
                type="button"
                className="auth-secondary"
                onClick={() => setMode('list')}
              >
                {t('common:actions.cancel')}
              </button>
              {canManage && editingMemberId && editingMemberId !== activeMemberId && (
                <button
                  type="button"
                  className="profile-delete"
                  onClick={remove}
                  disabled={busy}
                >
                  <Trash2 size={16} /> {t('form.delete')}
                </button>
              )}
            </div>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
