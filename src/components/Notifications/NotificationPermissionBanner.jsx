import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BellRing, ShieldCheck, Sparkles, X } from 'lucide-react';
import { useFamily } from '../../context/FamilyContext';
import { isPetProfile } from '../../constants/roles';
import { isCapacitorNative } from '../../utils/apiConfig';
import { nativePushPermissionNeedsPrompt } from '../../hooks/useNativePushNotifications';

const SNOOZE_MS = 24 * 60 * 60 * 1000;

export default function NotificationPermissionBanner() {
  const { t } = useTranslation('notifications');
  const {
    activeMember,
    webPush,
    enableWebPush,
    nativePush,
    enableNativePush
  } = useFamily();
  const isNative = isCapacitorNative();
  const push = isNative ? nativePush : webPush;
  const enablePush = isNative ? enableNativePush : enableWebPush;
  const storageKey = `lx_push_banner_snooze_${activeMember?.id || 'profile'}`;
  const [snoozedUntil, setSnoozedUntil] = useState(
    () => Number(localStorage.getItem(storageKey) || 0)
  );
  useEffect(() => {
    setSnoozedUntil(Number(localStorage.getItem(storageKey) || 0));
  }, [storageKey]);
  const isChild = ['child', 'teen'].includes(activeMember?.role);
  const isPet = isPetProfile(activeMember);
  const alreadyConnected = Boolean(push.currentDeviceId);
  const canOffer =
    !isPet &&
    !push.loading &&
    push.supported &&
    (!isNative || push.serverConfigured) &&
    (['default', 'granted'].includes(push.permission) ||
      (isNative && nativePushPermissionNeedsPrompt(push.permission))) &&
    !alreadyConnected;
  const isSnoozed = snoozedUntil > Date.now();

  const copy = useMemo(
    () =>
      isChild
        ? {
            eyebrow: t('permissionBanner.child.eyebrow'),
            title: t('permissionBanner.child.title', {
              name: activeMember?.name || ''
            }),
            text: isNative
              ? t('permissionBanner.child.textNative')
              : t('permissionBanner.child.textWeb'),
            action: t('permissionBanner.child.action')
          }
        : {
            eyebrow: t('permissionBanner.adult.eyebrow'),
            title: isNative
              ? t('permissionBanner.adult.titleNative')
              : t('permissionBanner.adult.titleWeb'),
            text: isNative
              ? t('permissionBanner.adult.textNative')
              : t('permissionBanner.adult.textWeb'),
            action: t('permissionBanner.adult.action')
          },
    [activeMember?.name, isChild, isNative, t]
  );

  if (!canOffer || isSnoozed) return null;

  const snooze = () => {
    const until = Date.now() + SNOOZE_MS;
    localStorage.setItem(storageKey, String(until));
    setSnoozedUntil(until);
  };

  return (
    <aside className={`push-permission-banner ${isChild ? 'child' : ''}`}>
      <div className="push-banner-orbit" aria-hidden="true">
        <Sparkles size={15} />
      </div>
      <div className="push-banner-icon">
        <BellRing size={24} />
      </div>
      <div className="push-banner-copy">
        <span>{copy.eyebrow}</span>
        <strong>{copy.title}</strong>
        <p>{copy.text}</p>
        <small><ShieldCheck size={13} /> {t('permissionBanner.profileOnly', { name: activeMember?.name })}</small>
      </div>
      <div className="push-banner-actions">
        <button
          type="button"
          className="push-banner-enable"
          disabled={Boolean(push.busy)}
          onClick={() => enablePush()}
        >
          <BellRing size={17} />
          {push.busy === 'enable' ? t('permissionBanner.busy') : copy.action}
        </button>
        <button type="button" className="push-banner-later" onClick={snooze}>
          {t('permissionBanner.later')}
        </button>
      </div>
      <button
        type="button"
        className="push-banner-close"
        aria-label={t('permissionBanner.close')}
        onClick={snooze}
      >
        <X size={17} />
      </button>
    </aside>
  );
}
