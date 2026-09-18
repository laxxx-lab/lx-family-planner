import React, { useEffect, useMemo, useState } from 'react';
import {
  ArchiveRestore,
  CalendarDays,
  Check,
  Cloud,
  CloudCog,
  CloudUpload,
  Copy,
  ExternalLink,
  FolderHeart,
  HardDrive,
  KeyRound,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Unplug,
  UsersRound
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../../context/FamilyContext';
import { formatDateTime } from '../../utils/formatting';
import NextcloudCalendarTargets from './NextcloudCalendarTargets';

function suggestedPublicUrl() {
  const url = new URL(window.location.origin);
  const host = url.hostname.toLowerCase();
  const isPrivateIpv4 =
    /^(10\.|192\.168\.|127\.|169\.254\.)/.test(host) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host);
  if (
    host !== 'localhost' &&
    !host.endsWith('.local') &&
    !isPrivateIpv4
  ) {
    return '';
  }
  url.port = '8080';
  return url.origin;
}

function relativeTime(timestamp, t) {
  if (!timestamp) return t('nextcloud.notYet');
  const distance = Date.now() - Number(timestamp);
  if (distance < 60_000) return t('nextcloud.justNow');
  if (distance < 3_600_000) {
    return t('nextcloud.minutesAgo', {
      minutes: Math.max(1, Math.round(distance / 60_000))
    });
  }
  if (distance < 86_400_000) {
    return t('nextcloud.hoursAgo', {
      hours: Math.max(1, Math.round(distance / 3_600_000))
    });
  }
  return formatDateTime(timestamp, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });
}

const STAT_LABEL_KEYS = {
  imported: 'nextcloud.stats.imported',
  exported: 'nextcloud.stats.exported',
  updatedLocal: 'nextcloud.stats.updatedLocal',
  updatedRemote: 'nextcloud.stats.updatedRemote',
  deletedLocal: 'nextcloud.stats.deletedLocal',
  deletedRemote: 'nextcloud.stats.deletedRemote',
  conflicts: 'nextcloud.stats.conflicts'
};

