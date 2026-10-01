import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Cloud, KeyRound, Link2, LoaderCircle, Trash2 } from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { plannerApiRequest } from '../../utils/apiConfig';

export default function WebDavSettings() {
  const { t } = useTranslation('admin');
  const { webdavIntegration: existing, refreshBootstrap, showToast } = useFamily();
  const [form, setForm] = useState({
    baseUrl: existing?.baseUrl || '',
    username: '',
    password: '',
    folder: existing?.folder || 'LX Family'
  });
  const [busy, setBusy] = useState(false);

  const connect = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      await plannerApiRequest('/api/integrations/webdav/setup', {
        method: 'POST', body: JSON.stringify(form)
      });
      await refreshBootstrap({ silent: true });
      setForm(previous => ({ ...previous, password: '' }));
      showToast(t('webdav.toasts.connectedTitle'), t('webdav.toasts.connectedBody'), 'success');
    } catch (error) {
      showToast(t('webdav.toasts.connectFailedTitle'), error.message, 'error');
    } finally { setBusy(false); }
  };

  const test = async () => {
    setBusy(true);
    try {
      const data = await plannerApiRequest('/api/integrations/webdav/test', { method: 'POST' });
      showToast(t('webdav.toasts.testOkTitle'), data.message, 'success');
    } catch (error) {
      showToast(t('webdav.toasts.testFailedTitle'), error.message, 'error');
    } finally { setBusy(false); }
  };

  const disconnect = async () => {
    if (!window.confirm(t('webdav.disconnectConfirm'))) return;
    setBusy(true);
    try {
      await plannerApiRequest('/api/integrations/webdav', { method: 'DELETE' });
      await refreshBootstrap({ silent: true });
      showToast(t('webdav.toasts.disconnectedTitle'), t('webdav.toasts.disconnectedBody'), 'info');
    } catch (error) {
      showToast(t('webdav.toasts.disconnectFailedTitle'), error.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <section className="admin-panel nextcloud-settings-panel webdav-settings-panel">
      <header className="nextcloud-heading">
        <div className="nextcloud-orbit"><Cloud size={23} /></div>
        <div><span className="admin-section-kicker">{t('webdav.kicker')}</span><h2>{t('webdav.title')}</h2><p>{t('webdav.subtitle')}</p></div>
        <span className={`nextcloud-state ${existing?.connected ? 'online' : ''}`}>{existing?.connected ? t('webdav.statusConnected') : t('webdav.statusReady')}</span>
      </header>
      {existing?.connected ? (
        <div className="nextcloud-workspace">
          <div className="nextcloud-account-strip"><span className="nextcloud-account-mark"><Cloud size={18} /></span><div><small>{t('webdav.connectedWith')}</small><strong>{existing.displayName || t('webdav.displayNameFallback')}</strong><span>{t('webdav.accountMeta', { host: existing.host, folder: existing.folder })}</span></div></div>
          <div className="nextcloud-connected-actions"><button type="button" onClick={test} disabled={busy}>{busy ? <LoaderCircle className="spin" size={16} /> : <Link2 size={16} />} {t('webdav.testButton')}</button><button type="button" className="danger" onClick={disconnect} disabled={busy}><Trash2 size={16} /> {t('webdav.disconnectButton')}</button></div>
        </div>
      ) : (
        <form className="nextcloud-connect" onSubmit={connect}>
          <div className="nextcloud-security-note"><KeyRound size={18} /><p>{t('webdav.securityNote1')} {t('webdav.securityNote2')} <code>WEBDAV_ALLOW_PRIVATE_HOSTS=true</code></p></div>
          <div className="nextcloud-form-grid">
            <label><span>{t('webdav.addressLabel')}</span><input type="url" required value={form.baseUrl} onChange={event => setForm({ ...form, baseUrl: event.target.value })} placeholder="https://nas.example.de/dav/" /></label>
            <label><span>{t('webdav.folderLabel')}</span><input required value={form.folder} onChange={event => setForm({ ...form, folder: event.target.value })} placeholder="LX Family" /></label>
            <label><span>{t('webdav.usernameLabel')}</span><input required autoComplete="username" value={form.username} onChange={event => setForm({ ...form, username: event.target.value })} /></label>
            <label><span>{t('webdav.passwordLabel')}</span><input required type="password" autoComplete="current-password" value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} /></label>
          </div>
          <button className="nextcloud-connect-button" disabled={busy}>{busy ? <LoaderCircle className="spin" size={17} /> : <Link2 size={17} />} {t('webdav.connectButton')}</button>
        </form>
      )}
    </section>
  );
}