export default function NextcloudSettings() {
  const { t } = useTranslation('adminCloud');
  const {
    members,
    showToast,
    nextcloudIntegration,
    setupNextcloud,
    setupBundledNextcloud,
    getBundledNextcloudAccess,
    updateNextcloud,
    testNextcloud,
    syncNextcloud,
    backupToNextcloud,
    disconnectNextcloud,
    setActiveTab
  } = useFamily();
  const connected = Boolean(nextcloudIntegration?.connected);
  const [dockerMode, setDockerMode] = useState(true);
  const [form, setForm] = useState({
    baseUrl: 'http://nextcloud',
    publicBaseUrl:
      nextcloudIntegration?.bundledPublicBaseUrl ||
      suggestedPublicUrl(),
    username: '',
    appPassword: '',
    folder: 'LX Family'
  });
  const [settings, setSettings] = useState({
    enabled: true,
    eventSyncEnabled: true,
    eventCalendarHref: '',
    defaultMemberId: 'all',
    includeGrandparents: false,
    backupEnabled: true,
    backupHour: 3,
    folder: 'LX Family',
    publicBaseUrl: suggestedPublicUrl()
  });
  const [busy, setBusy] = useState('');
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [cloudAccess, setCloudAccess] = useState(null);

  const eventCalendars = useMemo(
    () => (nextcloudIntegration?.calendars || []).filter(calendar =>
      calendar.components?.includes('VEVENT')
    ),
    [nextcloudIntegration?.calendars]
  );

  useEffect(() => {
    if (!connected) return;
    setSettings({
      enabled: nextcloudIntegration.enabled !== false,
      eventSyncEnabled:
        nextcloudIntegration.eventSyncEnabled !== false,
      eventCalendarHref:
        nextcloudIntegration.eventCalendarHref || '',
      defaultMemberId:
        nextcloudIntegration.defaultMemberId || 'all',
      includeGrandparents: Boolean(
        nextcloudIntegration.includeGrandparents
      ),
      backupEnabled: Boolean(nextcloudIntegration.backupEnabled),
      backupHour: Number(nextcloudIntegration.backupHour ?? 3),
      folder: nextcloudIntegration.folder || 'LX Family',
      publicBaseUrl:
        nextcloudIntegration.publicBaseUrl || suggestedPublicUrl()
    });
  }, [
    connected,
    nextcloudIntegration?.updatedAt,
    nextcloudIntegration?.eventCalendarHref,
    nextcloudIntegration?.lastSyncAt,
    nextcloudIntegration?.lastBackupAt
  ]);

  useEffect(() => {
    if (connected || !dockerMode) return;
    const configured =
      nextcloudIntegration?.bundledPublicBaseUrl ||
      suggestedPublicUrl();
    if (!configured) return;
    setForm(previous => ({
      ...previous,
      publicBaseUrl: configured
    }));
  }, [
    connected,
    dockerMode,
    nextcloudIntegration?.bundledPublicBaseUrl
  ]);

  const connect = async event => {
    event.preventDefault();
    setBusy('connect');
    const result = dockerMode
      ? await setupBundledNextcloud({
          publicBaseUrl: form.publicBaseUrl,
          folder: form.folder,
          backupHour: 3
        })
      : await setupNextcloud({
          ...form,
          eventSyncEnabled: true,
          backupEnabled: true,
          defaultMemberId: 'all',
          backupHour: 3
        });
    setBusy('');
    if (result) {
      setForm(previous => ({ ...previous, appPassword: '' }));
    }
  };

  const save = async () => {
    setBusy('save');
    await updateNextcloud(settings);
    setBusy('');
  };

  const run = async (kind, action) => {
    setBusy(kind);
    await action();
    setBusy('');
  };

  const disconnect = async () => {
    if (!confirmDisconnect) {
      setConfirmDisconnect(true);
      return;
    }
    setBusy('disconnect');
    await disconnectNextcloud();
    setBusy('');
    setConfirmDisconnect(false);
    setCloudAccess(null);
  };

  const revealCloudAccess = async () => {
    if (cloudAccess) {
      setCloudAccess(null);
      return;
    }
    setBusy('access');
    const access = await getBundledNextcloudAccess();
    setBusy('');
    if (access) setCloudAccess(access);
  };

  const copyAccessValue = async (value, label) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const field = document.createElement('textarea');
        field.value = value;
        field.style.position = 'fixed';
        field.style.opacity = '0';
        document.body.appendChild(field);
        field.select();
        document.execCommand('copy');
        field.remove();
      }
      showToast(
        t('nextcloud.copiedTitle', { label }),
        t('nextcloud.copiedBody'),
        'success'
      );
    } catch {
      showToast(
        t('nextcloud.copyFailedTitle'),
        t('nextcloud.copyFailedBody'),
        'warning'
      );
    }
  };

  const settingsUrl = (() => {
    try {
      return `${new URL(form.publicBaseUrl).origin}/index.php/settings/user/security`;
    } catch {
      return '';
    }
  })();

  return (
    <section className="admin-panel nextcloud-settings-panel">
      <header className="nextcloud-heading">
        <div className="nextcloud-orbit" aria-hidden="true">
          <Cloud size={25} />
          <i />
        </div>
        <div>
          <span className="admin-section-kicker">
            {t('nextcloud.kicker')}
          </span>
          <h2>{t('nextcloud.title')}</h2>
          <p>{t('nextcloud.intro')}</p>
        </div>
        <span className={`nextcloud-state ${connected ? 'online' : ''}`}>
          <i />
          {connected ? t('nextcloud.stateConnected') : t('nextcloud.stateReady')}
        </span>
      </header>

      {!connected ? (
        <form className="nextcloud-connect" onSubmit={connect}>
          <div className="nextcloud-mode-picker">
            <button
              type="button"
              className={dockerMode ? 'active' : ''}
              onClick={() => {
                setDockerMode(true);
                setForm(previous => ({
                  ...previous,
                  baseUrl: 'http://nextcloud',
                  publicBaseUrl:
                    nextcloudIntegration?.bundledPublicBaseUrl ||
                    suggestedPublicUrl()
                }));
              }}
            >
              <HardDrive size={18} />
              <span>
                <strong>{t('nextcloud.dockerModeTitle')}</strong>
                <small>{t('nextcloud.dockerModeHint')}</small>
              </span>
              {dockerMode && <Check size={16} />}
            </button>
            <button
              type="button"
              className={!dockerMode ? 'active' : ''}
              onClick={() => setDockerMode(false)}
            >
              <CloudCog size={18} />
              <span>
                <strong>{t('nextcloud.existingModeTitle')}</strong>
                <small>{t('nextcloud.existingModeHint')}</small>
              </span>
              {!dockerMode && <Check size={16} />}
            </button>
          </div>

          <div className="nextcloud-security-note">
            <ShieldCheck size={22} />
            <span>
              <strong>
                {dockerMode
                  ? t('nextcloud.securityDockerTitle')
                  : t('nextcloud.securityExistingTitle')}
              </strong>
              {dockerMode
                ? t('nextcloud.securityDockerBody')
                : t('nextcloud.securityExistingBody')}
            </span>
          </div>

          <div className="nextcloud-form-grid">
            {!dockerMode && (
              <label>
                <span>{t('nextcloud.baseUrlLabel')}</span>
                <input
                  value={form.baseUrl}
                  onChange={event => setForm(previous => ({
                    ...previous,
                    baseUrl: event.target.value
                  }))}
                  placeholder="https://cloud.example.de"
                  inputMode="url"
                  required
                />
                <small>{t('nextcloud.baseUrlHint')}</small>
              </label>
            )}
            <label>
              <span>{t('nextcloud.publicUrlLabel')}</span>
              <input
                value={form.publicBaseUrl}
                onChange={event => setForm(previous => ({
                  ...previous,
                  publicBaseUrl: event.target.value
                }))}
                placeholder="https://cloud.example.de"
                inputMode="url"
                required
              />
              <small>
                {dockerMode && nextcloudIntegration?.bundledPublicBaseUrl
                  ? t('nextcloud.publicUrlHintBundled')
                  : dockerMode
                    ? t('nextcloud.publicUrlHintDocker')
                    : t('nextcloud.publicUrlHintExisting')}
              </small>
            </label>
            {!dockerMode && (
              <>
                <label>
                  <span>{t('nextcloud.usernameLabel')}</span>
                  <input
                    value={form.username}
                    onChange={event => setForm(previous => ({
                      ...previous,
                      username: event.target.value
                    }))}
                    autoComplete="username"
                    placeholder={t('nextcloud.usernamePlaceholder')}
                    required
                  />
                </label>
                <label>
                  <span><KeyRound size={14} /> {t('nextcloud.appPasswordLabel')}</span>
                  <input
                    type="password"
                    value={form.appPassword}
                    onChange={event => setForm(previous => ({
                      ...previous,
                      appPassword: event.target.value
                    }))}
                    autoComplete="new-password"
                    placeholder={t('nextcloud.appPasswordPlaceholder')}
                    required
                  />
                  {settingsUrl && (
                    <a
                      href={settingsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t('nextcloud.createInNextcloud')} <ExternalLink size={12} />
                    </a>
                  )}
                </label>
              </>
            )}
            <label className="nextcloud-folder-field">
              <span><FolderHeart size={14} /> {t('nextcloud.folderLabel')}</span>
              <input
                value={form.folder}
                onChange={event => setForm(previous => ({
                  ...previous,
                  folder: event.target.value
                }))}
                placeholder="LX Family"
                required
              />
            </label>
          </div>

          <button
            className="nextcloud-connect-button"
            disabled={Boolean(busy)}
          >
            {busy === 'connect'
              ? <LoaderCircle className="spin" size={18} />
              : <Sparkles size={18} />}
            {busy === 'connect'
              ? t('nextcloud.connectPreparing')
              : dockerMode
                ? t('nextcloud.connectDocker')
                : t('nextcloud.connectExisting')}
          </button>
        </form>
      ) : (
        <div className="nextcloud-workspace">
          <div className="nextcloud-account-strip">
            <span className="nextcloud-account-mark">
              <Cloud size={23} />
            </span>
            <span>
              <small>{t('nextcloud.connectedAs')}</small>
              <strong>{nextcloudIntegration.displayName}</strong>
              <em>
                {nextcloudIntegration.host}
                {nextcloudIntegration.nextcloudVersion
                  ? ` · Nextcloud ${nextcloudIntegration.nextcloudVersion}`
                  : ''}
              </em>
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('cloud')}
            >
              <FolderHeart size={15} />
              {t('nextcloud.openArchive')}
            </button>
          </div>

          {(nextcloudIntegration.lastSyncError ||
            nextcloudIntegration.lastBackupError) && (
            <div className="nextcloud-error-note" role="status">
              <CloudCog size={18} />
              <span>
                <strong>{t('nextcloud.attentionTitle')}</strong>
                {nextcloudIntegration.lastSyncError ||
                  nextcloudIntegration.lastBackupError}
              </span>
            </div>
          )}

          <div className="nextcloud-capability-grid">
            <article>
              <span><CalendarDays size={21} /></span>
              <div>
                <strong>{t('nextcloud.calendarCapabilityTitle')}</strong>
                <small>{t('nextcloud.calendarCapabilityBody')}</small>
              </div>
              <label className="nextcloud-switch">
                <input
                  type="checkbox"
                  checked={settings.eventSyncEnabled}
                  onChange={event => setSettings(previous => ({
                    ...previous,
                    eventSyncEnabled: event.target.checked
                  }))}
                />
                <i />
              </label>
            </article>
            <article>
              <span><ArchiveRestore size={21} /></span>
              <div>
                <strong>{t('nextcloud.backupCapabilityTitle')}</strong>
                <small>{t('nextcloud.backupCapabilityBody')}</small>
              </div>
              <label className="nextcloud-switch">
                <input
                  type="checkbox"
                  checked={settings.backupEnabled}
                  onChange={event => setSettings(previous => ({
                    ...previous,
                    backupEnabled: event.target.checked
                  }))}
                />
                <i />
              </label>
            </article>
          </div>

          <div className="nextcloud-settings-grid">
            <label>
              <span>{t('nextcloud.calendarLabel')}</span>
              <select
                value={settings.eventCalendarHref}
                onChange={event => setSettings(previous => ({
                  ...previous,
                  eventCalendarHref: event.target.value
                }))}
                disabled={!settings.eventSyncEnabled}
              >
                <option value="">{t('nextcloud.noCalendar')}</option>
                {eventCalendars.map(calendar => (
                  <option value={calendar.href} key={calendar.href}>
                    {calendar.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t('nextcloud.unassignedEventsLabel')}</span>
              <select
                value={settings.defaultMemberId}
                onChange={event => setSettings(previous => ({
                  ...previous,
                  defaultMemberId: event.target.value
                }))}
              >
                <option value="all">{t('nextcloud.wholeFamily')}</option>
                {members
                  .filter(member => member.role !== 'pet')
                  .map(member => (
                    <option value={member.id} key={member.id}>
                      {member.name}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              <span>{t('nextcloud.folderLabel')}</span>
              <input
                value={settings.folder}
                onChange={event => setSettings(previous => ({
                  ...previous,
                  folder: event.target.value
                }))}
              />
            </label>
            <label>
              <span>{t('nextcloud.backupHourLabel')}</span>
              <select
                value={settings.backupHour}
                onChange={event => setSettings(previous => ({
                  ...previous,
                  backupHour: Number(event.target.value)
                }))}
                disabled={!settings.backupEnabled}
              >
                {[0, 1, 2, 3, 4, 5, 6, 12, 18, 21, 22, 23].map(hour => (
                  <option value={hour} key={hour}>
                    {t('nextcloud.backupHourOption', {
                      hour: String(hour).padStart(2, '0')
                    })}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="nextcloud-grandparents-option">
            <input
              type="checkbox"
              checked={settings.includeGrandparents}
              onChange={event => setSettings(previous => ({
                ...previous,
                includeGrandparents: event.target.checked
              }))}
            />
            <span><UsersRound size={17} /></span>
            <span>
              <strong>{t('nextcloud.grandparentsTitle')}</strong>
              {t('nextcloud.grandparentsBody')}
            </span>
          </label>

          <div className="nextcloud-pulse-grid">
            <article>
              <span><RefreshCw size={17} /></span>
              <div>
                <small>{t('nextcloud.lastSync')}</small>
                <strong>{relativeTime(nextcloudIntegration.lastSyncAt, t)}</strong>
              </div>
            </article>
            <article>
              <span><CloudUpload size={17} /></span>
              <div>
                <small>{t('nextcloud.lastBackup')}</small>
                <strong>{relativeTime(nextcloudIntegration.lastBackupAt, t)}</strong>
              </div>
            </article>
          </div>

          {Object.values(nextcloudIntegration.lastSyncStats || {})
            .some(value => Number(value) > 0) && (
            <div className="nextcloud-sync-stats">
              {Object.entries(nextcloudIntegration.lastSyncStats)
                .filter(([, value]) => Number(value) > 0)
                .map(([key, value]) => (
                  <span key={key}>
                    <strong>{value}</strong>
                    {STAT_LABEL_KEYS[key] ? t(STAT_LABEL_KEYS[key]) : key}
                  </span>
                ))}
            </div>
          )}

          <div className="nextcloud-actions">
            <button
              type="button"
              className="admin-primary-button"
              onClick={save}
              disabled={Boolean(busy)}
            >
              {busy === 'save'
                ? <LoaderCircle className="spin" size={16} />
                : <Check size={16} />}
              {t('nextcloud.saveSettings')}
            </button>
            <button
              type="button"
              onClick={() => run('sync', syncNextcloud)}
              disabled={Boolean(busy) || !settings.eventSyncEnabled}
            >
              <RefreshCw
                className={busy === 'sync' ? 'spin' : ''}
                size={16}
              />
              {t('nextcloud.syncNow')}
            </button>
            <button
              type="button"
              onClick={() => run('backup', backupToNextcloud)}
              disabled={Boolean(busy)}
            >
              <CloudUpload size={16} />
              {t('nextcloud.backupNow')}
            </button>
          </div>

          <NextcloudCalendarTargets />

          <details className="nextcloud-connection-details">
            <summary>{t('nextcloud.manageConnection')}</summary>
            <div>
              {nextcloudIntegration.bundled && (
                <button
                  type="button"
                  onClick={revealCloudAccess}
                  disabled={Boolean(busy)}
                >
                  <KeyRound size={15} />
                  {cloudAccess
                    ? t('nextcloud.hideAccess')
                    : t('nextcloud.showAccess')}
                </button>
              )}
              <button
                type="button"
                onClick={() => run('test', testNextcloud)}
                disabled={Boolean(busy)}
              >
                <CloudCog size={15} />
                {t('nextcloud.recheck')}
              </button>
              <button
                type="button"
                className="danger"
                onClick={disconnect}
                disabled={Boolean(busy)}
              >
                <Unplug size={15} />
                {confirmDisconnect
                  ? t('nextcloud.confirmDisconnect')
                  : t('nextcloud.disconnect')}
              </button>
            </div>
            {cloudAccess && (
              <div className="nextcloud-access-card">
                <span>
                  <strong>{t('nextcloud.addressLabel')}</strong>
                  <code>{cloudAccess.url}</code>
                </span>
                <span>
                  <strong>{t('nextcloud.usernameField')}</strong>
                  <code>{cloudAccess.username}</code>
                  <button
                    type="button"
                    onClick={() => copyAccessValue(
                      cloudAccess.username,
                      t('nextcloud.usernameField')
                    )}
                  >
                    <Copy size={14} />
                    {t('nextcloud.copy')}
                  </button>
                </span>
                <span>
                  <strong>{t('nextcloud.passwordField')}</strong>
                  <code>{cloudAccess.password}</code>
                  <button
                    type="button"
                    onClick={() => copyAccessValue(
                      cloudAccess.password,
                      t('nextcloud.passwordField')
                    )}
                  >
                    <Copy size={14} />
                    {t('nextcloud.copy')}
                  </button>
                </span>
                <small>{t('nextcloud.accessNote')}</small>
              </div>
            )}
          </details>
        </div>
      )}
    </section>
  );
}
