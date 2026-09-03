import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { exportEventsToICS, parseICSContent } from '../utils/icsUtils';
import {
  canManageFamily,
  isPetProfile,
  isWallProfile
} from '../constants/roles';
import {
  currentBrowserSubscription,
  friendlyDeviceName,
  notificationPermission,
  subscribeBrowser,
  webPushCapability
} from '../hooks/useWebNotifications';
import {
  friendlyNativeDeviceName,
  nativeInstallationId,
  nativePushCapability,
  nativePushPermission,
  registerNativePush,
  unregisterNativePush,
  withNativePushTimeout
} from '../hooks/useNativePushNotifications';
import { APP_VERSION } from '../appVersion';
import {
  buildApiUrl,
  setStoredSessionToken,
  getStoredServerUrl,
  isCapacitorNative,
  plannerApiRequest
} from '../utils/apiConfig';
import i18n from '../i18n';
import { formatDateTime } from '../utils/formatting';
import { birthdayEventsForMembers } from '../../shared/birthdays.js';
import { expandCalendarEventSeries } from '../../shared/calendarRecurrence.js';
import { shoppingItemIcon } from '../../shared/shoppingItemIcons.js';
import {
  DEFAULT_PUBLIC_ACCESS,
  EMPTY_INTEGRATIONS,
  EMPTY_RESOURCES,
  initialNativePushState,
  initialWebPushState,
  resourceWithDefaults
} from './familyContextState';
import { applyThemePresentation } from './familyThemePresentation';
import { makeClientId } from './familyContextHelpers';
import { applyFamilyBootstrap } from './familyBootstrap';
import { useFamilyToast } from './useFamilyToast';
import { useFamilyNotifications } from './useFamilyNotifications';

const FamilyContext = createContext(null);

export const FUNNY_COMIC_AVATARS = [
  {
    id: 'av-1',
    name: 'Mutiger Löwe',
    url: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 'av-2',
    name: 'Schlauer Fuchs',
    url: 'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 'av-3',
    name: 'Abenteuer-Hund',
    url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 'av-4',
    name: 'Ninja-Katze',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 'av-5',
    name: 'Roter Panda',
    url: 'https://images.unsplash.com/photo-1625859043880-56acbcb6a6ac?auto=format&fit=crop&w=240&q=80'
  },
  {
    id: 'av-6',
    name: 'Weltraum-Buddy',
    url: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=240&q=80'
  }
];

const apiRequest = plannerApiRequest;
const makeId = makeClientId;

export function FamilyProvider({ children }) {
  const [authStatus, setAuthStatus] = useState('loading');
  const [activeTab, setActiveTabState] = useState('dashboard');
  // Verlauf der besuchten Tabs, damit Android Hardware-Back in der App
  // zurücknavigieren kann, statt sie sofort zu verlassen.
  const tabHistoryRef = useRef([]);
  const activeTabRef = useRef('dashboard');

  const setActiveTab = useCallback((nextTab, { recordHistory = true } = {}) => {
    setActiveTabState(prevTab => {
      const resolved = typeof nextTab === 'function' ? nextTab(prevTab) : nextTab;
      // Der React-State ist die maßgebliche Quelle. Der Ref ist nur für den
      // nativen Zurück-Stack da und kann während Bootstrapping/Deep-Links kurz
      // hinterherhinken. Ein Vergleich mit dem Ref ließ dann sichtbare
      // Navigationselemente ohne Wirkung zurück.
      if (resolved === prevTab) return prevTab;
      if (recordHistory) {
        tabHistoryRef.current.push(prevTab);
        if (tabHistoryRef.current.length > 64) {
          tabHistoryRef.current.shift();
        }
      }
      activeTabRef.current = resolved;
      return resolved;
    });
  }, []);

  const popTabHistory = useCallback(() => {
    const previous = tabHistoryRef.current.pop();
    if (!previous) return false;
    setActiveTabState(prevTab => {
      activeTabRef.current = previous;
      return previous;
    });
    return true;
  }, []);

  // Android: Hardware-Back / Wischgeste navigiert im Tab-Verlauf zurück, statt
  // die App sofort zu schließen. Nur am Verlaufsanfang wird die App verlassen.
  useEffect(() => {
    let listener;
    (async () => {
      try {
        const capacitor = await import('@capacitor/app');
        const App = capacitor.App;
        if (!App?.addListener) return;
        listener = await App.addListener('backButton', () => {
          if (popTabHistory()) return;
          App.exitApp();
        });
      } catch {
        // Kein Capacitor-Kontext (Browser/Desktop) – nichts zu tun.
      }
    })();
    return () => {
      if (listener?.remove) listener.remove();
    };
  }, [popTabHistory]);
  const [activeHouseholdState, setActiveHouseholdState] = useState(
    () => localStorage.getItem('lx_active_household') || 'familie'
  );
  const [familiesList, setFamiliesList] = useState([]);
  const [publicAccess, setPublicAccess] = useState(DEFAULT_PUBLIC_ACCESS);
  const [familyAccount, setFamilyAccount] = useState(null);
  const [members, setMembers] = useState([]);
  const [activeMemberIdState, setActiveMemberIdState] = useState('');
  const [resources, setResources] = useState(EMPTY_RESOURCES);
  const [calendarSubscriptions, setCalendarSubscriptions] = useState([]);
  const [familyRelationships, setFamilyRelationships] = useState([]);
  const [familyLetters, setFamilyLetters] = useState([]);
  const [familyChatGuests, setFamilyChatGuests] = useState([]);
  const [integrations, setIntegrations] = useState(EMPTY_INTEGRATIONS);
  const [readOnlyDemo, setReadOnlyDemo] = useState(false);
  const [appVersion, setAppVersion] = useState(APP_VERSION);
  const [releaseNotes, setReleaseNotes] = useState(null);
  const [homeAssistantEntities, setHomeAssistantEntities] = useState([]);
  const [homeAssistantLoading, setHomeAssistantLoading] = useState(false);
  const [webPush, setWebPush] = useState(initialWebPushState);
  const [nativePush, setNativePush] = useState(initialNativePushState);
  const [bringCatalog, setBringCatalog] = useState({
    sections: [],
    total: 0,
    source: 'loading'
  });
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('lx_theme') || 'light'
  );
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddDefaultType, setQuickAddDefaultType] = useState('event');
  const [quickAddEventPreset, setQuickAddEventPreset] = useState(null);
  const [isBringModalOpen, setIsBringModalOpen] = useState(false);
  const versionRef = useRef(0);
  const liveRefreshRef = useRef(false);

  const { toast, setToast, showToast } = useFamilyToast();
  const {
    markAllNotificationsRead,
    markNotificationRead,
    notifications,
    refreshNotifications,
    setNotifications,
    setUnreadNotificationCount,
    unreadNotificationCount
  } = useFamilyNotifications({
    activeMemberId: activeMemberIdState,
    authStatus,
    request: apiRequest,
    showToast,
    versionRef
  });

  const refreshPublicFamilies = useCallback(async () => {
    try {
      const data = await apiRequest('/api/public/families');
      setFamiliesList(data.families || []);
      setPublicAccess({
        directoryEnabled: Boolean(data.directoryEnabled),
        demo: data.demo || null,
        familyTransfer: {
          ...DEFAULT_PUBLIC_ACCESS.familyTransfer,
          ...(data.familyTransfer || {})
        },
        registration: {
          ...DEFAULT_PUBLIC_ACCESS.registration,
          ...(data.registration || {})
        }
      });
      return data.families || [];
    } catch (error) {
      showToast(
        i18n.t('context:toasts.connectionMissing.title'),
        error.message,
        'error'
      );
      return [];
    }
  }, [showToast]);

  const applyBootstrap = useCallback(data => {
    applyFamilyBootstrap(data, {
      appVersion: APP_VERSION,
      emptyIntegrations: EMPTY_INTEGRATIONS,
      setActiveMemberId: setActiveMemberIdState,
      setAppVersion,
      setCalendarSubscriptions,
      setFamilyAccount,
      setFamilyChatGuests,
      setFamilyLetters,
      setFamilyRelationships,
      setIntegrations,
      setMembers,
      setNativePush,
      setNotifications,
      setReadOnlyDemo,
      setReleaseNotes,
      setResources,
      setUnreadNotificationCount,
      resourceWithDefaults,
      versionRef
    });
  }, []);

  const refreshBootstrap = useCallback(async ({ silent = false } = {}) => {
    try {
      const data = await apiRequest('/api/bootstrap');
      applyBootstrap(data);
      setAuthStatus(data.activeMemberId ? 'authenticated' : 'profile-required');
      return data;
    } catch (error) {
      if (error.status === 401) {
        setAuthStatus('anonymous');
        setFamilyAccount(null);
        setMembers([]);
        setResources(EMPTY_RESOURCES);
        setCalendarSubscriptions([]);
        setFamilyRelationships([]);
        setFamilyLetters([]);
        setFamilyChatGuests([]);
        setNotifications([]);
        setUnreadNotificationCount(0);
        setIntegrations(EMPTY_INTEGRATIONS);
        setReadOnlyDemo(false);
        setReleaseNotes(null);
        setHomeAssistantEntities([]);
        setWebPush(initialWebPushState());
        setNativePush(initialNativePushState());
      } else if (!silent) {
        showToast(
          i18n.t('context:toasts.refreshFailed.title'),
          error.message,
          'error'
        );
      }
      return null;
    }
  }, [applyBootstrap, showToast]);

  const refreshHomeAssistantStates = useCallback(async ({
    silent = false
  } = {}) => {
    if (
      authStatus !== 'authenticated' ||
      !integrations.homeAssistant?.connected ||
      integrations.homeAssistant?.enabled === false
    ) {
      setHomeAssistantEntities([]);
      return [];
    }
    setHomeAssistantLoading(true);
    try {
      const data = await apiRequest(
        '/api/integrations/home-assistant/states'
      );
      setHomeAssistantEntities(data.entities || []);
      return data.entities || [];
    } catch (error) {
      if (!silent) {
        showToast(
          i18n.t('context:toasts.homeStatusUnreachable.title'),
          error.message,
          'warning'
        );
      }
      return [];
    } finally {
      setHomeAssistantLoading(false);
    }
  }, [
    authStatus,
    integrations.homeAssistant?.connected,
    integrations.homeAssistant?.enabled,
    showToast
  ]);

  useEffect(() => {
    let cancelled = false;
    const initialize = async () => {
      await refreshPublicFamilies();
      if (cancelled) return;
      await refreshBootstrap({ silent: true });
      if (cancelled) return;
      setAuthStatus(current => (current === 'loading' ? 'anonymous' : current));
    };
    initialize();
    return () => {
      cancelled = true;
    };
  }, [refreshBootstrap, refreshPublicFamilies]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return undefined;
    const checkVersion = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const data = await apiRequest('/api/family/version');
        if (Number(data.version) !== versionRef.current) {
          await refreshBootstrap({ silent: true });
        }
      } catch (error) {
        if (error.status === 401) setAuthStatus('anonymous');
      }
    };
    const interval = window.setInterval(checkVersion, 30_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') checkVersion();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [authStatus, refreshBootstrap]);

  const activeMember = useMemo(
    () =>
      members.find(member => member.id === activeMemberIdState) ||
      members[0] ||
      null,
    [activeMemberIdState, members]
  );
  const calendarEvents = useMemo(
    () => {
      const now = new Date();
      const rangeStart = new Date(now.getFullYear() - 1, 0, 1)
        .toISOString()
        .slice(0, 10);
      const rangeEnd = new Date(now.getFullYear() + 5, 11, 31)
        .toISOString()
        .slice(0, 10);
      return [
        ...expandCalendarEventSeries(resources.events, {
          rangeStart,
          rangeEnd,
          maxOccurrences: 12_000
        }),
        ...birthdayEventsForMembers(members, {
        startYear: new Date().getFullYear(),
          years: 5
        })
      ];
    },
    [members, resources.events]
  );

  const refreshWebPushStatus = useCallback(async ({ silent = false } = {}) => {
    const capability = webPushCapability();
    setWebPush(previous => ({
      ...previous,
      ...capability,
      permission: notificationPermission(),
      loading: !silent
    }));
    if (authStatus !== 'authenticated' || !activeMemberIdState) {
      setWebPush(previous => ({
        ...previous,
        loading: false,
        publicKey: '',
        currentDeviceId: '',
        devices: []
      }));
      return null;
    }
    try {
      let currentEndpoint = '';
      if (
        capability.supported &&
        notificationPermission() === 'granted'
      ) {
        try {
          currentEndpoint =
            (await currentBrowserSubscription())?.endpoint || '';
        } catch {
          currentEndpoint = '';
        }
      }
      const data = await apiRequest(
        `/api/push/status${
          currentEndpoint
            ? `?endpoint=${encodeURIComponent(currentEndpoint)}`
            : ''
        }`
      );
      setWebPush(previous => ({
        ...previous,
        ...capability,
        permission: notificationPermission(),
        loading: false,
        publicKey: data.publicKey || '',
        defaults: data.defaults || {},
        currentDeviceId: data.currentDeviceId || '',
        devices: data.devices || []
      }));
      return data;
    } catch (error) {
      setWebPush(previous => ({ ...previous, loading: false }));
      if (!silent) {
        showToast(
          i18n.t('context:toasts.webPushUnreachable.title'),
          error.message,
          'warning'
        );
      }
      return null;
    }
  }, [activeMemberIdState, authStatus, showToast]);

  useEffect(() => {
    if (authStatus !== 'authenticated' || !activeMemberIdState) return undefined;
    refreshWebPushStatus({ silent: true });
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshWebPushStatus({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [activeMemberIdState, authStatus, refreshWebPushStatus]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return undefined;
    if (getStoredServerUrl()) return undefined;
    const source = new EventSource(buildApiUrl('/api/live'), {
      withCredentials: false
    });
    const onFamilyUpdate = async event => {
      let nextVersion = 0;
      try {
        nextVersion = Number(JSON.parse(event.data)?.version || 0);
      } catch {
        nextVersion = 0;
      }
      if (
        !nextVersion ||
        nextVersion === versionRef.current ||
        liveRefreshRef.current
      ) {
        return;
      }
      liveRefreshRef.current = true;
      try {
        await refreshBootstrap({ silent: true });
      } finally {
        liveRefreshRef.current = false;
      }
    };
    const onHomeAssistantUpdate = () => {
      void refreshHomeAssistantStates({ silent: true });
    };
    source.addEventListener('family-update', onFamilyUpdate);
    source.addEventListener(
      'home-assistant-update',
      onHomeAssistantUpdate
    );
    return () => {
      source.removeEventListener('family-update', onFamilyUpdate);
      source.removeEventListener(
        'home-assistant-update',
        onHomeAssistantUpdate
      );
      source.close();
    };
  }, [authStatus, refreshBootstrap, refreshHomeAssistantStates]);

  useEffect(() => {
    if (
      authStatus !== 'authenticated' ||
      !integrations.homeAssistant?.connected ||
      integrations.homeAssistant?.enabled === false
    ) {
      setHomeAssistantEntities([]);
      return undefined;
    }
    void refreshHomeAssistantStates({ silent: true });
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') {
        void refreshHomeAssistantStates({ silent: true });
      }
    }, 45_000);
    return () => window.clearInterval(timer);
  }, [
    authStatus,
    integrations.homeAssistant?.connected,
    integrations.homeAssistant?.enabled,
    integrations.homeAssistant?.updatedAt,
    refreshHomeAssistantStates
  ]);

  useEffect(() => {
    const nextTheme = activeMember?.theme || theme || 'light';
    setThemeState(nextTheme);
    applyThemePresentation(nextTheme, activeMember?.customThemeCss || '');
    document.documentElement.setAttribute(
      'data-profile-mode',
      isPetProfile(activeMember)
        ? 'pet'
        : activeMember?.role === 'child'
          ? 'child'
          : 'adult'
    );
  }, [
    activeMember?.customThemeCss,
    activeMember?.id,
    activeMember?.role,
    activeMember?.theme
  ]);

  const setActiveHousehold = useCallback(value => {
    setActiveHouseholdState(value);
    localStorage.setItem('lx_active_household', value);
  }, []);

  useEffect(() => {
    if (
      familyAccount?.grandparentsHouseholdEnabled === false &&
      activeHouseholdState !== 'familie'
    ) {
      setActiveHouseholdState('familie');
      localStorage.setItem('lx_active_household', 'familie');
    }
  }, [
    activeHouseholdState,
    familyAccount?.grandparentsHouseholdEnabled
  ]);

  const loginFamily = useCallback(async (familyId, password) => {
    const data = await apiRequest('/api/auth/family', {
      method: 'POST',
      body: JSON.stringify({ familyId, password })
    });
    setFamilyAccount(data.family);
    setMembers(data.members || []);
    setActiveMemberIdState('');
    setAuthStatus('profile-required');
    return data;
  }, []);

  const selectMemberProfile = useCallback(async (
    memberId,
    pin = '',
    familyPassword = ''
  ) => {
    const data = await apiRequest('/api/auth/member', {
      method: 'POST',
      body: JSON.stringify({ memberId, pin, familyPassword })
    });
    setActiveTab(isWallProfile(data.member) ? 'kitchen' : 'dashboard', {
      recordHistory: false
    });
    setActiveMemberIdState(memberId);
    setMembers(previous =>
      previous.map(member => (member.id === memberId ? data.member : member))
    );
    localStorage.setItem('lx_active_member', memberId);
    setAuthStatus('authenticated');
    await refreshBootstrap({ silent: true });
    return data.member;
  }, [refreshBootstrap]);

  const registerFamily = useCallback(async payload => {
    const data = await apiRequest('/api/public/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setFamilyAccount(data.family);
    setMembers(data.members || []);
    setActiveMemberIdState(data.activeMemberId || '');
    setResources(EMPTY_RESOURCES);
    setFamilyRelationships([]);
    setNotifications([]);
    setUnreadNotificationCount(0);
    setIntegrations(EMPTY_INTEGRATIONS);
    setReadOnlyDemo(false);
    setReleaseNotes(null);
    setHomeAssistantEntities([]);
    setWebPush(initialWebPushState());
    setNativePush(initialNativePushState());
    setAuthStatus('authenticated');
    await refreshPublicFamilies();
    await refreshBootstrap({ silent: true });
    return data;
  }, [refreshBootstrap, refreshPublicFamilies]);

  const logout = useCallback(async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {
      // Local sign-out still succeeds if the server is temporarily unreachable.
    }
    setAuthStatus('anonymous');
    setFamilyAccount(null);
    setMembers([]);
    setActiveMemberIdState('');
    setResources(EMPTY_RESOURCES);
    setFamilyRelationships([]);
    setNotifications([]);
    setUnreadNotificationCount(0);
    setIntegrations(EMPTY_INTEGRATIONS);
    setReadOnlyDemo(false);
    setHomeAssistantEntities([]);
    setWebPush(initialWebPushState());
    setNativePush(initialNativePushState());
    setActiveTab('dashboard', { recordHistory: false });
    tabHistoryRef.current = [];
    activeTabRef.current = 'dashboard';
    setStoredSessionToken('');
    localStorage.removeItem('lx_active_member');
  }, []);

  const acknowledgeReleaseNotes = useCallback(async () => {
    if (!releaseNotes) return true;
    try {
      const data = await apiRequest('/api/release-notes/acknowledge', {
        method: 'POST'
      });
      if (data.member) {
        setMembers(previous =>
          previous.map(member =>
            member.id === data.member.id ? data.member : member
          )
        );
      }
      setReleaseNotes(null);
      return true;
    } catch (error) {
      showToast(
        i18n.t('context:toasts.releaseNotesNotSaved.title'),
        i18n.t('context:toasts.releaseNotesNotSaved.message'),
        'warning'
      );
      return false;
    }
  }, [releaseNotes, showToast]);

  const setTheme = useCallback(async nextTheme => {
    setThemeState(nextTheme);
    applyThemePresentation(nextTheme, activeMember?.customThemeCss || '');
    localStorage.setItem('lx_theme', nextTheme);
    if (!activeMember?.id) return;
    try {
      const data = await apiRequest(`/api/members/${activeMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ theme: nextTheme })
      });
      setMembers(previous =>
        previous.map(member => (member.id === data.member.id ? data.member : member))
      );
      versionRef.current = Number(data.version || versionRef.current);
    } catch (error) {
      showToast(
        i18n.t('context:toasts.themeNotSaved.title'),
        error.message,
        'error'
      );
    }
  }, [activeMember?.customThemeCss, activeMember?.id, showToast]);

  const previewCustomThemeCss = useCallback(css =>
    applyThemePresentation(CUSTOM_THEME_ID, css), []);

  const restoreCustomThemeCss = useCallback(() => {
    const savedTheme = activeMember?.theme || theme || 'light';
    return applyThemePresentation(
      savedTheme,
      activeMember?.customThemeCss || ''
    );
  }, [
    activeMember?.customThemeCss,
    activeMember?.theme,
    theme
  ]);

  const saveCustomThemeCss = useCallback(async css => {
    const validation = parseCustomThemeCss(css);
    if (!validation.valid || !activeMember?.id) return null;
    const nextTheme = validation.css ? CUSTOM_THEME_ID : 'linen';
    setThemeState(nextTheme);
    applyThemePresentation(nextTheme, validation.css);
    localStorage.setItem('lx_theme', nextTheme);
    try {
      const data = await apiRequest(`/api/members/${activeMember.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          customThemeCss: validation.css,
          theme: nextTheme
        })
      });
      setMembers(previous =>
        previous.map(member =>
          member.id === data.member.id ? data.member : member
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.customThemeSaved.title'),
        validation.css
          ? i18n.t('context:toasts.customThemeSaved.message')
          : i18n.t('context:toasts.customThemeSaved.resetMessage'),
        'success'
      );
      return data.member;
    } catch (error) {
      setThemeState(activeMember?.theme || theme || 'light');
      restoreCustomThemeCss();
      showToast(
        i18n.t('context:toasts.themeNotSaved.title'),
        error.message,
        'error'
      );
      return null;
    }
  }, [
    activeMember?.id,
    activeMember?.theme,
    restoreCustomThemeCss,
    showToast,
    theme
  ]);

  const updateResourceState = useCallback((type, record) => {
    setResources(previous => ({
      ...previous,
      [type]: previous[type].some(item => item.id === record.id)
        ? previous[type].map(item => (item.id === record.id ? record : item))
        : [record, ...previous[type]]
    }));
  }, []);

  const createResource = useCallback(async (type, record) => {
    const data = await apiRequest(`/api/resources/${type}`, {
      method: 'POST',
      body: JSON.stringify(record)
    });
    updateResourceState(type, data.record);
    versionRef.current = Number(data.version || versionRef.current);
    return data.record;
  }, [updateResourceState]);

  const patchResource = useCallback(async (type, id, changes) => {
    const data = await apiRequest(`/api/resources/${type}/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(changes)
    });
    updateResourceState(type, data.record);
    versionRef.current = Number(data.version || versionRef.current);
    return data.record;
  }, [updateResourceState]);

  const removeResource = useCallback(async (type, id) => {
    const data = await apiRequest(`/api/resources/${type}/${id}`, {
      method: 'DELETE'
    });
    setResources(previous => ({
      ...previous,
      [type]: previous[type].filter(item => item.id !== id)
    }));
    versionRef.current = Number(data.version || versionRef.current);
  }, []);

  const bulkCreateResources = useCallback(async (type, records) => {
    const data = await apiRequest(`/api/resources/${type}/bulk`, {
      method: 'POST',
      body: JSON.stringify({ records })
    });
    setResources(previous => ({
      ...previous,
      [type]: [...data.records, ...previous[type].filter(
        existing => !data.records.some(record => record.id === existing.id)
      )]
    }));
    versionRef.current = Number(data.version || versionRef.current);
    return data.records;
  }, []);

  const applyShoppingRecords = useCallback(data => {
    const records = Array.isArray(data?.records) ? data.records : [];
    setResources(previous => ({ ...previous, shoppingItems: records }));
    versionRef.current = Number(data?.version || versionRef.current);
    return records;
  }, []);

  const withActionError = useCallback(async (
    action,
    title = i18n.t('context:errors.changeFailed')
  ) => {
    try {
      return await action();
    } catch (error) {
      showToast(title, error.message, 'error');
      return null;
    }
  }, [showToast]);

  const enableWebPush = useCallback(async (preferences = {}) => {
    const capability = webPushCapability();
    if (!capability.supported) {
      showToast(
        i18n.t('context:toasts.webPushUnavailable.title'),
        capability.message,
        'warning'
      );
      return null;
    }
    setWebPush(previous => ({ ...previous, busy: 'enable' }));
    try {
      const status = webPush.publicKey
        ? webPush
        : await apiRequest('/api/push/status');
      const subscription = await subscribeBrowser(status.publicKey);
      const data = await apiRequest('/api/push/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName: friendlyDeviceName(),
          preferences: {
            ...(status.defaults || {}),
            ...preferences
          }
        })
      });
      setWebPush(previous => ({
        ...previous,
        ...capability,
        permission: notificationPermission(),
        busy: '',
        publicKey: status.publicKey,
        defaults: status.defaults || previous.defaults,
        currentDeviceId: data.device.id,
        devices: [
          data.device,
          ...previous.devices.filter(device => device.id !== data.device.id)
        ]
      }));
      showToast(
        i18n.t('context:toasts.webPushEnabled.title'),
        i18n.t('context:toasts.webPushEnabled.message', {
          name: activeMember?.name || i18n.t('context:defaults.you')
        }),
        'success'
      );
      return data.device;
    } catch (error) {
      setWebPush(previous => ({
        ...previous,
        permission: notificationPermission(),
        busy: ''
      }));
      showToast(
        i18n.t('context:toasts.activationFailed.title'),
        error.message,
        'warning'
      );
      return null;
    }
  }, [
    activeMember?.name,
    showToast,
    webPush.defaults,
    webPush.publicKey
  ]);

  const disableWebPush = useCallback(async () => {
    setWebPush(previous => ({ ...previous, busy: 'disable' }));
    try {
      const subscription = await currentBrowserSubscription();
      if (subscription) {
        const data = await apiRequest('/api/push/subscriptions', {
          method: 'DELETE',
          body: JSON.stringify({ endpoint: subscription.endpoint })
        });
        if (data.unsubscribeBrowser) {
          await subscription.unsubscribe();
        }
      }
      setWebPush(previous => ({
        ...previous,
        busy: '',
        currentDeviceId: '',
        devices: previous.devices.filter(
          device => device.id !== previous.currentDeviceId
        ),
        permission: notificationPermission()
      }));
      showToast(
        i18n.t('context:toasts.webPushDisabled.title'),
        i18n.t('context:toasts.webPushDisabled.message'),
        'info'
      );
      return true;
    } catch (error) {
      setWebPush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.disableFailed.title'),
        error.message,
        'warning'
      );
      return false;
    }
  }, [showToast]);

  const updateWebPushPreferences = useCallback(async preferences => {
    setWebPush(previous => ({ ...previous, busy: 'save' }));
    try {
      const subscription = await currentBrowserSubscription();
      if (!subscription) {
        throw new Error(i18n.t('context:errors.deviceNotRegistered'));
      }
      const currentDevice = webPush.devices.find(
        device => device.id === webPush.currentDeviceId
      );
      const data = await apiRequest('/api/push/subscriptions', {
        method: 'POST',
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          deviceName: currentDevice?.deviceName || friendlyDeviceName(),
          preferences: {
            ...webPush.defaults,
            ...(currentDevice?.preferences || {}),
            ...preferences
          }
        })
      });
      setWebPush(previous => ({
        ...previous,
        busy: '',
        currentDeviceId: data.device.id,
        devices: [
          data.device,
          ...previous.devices.filter(device => device.id !== data.device.id)
        ]
      }));
      showToast(
        i18n.t('context:toasts.notificationPrefsSaved.title'),
        i18n.t('context:toasts.webPushSaved.message'),
        'success'
      );
      return data.device;
    } catch (error) {
      setWebPush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.saveFailed.title'),
        error.message,
        'warning'
      );
      return null;
    }
  }, [
    showToast,
    webPush.currentDeviceId,
    webPush.defaults,
    webPush.devices
  ]);

  const testWebPush = useCallback(async () => {
    setWebPush(previous => ({ ...previous, busy: 'test' }));
    try {
      await apiRequest('/api/push/test', { method: 'POST' });
      setWebPush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.webPushTestSent.title'),
        i18n.t('context:toasts.webPushTestSent.message'),
        'success'
      );
      return true;
    } catch (error) {
      setWebPush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.testFailed.title'),
        error.message,
        'warning'
      );
      return false;
    }
  }, [showToast]);

  const refreshNativePushStatus = useCallback(async (
    { silent = false } = {}
  ) => {
    const capability = nativePushCapability();
    if (!capability.supported) {
      setNativePush(previous => ({
        ...previous,
        ...capability,
        permission: 'unsupported',
        loading: false
      }));
      return null;
    }
    setNativePush(previous => ({
      ...previous,
      ...capability,
      loading: !silent,
      statusError: ''
    }));
    if (authStatus !== 'authenticated' || !activeMemberIdState) {
      setNativePush(previous => ({
        ...previous,
        loading: false,
        currentDeviceId: '',
        devices: []
      }));
      return null;
    }
    try {
      let installationId = '';
      try {
        installationId = nativeInstallationId();
      } catch {
        installationId = '';
      }
      const statusQuery = installationId
        ? `?installationId=${encodeURIComponent(
            installationId
          )}&fresh=${Date.now()}`
        : `?fresh=${Date.now()}`;
      const [data, permissionResult] = await Promise.all([
        apiRequest(
          `/api/native-push/status${statusQuery}`,
          { cache: 'no-store' }
        ),
        nativePushPermission()
          .then(permission => ({ permission, error: '' }))
          .catch(error => ({
            permission: 'error',
            error:
              error?.message ||
              i18n.t('context:errors.androidPermissionReadFailed')
          }))
      ]);
      const permission = permissionResult.permission;
      const next = {
        ...data,
        permission,
        permissionError: permissionResult.error,
        serverConfigured: Boolean(data.server?.configured),
        serverReason: data.server?.reason || ''
      };
      setNativePush(previous => ({
        ...previous,
        ...capability,
        permission,
        permissionError: next.permissionError,
        loading: false,
        serverConfigured: next.serverConfigured,
        serverReason: next.serverReason,
        statusError: '',
        defaults: data.defaults || {},
        currentDeviceId: data.currentDeviceId || '',
        devices: data.devices || []
      }));
      return next;
    } catch (error) {
      setNativePush(previous => ({
        ...previous,
        loading: false,
        statusError:
          error?.message ||
          i18n.t('context:errors.androidPushStatusLoadFailed')
      }));
      if (!silent) {
        showToast(
          i18n.t('context:toasts.androidPushUnreachable.title'),
          error.message,
          'warning'
        );
      }
      return null;
    }
  }, [activeMemberIdState, authStatus, showToast]);

  const saveNativePushDevice = useCallback(async (
    token,
    preferences
  ) => {
    const data = await apiRequest('/api/native-push/devices', {
      method: 'POST',
      body: JSON.stringify({
        installationId: nativeInstallationId(),
        token,
        deviceName: friendlyNativeDeviceName(),
        appVersion: APP_VERSION,
        preferences
      })
    });
    setNativePush(previous => ({
      ...previous,
      currentDeviceId: data.device.id,
      devices: [
        data.device,
        ...previous.devices.filter(device => device.id !== data.device.id)
      ]
    }));
    return data.device;
  }, []);

  const enableNativePush = useCallback(async (preferences = {}) => {
    setNativePush(previous => ({
      ...previous,
      busy: 'enable',
      activationError: '',
      activationStep: 'server'
    }));
    try {
      const status = await withNativePushTimeout(
        nativePush.serverConfigured
          ? Promise.resolve(nativePush)
          : refreshNativePushStatus(),
        15_000,
        i18n.t('context:errors.pushCheckTimeout')
      );
      if (!status?.serverConfigured && !status?.server?.configured) {
        throw new Error(i18n.t('context:errors.fcmNotConfigured'));
      }
      const token = await registerNativePush({
        requestPermission: true,
        onStage: activationStep => {
          setNativePush(previous => ({ ...previous, activationStep }));
        }
      });
      setNativePush(previous => ({
        ...previous,
        activationStep: 'save'
      }));
      const device = await withNativePushTimeout(
        saveNativePushDevice(token, {
          ...(status.defaults || nativePush.defaults || {}),
          ...preferences
        }),
        15_000,
        i18n.t('context:errors.deviceKeySaveTimeout')
      );
      setNativePush(previous => ({
        ...previous,
        permission: 'granted',
        busy: '',
        activationError: '',
        activationStep: ''
      }));
      showToast(
        i18n.t('context:toasts.nativePushEnabled.title'),
        i18n.t('context:toasts.nativePushEnabled.message', {
          name: activeMember?.name || i18n.t('context:defaults.you')
        }),
        'success'
      );
      return device;
    } catch (error) {
      setNativePush(previous => ({
        ...previous,
        permission: error.permission || previous.permission,
        busy: '',
        activationError:
          error?.message ||
          i18n.t('context:errors.androidPushActivationFailed'),
        activationStep: ''
      }));
      showToast(
        i18n.t('context:toasts.activationFailed.title'),
        error.message,
        'warning'
      );
      return null;
    }
  }, [
    activeMember?.name,
    nativePush,
    refreshNativePushStatus,
    saveNativePushDevice,
    showToast
  ]);

  const disableNativePush = useCallback(async () => {
    setNativePush(previous => ({ ...previous, busy: 'disable' }));
    try {
      const data = await apiRequest('/api/native-push/devices', {
        method: 'DELETE',
        body: JSON.stringify({
          installationId: nativeInstallationId()
        })
      });
      if (data.unregisterApp) {
        await unregisterNativePush();
      }
      setNativePush(previous => ({
        ...previous,
        busy: '',
        currentDeviceId: '',
        devices: previous.devices.filter(
          device => device.id !== previous.currentDeviceId
        )
      }));
      showToast(
        i18n.t('context:toasts.nativePushDisabled.title'),
        i18n.t('context:toasts.nativePushDisabled.message', {
          name: activeMember?.name || i18n.t('context:defaults.thisProfile')
        }),
        'info'
      );
      return true;
    } catch (error) {
      setNativePush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.disableFailed.title'),
        error.message,
        'warning'
      );
      return false;
    }
  }, [activeMember?.name, showToast]);

  const updateNativePushPreferences = useCallback(async preferences => {
    setNativePush(previous => ({ ...previous, busy: 'save' }));
    try {
      if (!nativePush.currentDeviceId) {
        throw new Error(i18n.t('context:errors.appNotRegistered'));
      }
      const currentDevice = nativePush.devices.find(
        device => device.id === nativePush.currentDeviceId
      );
      const token = await registerNativePush();
      const device = await saveNativePushDevice(token, {
        ...nativePush.defaults,
        ...(currentDevice?.preferences || {}),
        ...preferences
      });
      setNativePush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.nativePushSaved.title'),
        i18n.t('context:toasts.nativePushSaved.message'),
        'success'
      );
      return device;
    } catch (error) {
      setNativePush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.saveFailed.title'),
        error.message,
        'warning'
      );
      return null;
    }
  }, [
    nativePush.currentDeviceId,
    nativePush.defaults,
    nativePush.devices,
    saveNativePushDevice,
    showToast
  ]);

  const testNativePush = useCallback(async () => {
    setNativePush(previous => ({ ...previous, busy: 'test' }));
    try {
      await apiRequest('/api/native-push/test', {
        method: 'POST',
        body: JSON.stringify({
          installationId: nativeInstallationId()
        })
      });
      setNativePush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.nativePushTestSent.title'),
        i18n.t('context:toasts.nativePushTestSent.message'),
        'success'
      );
      return true;
    } catch (error) {
      setNativePush(previous => ({ ...previous, busy: '' }));
      showToast(
        i18n.t('context:toasts.nativeTestFailed.title'),
        error.message,
        'warning'
      );
      return false;
    }
  }, [showToast]);

  useEffect(() => {
    if (
      !isCapacitorNative() ||
      authStatus !== 'authenticated' ||
      !activeMemberIdState
    ) {
      return undefined;
    }
    let cancelled = false;
    const restoreNativePush = async () => {
      const status = await refreshNativePushStatus({ silent: true });
      if (
        cancelled ||
        !status?.serverConfigured ||
        status.permission !== 'granted' ||
        !status.currentDeviceId
      ) {
        return;
      }
      try {
        const currentDevice = status.devices.find(
          device => device.id === status.currentDeviceId
        );
        const token = await registerNativePush();
        if (cancelled) return;
        await saveNativePushDevice(
          token,
          currentDevice?.preferences || status.defaults
        );
      } catch {
        // Die bestehende Einstellung bleibt erhalten; die UI zeigt den Status.
      }
    };
    restoreNativePush();
    return () => {
      cancelled = true;
    };
  }, [
    activeMemberIdState,
    authStatus,
    refreshNativePushStatus,
    saveNativePushDevice
  ]);

  const fetchPushDevices = useCallback(async () => {
    const data = await apiRequest('/api/push/devices');
    return data.devices || [];
  }, []);

  const removePushDevice = useCallback(async deviceId => {
    await apiRequest(`/api/push/devices/${deviceId}`, { method: 'DELETE' });
    setWebPush(previous => ({
      ...previous,
      currentDeviceId:
        previous.currentDeviceId === deviceId ? '' : previous.currentDeviceId,
      devices: previous.devices.filter(device => device.id !== deviceId)
    }));
    setNativePush(previous => ({
      ...previous,
      currentDeviceId:
        previous.currentDeviceId === deviceId ? '' : previous.currentDeviceId,
      devices: previous.devices.filter(device => device.id !== deviceId)
    }));
    showToast(
      i18n.t('context:toasts.deviceRemoved.title'),
      i18n.t('context:toasts.deviceRemoved.message'),
      'info'
    );
    return true;
  }, [showToast]);

  const addCalendarSubscription = useCallback(subscription =>
    withActionError(async () => {
      const data = await apiRequest('/api/calendar/subscriptions', {
        method: 'POST',
        body: JSON.stringify(subscription)
      });
      await refreshBootstrap({ silent: true });
      if (data.warning) {
        showToast(
          i18n.t('context:toasts.calendarSourceSaved.title'),
          i18n.t('context:toasts.calendarSourceSaved.warningMessage', {
            warning: data.warning
          }),
          'warning'
        );
      } else {
        showToast(
          i18n.t('context:toasts.calendarConnected.title'),
          i18n.t('context:toasts.calendarConnected.message', {
            name: data.subscription.name,
            count: data.records.length
          }),
          'success'
        );
      }
      return data.subscription;
    }, i18n.t('context:errors.calendarConnectFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const updateCalendarSubscription = useCallback((subscriptionId, changes) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/calendar/subscriptions/${subscriptionId}`,
        {
          method: 'PATCH',
          body: JSON.stringify(changes)
        }
      );
      await refreshBootstrap({ silent: true });
      showToast(
        data.warning
          ? i18n.t('context:toasts.calendarSaved.title')
          : i18n.t('context:toasts.calendarUpdated.title'),
        data.warning || i18n.t('context:toasts.calendarUpdated.message'),
        data.warning ? 'warning' : 'success'
      );
      return data.subscription;
    }, i18n.t('context:errors.calendarUpdateFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const syncCalendarSubscription = useCallback(subscriptionId =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/calendar/subscriptions/${subscriptionId}/sync`,
        { method: 'POST' }
      );
      await refreshBootstrap({ silent: true });
      showToast(
        i18n.t('context:toasts.calendarSynced.title'),
        i18n.t('context:toasts.calendarSynced.message', {
          count: data.records.length
        }),
        'success'
      );
      return data.subscription;
    }, i18n.t('context:errors.calendarSyncFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const syncAllCalendarSubscriptions = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/calendar/subscriptions/sync-all',
        { method: 'POST' }
      );
      await refreshBootstrap({ silent: true });
      const failed = data.results.filter(result => !result.success).length;
      showToast(
        failed
          ? i18n.t('context:toasts.calendarSyncPartial.title')
          : i18n.t('context:toasts.calendarSyncAll.title'),
        failed
          ? i18n.t('context:toasts.calendarSyncPartial.message', {
              count: failed
            })
          : i18n.t('context:toasts.calendarSyncAll.message', {
              count: data.results.length
            }),
        failed ? 'warning' : 'success'
      );
      return data.results;
    }, i18n.t('context:errors.calendarsSyncFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const deleteCalendarSubscription = useCallback(subscriptionId =>
    withActionError(async () => {
      await apiRequest(
        `/api/calendar/subscriptions/${subscriptionId}`,
        { method: 'DELETE' }
      );
      await refreshBootstrap({ silent: true });
      showToast(
        i18n.t('context:toasts.calendarSourceRemoved.title'),
        i18n.t('context:toasts.calendarSourceRemoved.message'),
        'info'
      );
      return true;
    }, i18n.t('context:errors.calendarSourceRemoveFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const addEvent = useCallback(eventData =>
    withActionError(async () => {
      const recipientFamilyIds = Array.isArray(eventData.recipientFamilyIds)
        ? eventData.recipientFamilyIds
        : [];
      if (recipientFamilyIds.length) {
        const data = await apiRequest('/api/family/shared-events', {
          method: 'POST',
          body: JSON.stringify({
            id: makeId('shared-event'),
            household: 'familie',
            ...eventData,
            recipientFamilyIds
          })
        });
        await refreshBootstrap({ silent: true });
        showToast(
          i18n.t('context:toasts.sharedEventCreated.title'),
          i18n.t('context:toasts.sharedEventCreated.message', {
            title: data.event.title
          }),
          'success'
        );
        return data.event;
      }
      const event = await createResource('events', {
        id: makeId('evt'),
        household: activeHouseholdState,
        ...eventData
      });
      showToast(
        i18n.t('context:toasts.eventAdded.title'),
        i18n.t('context:toasts.eventAdded.message', { title: event.title }),
        'success'
      );
      return event;
    }), [
      activeHouseholdState,
      createResource,
      refreshBootstrap,
      showToast,
      withActionError
    ]);

  const updateEvent = useCallback((eventOrId, changes) =>
    withActionError(async () => {
      const sourceEvent =
        typeof eventOrId === 'object'
          ? eventOrId
          : resources.events.find(event => event.id === eventOrId);
      let event;
      if (sourceEvent?.sharedEventId) {
        const data = await apiRequest(
          `/api/family/shared-events/${sourceEvent.sharedEventId}`,
          {
            method: 'PATCH',
            body: JSON.stringify(changes)
          }
        );
        await refreshBootstrap({ silent: true });
        event = data.event;
      } else {
        const eventId =
          typeof eventOrId === 'object'
            ? (eventOrId.seriesId || eventOrId.id)
            : eventOrId;
        event = await patchResource('events', eventId, changes);
      }
      const reminderOnly = Object.keys(changes || {}).every(
        key => key === 'reminders'
      );
      showToast(
        i18n.t(
          reminderOnly
            ? 'context:toasts.eventRemindersSaved.title'
            : 'context:toasts.eventUpdated.title'
        ),
        reminderOnly && event.reminders?.length
          ? i18n.t('context:toasts.eventRemindersSaved.enabledMessage', {
              title: event.title,
              count: event.reminders.length
            })
          : reminderOnly
            ? i18n.t('context:toasts.eventRemindersSaved.disabledMessage', {
                title: event.title
              })
            : i18n.t('context:toasts.eventUpdated.message', {
                title: event.title
              }),
        'success'
      );
      return event;
    }, i18n.t('context:errors.eventSaveFailed')), [
    patchResource,
    refreshBootstrap,
    resources.events,
    showToast,
    withActionError
  ]);

  const deleteEvent = useCallback(eventId =>
    withActionError(async () => {
      const resolvedId = typeof eventId === 'object'
        ? (eventId.seriesId || eventId.id)
        : eventId;
      const event = resources.events.find(item => item.id === resolvedId);
      if (event?.sharedEventId) {
        await apiRequest(
          `/api/family/shared-events/${event.sharedEventId}`,
          { method: 'DELETE' }
        );
        await refreshBootstrap({ silent: true });
        showToast(
          i18n.t('context:toasts.sharedEventDeleted.title'),
          i18n.t('context:toasts.sharedEventDeleted.message'),
          'info'
        );
        return;
      }
      await removeResource('events', resolvedId);
      showToast(
        i18n.t('context:toasts.eventDeleted.title'),
        i18n.t('context:toasts.eventDeleted.message'),
        'info'
      );
    }), [
      refreshBootstrap,
      removeResource,
      resources.events,
      showToast,
      withActionError
    ]);

  const importICS = useCallback(file => {
    const reader = new FileReader();
    reader.onload = async event => {
      const parsed = parseICSContent(event.target.result);
      if (!parsed.length) {
        showToast(
          i18n.t('context:toasts.icsImportFailed.title'),
          i18n.t('context:toasts.icsImportFailed.message'),
          'warning'
        );
        return;
      }
      await withActionError(async () => {
        const records = parsed.map(item => ({
          ...item,
          id: item.id || makeId('evt'),
          household: activeHouseholdState
        }));
        await bulkCreateResources('events', records);
        showToast(
          i18n.t('context:toasts.icsImported.title'),
          i18n.t('context:toasts.icsImported.message', {
            count: records.length
          }),
          'success'
        );
      });
    };
    reader.readAsText(file);
  }, [activeHouseholdState, bulkCreateResources, showToast, withActionError]);

  const exportICS = useCallback(() => {
    exportEventsToICS(
      calendarEvents,
      familyAccount?.familyName || i18n.t('context:defaults.familyName')
    );
    showToast(
      i18n.t('context:toasts.icsExported.title'),
      i18n.t('context:toasts.icsExported.message'),
      'info'
    );
  }, [calendarEvents, familyAccount?.familyName, showToast]);

  const addShoppingItem = useCallback(item =>
    withActionError(async () => {
      if (integrations.bring?.connected) {
        const data = await apiRequest('/api/integrations/bring/items', {
          method: 'POST',
          body: JSON.stringify({
            name: item.name,
            specification: item.quantity || ''
          })
        });
        const records = applyShoppingRecords(data);
        showToast(
          i18n.t('context:toasts.bringAdded.title'),
          i18n.t('context:toasts.bringAdded.itemMessage', {
            name: item.name
          }),
          'success'
        );
        return records.find(
          record =>
            record.name.toLocaleLowerCase('de-DE') ===
            item.name.toLocaleLowerCase('de-DE')
        );
      }

      const record = await createResource('shoppingItems', {
        id: makeId('shop'),
        category: 'Vorräte',
        icon: shoppingItemIcon(item.name),
        quantity: i18n.t('context:defaults.shoppingQuantity'),
        isSelected: true,
        inCart: false,
        household: activeHouseholdState,
        ...item
      });
      showToast(
        i18n.t('context:toasts.shoppingItemAdded.title'),
        i18n.t('context:toasts.shoppingItemAdded.message', {
          name: record.name
        }),
        'success'
      );
      return record;
    }, i18n.t('context:errors.shoppingItemAddFailed')), [
      activeHouseholdState,
      applyShoppingRecords,
      createResource,
      integrations.bring?.connected,
      showToast,
      withActionError
    ]);

  const toggleShoppingSelected = useCallback(itemId => {
    const item = resources.shoppingItems.find(entry => entry.id === itemId);
    if (!item) return null;
    return withActionError(() =>
      patchResource('shoppingItems', itemId, {
        isSelected: !item.isSelected,
        inCart: false
      })
    );
  }, [patchResource, resources.shoppingItems, withActionError]);

  const toggleShoppingInCart = useCallback((itemId, event) => {
    event?.stopPropagation();
    const item = resources.shoppingItems.find(entry => entry.id === itemId);
    if (!item) return null;
    if (item.source === 'bring' && integrations.bring?.connected) {
      return withActionError(async () => {
        const data = await apiRequest('/api/integrations/bring/items/toggle', {
          method: 'POST',
          body: JSON.stringify({
            name: item.name,
            specification: item.quantity,
            inCart: !item.inCart
          })
        });
        const records = applyShoppingRecords(data);
        return records.find(
          record =>
            record.name.toLocaleLowerCase('de-DE') ===
            item.name.toLocaleLowerCase('de-DE')
        );
      }, i18n.t('context:errors.bringItemUpdateFailed'));
    }
    return withActionError(() =>
      patchResource('shoppingItems', itemId, { inCart: !item.inCart })
    );
  }, [
    applyShoppingRecords,
    integrations.bring?.connected,
    patchResource,
    resources.shoppingItems,
    withActionError
  ]);

  const setRawShoppingItems = useCallback(updater => {
    const current = resources.shoppingItems;
    const next = typeof updater === 'function' ? updater(current) : updater;
    if (!Array.isArray(next)) return;
    setResources(previous => ({ ...previous, shoppingItems: next }));
    const changed = next.filter(item => {
      const before = current.find(existing => existing.id === item.id);
      return before && JSON.stringify(before) !== JSON.stringify(item);
    });
    Promise.all(
      changed.map(item => patchResource('shoppingItems', item.id, item))
    ).catch(error => {
      showToast(
        i18n.t('context:toasts.shoppingListNotSaved.title'),
        error.message,
        'error'
      );
      refreshBootstrap({ silent: true });
    });
  }, [patchResource, refreshBootstrap, resources.shoppingItems, showToast]);

  const addMealIngredientsToShopping = useCallback(async ingredients => {
    const cleanIngredients = (ingredients || []).filter(Boolean);
    if (!cleanIngredients.length) return;

    if (integrations.bring?.connected) {
      await withActionError(async () => {
        const data = await apiRequest('/api/integrations/bring/items', {
          method: 'POST',
          body: JSON.stringify({
            items: cleanIngredients.map(name => ({
              name,
              specification: '1x'
            }))
          })
        });
        applyShoppingRecords(data);
        showToast(
          i18n.t('context:toasts.bringAdded.title'),
          i18n.t('context:toasts.bringAdded.ingredientsMessage', {
            count: data.added
          }),
          'success'
        );
      }, i18n.t('context:errors.bringIngredientsTransferFailed'));
      return;
    }

    const records = cleanIngredients.map(name => ({
      id: makeId('shop'),
      name,
      category: 'Vorräte',
      icon: shoppingItemIcon(name, '🥘'),
      quantity: '1x',
      isSelected: true,
      inCart: false,
      household: activeHouseholdState
    }));
    if (!records.length) return;
    await withActionError(async () => {
      await bulkCreateResources('shoppingItems', records);
      showToast(
        i18n.t('context:toasts.ingredientsAdded.title'),
        i18n.t('context:toasts.ingredientsAdded.message', {
          count: records.length
        }),
        'success'
      );
    });
  }, [
    activeHouseholdState,
    applyShoppingRecords,
    bulkCreateResources,
    integrations.bring?.connected,
    showToast,
    withActionError
  ]);

  const addRecipe = useCallback(recipe =>
    withActionError(async () => {
      const created = await createResource('savedRecipes', {
        id: makeId('recipe'),
        image:
          'https://images.unsplash.com/photo-1498837167922-ddd27525d352?auto=format&fit=crop&w=900&q=80',
        servings: i18n.t('context:defaults.recipeServings'),
        household: activeHouseholdState,
        ...recipe
      });
      showToast(
        i18n.t('context:toasts.recipeSaved.title'),
        i18n.t('context:toasts.recipeSaved.message', {
          name: created.name || created.title
        }),
        'success'
      );
      return created;
    }), [activeHouseholdState, createResource, showToast, withActionError]);

  const updateRecipe = useCallback((recipeId, changes) =>
    withActionError(async () => {
      const updated = await patchResource(
        'savedRecipes',
        recipeId,
        changes
      );
      showToast(
        i18n.t('context:toasts.recipeUpdated.title'),
        i18n.t('context:toasts.recipeUpdated.message', {
          name: updated.name || updated.title
        }),
        'success'
      );
      return updated;
    }), [patchResource, showToast, withActionError]);

  const deleteRecipe = useCallback(recipeId =>
    withActionError(async () => {
      await removeResource('savedRecipes', recipeId);
      showToast(
        i18n.t('context:toasts.recipeDeleted.title'),
        i18n.t('context:toasts.recipeDeleted.message'),
        'info'
      );
    }), [removeResource, showToast, withActionError]);

  const toggleTask = useCallback(taskId =>
    withActionError(async () => {
      const data = await apiRequest(`/api/tasks/${taskId}/toggle`, {
        method: 'POST'
      });
      updateResourceState('tasks', data.task);
      if (data.nextTask) {
        updateResourceState('tasks', data.nextTask);
      }
      if (data.removedNextTaskId) {
        setResources(previous => ({
          ...previous,
          tasks: previous.tasks.filter(
            task => task.id !== data.removedNextTaskId
          )
        }));
      }
      if (data.member) {
        setMembers(previous =>
          previous.map(member =>
            member.id === data.member.id ? data.member : member
          )
        );
      }
      versionRef.current = Number(data.version || versionRef.current);
      if (data.action === 'approval_requested') {
        showToast(
          i18n.t('context:toasts.taskSentForReview.title'),
          i18n.t('context:toasts.taskSentForReview.message', {
            title: data.task.title,
            name:
              data.task.createdByName || i18n.t('context:defaults.aParent')
          }),
          'success'
        );
      } else if (data.action === 'approval_cancelled') {
        showToast(
          i18n.t('context:toasts.taskReportWithdrawn.title'),
          i18n.t('context:toasts.taskReportWithdrawn.message', {
            title: data.task.title
          }),
          'info'
        );
      } else if (data.task.completed) {
        showToast(
          i18n.t('context:toasts.starsEarned.title'),
          data.nextTask
            ? i18n.t('context:toasts.starsEarned.nextMessage', {
                stars: data.task.stars || 10,
                date: data.nextTask.dueDate
              })
            : i18n.t('context:toasts.starsEarned.message', {
                stars: data.task.stars || 10,
                title: data.task.title
              }),
          'star'
        );
      }
      return data.task;
    }), [showToast, updateResourceState, withActionError]);

  const completeTaskAs = useCallback((taskId, memberId) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/tasks/${taskId}/complete-as`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
      });
      updateResourceState('tasks', data.task);
      if (data.nextTask) {
        updateResourceState('tasks', data.nextTask);
      }
      if (data.member) {
        setMembers(previous =>
          previous.map(member =>
            member.id === data.member.id ? data.member : member
          )
        );
      }
      versionRef.current = Number(data.version || versionRef.current);
      if (data.action === 'approval_requested') {
        showToast(
          i18n.t('context:toasts.taskSentForReview.title'),
          i18n.t('context:toasts.taskSentForReview.message', {
            title: data.task.title,
            name:
              data.task.createdByName || i18n.t('context:defaults.aParent')
          }),
          'success'
        );
      } else if (data.task.completed) {
        showToast(
          i18n.t('context:toasts.starsEarned.title'),
          i18n.t('context:toasts.starsEarned.message', {
            stars: data.task.stars || 10,
            title: data.task.title
          }),
          'star'
        );
      }
      return data.task;
    }), [showToast, updateResourceState, withActionError]);

  const reviewTask = useCallback((taskId, approved) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/tasks/${taskId}/review`, {
        method: 'POST',
        body: JSON.stringify({ approved })
      });
      updateResourceState('tasks', data.task);
      if (data.nextTask) {
        updateResourceState('tasks', data.nextTask);
      }
      if (data.member) {
        setMembers(previous =>
          previous.map(member =>
            member.id === data.member.id ? data.member : member
          )
        );
      }
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        approved
          ? i18n.t('context:toasts.taskApproved.title')
          : i18n.t('context:toasts.taskRejected.title'),
        approved
          ? data.nextTask
            ? i18n.t('context:toasts.taskApproved.nextMessage', {
                title: data.task.title
              })
            : i18n.t('context:toasts.taskApproved.message', {
                title: data.task.title
              })
          : i18n.t('context:toasts.taskRejected.message', {
              title: data.task.title
            }),
        approved ? 'star' : 'info'
      );
      return data.task;
    }), [showToast, updateResourceState, withActionError]);

  const addTask = useCallback(task =>
    withActionError(async () => {
      const created = await createResource('tasks', {
        id: makeId('task'),
        completed: false,
        household: activeHouseholdState,
        stars: 10,
        ...task
      });
      showToast(
        i18n.t('context:toasts.taskCreated.title'),
        i18n.t('context:toasts.taskCreated.message', {
          title: created.title
        }),
        'success'
      );
      return created;
    }), [activeHouseholdState, createResource, showToast, withActionError]);

  const updateTask = useCallback((taskId, changes) =>
    withActionError(async () => {
      const updated = await patchResource('tasks', taskId, changes);
      showToast(
        i18n.t('context:toasts.taskUpdated.title'),
        i18n.t('context:toasts.taskUpdated.message', {
          title: updated.title
        }),
        'success'
      );
      return updated;
    }), [patchResource, showToast, withActionError]);

  const deleteTask = useCallback(taskId =>
    withActionError(async () => {
      await removeResource('tasks', taskId);
      showToast(
        i18n.t('context:toasts.taskDeleted.title'),
        i18n.t('context:toasts.taskDeleted.message'),
        'info'
      );
      return true;
    }), [removeResource, showToast, withActionError]);

  const addReward = useCallback(reward =>
    withActionError(async () => {
      const created = await createResource('rewards', {
        id: makeId('reward'),
        household: activeHouseholdState,
        forMemberId: 'all',
        ...reward
      });
      showToast(
        i18n.t('context:toasts.rewardCreated.title'),
        i18n.t('context:toasts.rewardCreated.message', {
          title: created.title
        }),
        'success'
      );
      return created;
    }), [activeHouseholdState, createResource, showToast, withActionError]);

  const updateReward = useCallback((rewardId, changes) =>
    withActionError(async () => {
      const reward = await patchResource('rewards', rewardId, changes);
      showToast(
        i18n.t('context:toasts.rewardUpdated.title'),
        i18n.t('context:shared.changeSaved'),
        'info'
      );
      return reward;
    }), [patchResource, showToast, withActionError]);

  const deleteReward = useCallback(rewardId =>
    withActionError(async () => {
      await removeResource('rewards', rewardId);
      showToast(
        i18n.t('context:toasts.rewardDeleted.title'),
        i18n.t('context:toasts.rewardDeleted.message'),
        'info'
      );
    }), [removeResource, showToast, withActionError]);

  const redeemReward = useCallback((reward, memberId) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/rewards/${reward.id}/redeem`, {
        method: 'POST',
        body: JSON.stringify({ memberId })
      });
      setMembers(previous =>
        previous.map(member =>
          member.id === data.member.id ? data.member : member
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.rewardRedeemed.title'),
        i18n.t('context:toasts.rewardRedeemed.message', {
          title: reward.title
        }),
        'star'
      );
      return data;
    }, i18n.t('context:errors.redeemFailed')), [showToast, withActionError]);

  const updateMeal = useCallback((day, mealType, recipe, ingredients = []) =>
    withActionError(async () => {
      const existing = resources.meals.find(
        meal =>
          meal.day === day &&
          meal.meal === mealType &&
          (meal.household || 'familie') === activeHouseholdState
      );
      const meal = existing
        ? await patchResource('meals', existing.id, { recipe, ingredients })
        : await createResource('meals', {
            id: makeId('meal'),
            day,
            meal: mealType,
            recipe,
            ingredients,
            household: activeHouseholdState
          });
      showToast(
        i18n.t('context:toasts.mealPlanUpdated.title'),
        i18n.t('context:toasts.mealPlanUpdated.message', { recipe }),
        'success'
      );
      return meal;
    }), [
      activeHouseholdState,
      createResource,
      patchResource,
      resources.meals,
      showToast,
      withActionError
    ]);

  const deleteMeal = useCallback(mealId =>
    withActionError(async () => {
      await removeResource('meals', mealId);
      showToast(
        i18n.t('context:toasts.mealRemoved.title'),
        i18n.t('context:toasts.mealRemoved.message'),
        'info'
      );
      return true;
    }), [removeResource, showToast, withActionError]);

  const addNote = useCallback(note =>
    withActionError(async () => {
      const now = formatDateTime(new Date(), {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
      const created = await createResource('notes', {
        id: makeId('note'),
        color: '#fef08a',
        createdBy: activeMember?.name || i18n.t('context:defaults.familyAuthor'),
        createdAt: now,
        updatedBy: activeMember?.name || i18n.t('context:defaults.familyAuthor'),
        updatedAt: now,
        household: activeHouseholdState,
        isShared: false,
        photo: null,
        ...note
      });
      showToast(
        i18n.t('context:toasts.noteAdded.title'),
        i18n.t('context:toasts.noteAdded.message', { title: created.title }),
        'success'
      );
      return created;
    }), [
      activeHouseholdState,
      activeMember?.name,
      createResource,
      showToast,
      withActionError
    ]);

  const updateNote = useCallback((noteId, changes) =>
    withActionError(async () => {
      const note = await patchResource('notes', noteId, {
        ...changes,
        updatedBy: activeMember?.name || i18n.t('context:defaults.familyAuthor'),
        updatedAt: formatDateTime(new Date())
      });
      showToast(
        i18n.t('context:toasts.noteUpdated.title'),
        i18n.t('context:shared.changeSaved'),
        'info'
      );
      return note;
    }), [activeMember?.name, patchResource, showToast, withActionError]);

  const deleteNote = useCallback(noteId =>
    withActionError(async () => {
      await removeResource('notes', noteId);
      showToast(
        i18n.t('context:toasts.noteDeleted.title'),
        i18n.t('context:toasts.noteDeleted.message'),
        'info'
      );
    }), [removeResource, showToast, withActionError]);

  const addMember = useCallback(member =>
    withActionError(async () => {
      const data = await apiRequest('/api/members', {
        method: 'POST',
        body: JSON.stringify(member)
      });
      setMembers(previous => [...previous, data.member]);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.memberAdded.title'),
        i18n.t('context:toasts.memberAdded.message', {
          name: data.member.name
        }),
        'success'
      );
      return data.member;
    }), [showToast, withActionError]);

  const updateMember = useCallback((memberId, changes) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/members/${memberId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setMembers(previous =>
        previous.map(member =>
          member.id === data.member.id ? data.member : member
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      return data.member;
    }), [withActionError]);

  const resetMemberStars = useCallback(memberId =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/admin/members/${memberId}/reset-stars`,
        { method: 'POST' }
      );
      setMembers(previous =>
        previous.map(member =>
          member.id === data.member.id ? data.member : member
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.starsReset.title'),
        i18n.t('context:toasts.starsReset.message', {
          name: data.member.name
        }),
        'info'
      );
      return data.member;
    }), [showToast, withActionError]);

  const clearTasks = useCallback(({
    memberId = '',
    completedOnly = false
  } = {}) =>
    withActionError(async () => {
      const data = await apiRequest('/api/admin/tasks', {
        method: 'DELETE',
        body: JSON.stringify({ memberId, completedOnly })
      });
      setResources(previous => ({ ...previous, tasks: data.records || [] }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        data.deleted
          ? i18n.t('context:toasts.tasksCleared.title')
          : i18n.t('context:toasts.nothingToClear.title'),
        data.deleted
          ? i18n.t('context:toasts.tasksCleared.message', {
              count: data.deleted
            })
          : i18n.t('context:toasts.nothingToClear.message'),
        data.deleted ? 'success' : 'info'
      );
      return data;
    }), [showToast, withActionError]);

  const deleteMember = useCallback(memberId =>
    withActionError(async () => {
      const data = await apiRequest(`/api/members/${memberId}`, {
        method: 'DELETE'
      });
      setMembers(previous => previous.filter(member => member.id !== memberId));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.memberDeleted.title'),
        i18n.t('context:toasts.memberDeleted.message'),
        'info'
      );
    }), [showToast, withActionError]);

  const updateFamilyAccount = useCallback(changes =>
    withActionError(async () => {
      const data = await apiRequest('/api/family', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setFamilyAccount(data.family);
      setFamiliesList(previous =>
        previous.map(family =>
          family.id === data.family.id ? data.family : family
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.familyUpdated.title'),
        i18n.t('context:toasts.familyUpdated.message'),
        'success'
      );
      return data.family;
    }), [showToast, withActionError]);

  const deleteFamilyAccount = useCallback(password =>
    withActionError(async () => {
      await apiRequest('/api/family', {
        method: 'DELETE',
        body: JSON.stringify({ password })
      });
      await logout();
      await refreshPublicFamilies();
      showToast(
        i18n.t('context:toasts.familyDeleted.title'),
        i18n.t('context:toasts.familyDeleted.message'),
        'info'
      );
      return true;
    }, i18n.t('context:errors.familyDeleteFailed')), [
      logout,
      refreshPublicFamilies,
      showToast,
      withActionError
    ]);

  const connectBringLogin = useCallback((email, password) =>
    apiRequest('/api/integrations/bring/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }), []);

  const fetchBringCatalog = useCallback(async ({ force = false } = {}) => {
    if (!force && bringCatalog.total > 0) return bringCatalog;
    return withActionError(async () => {
      const data = await apiRequest('/api/integrations/bring/catalog');
      setBringCatalog(data.catalog);
      return data.catalog;
    }, i18n.t('context:errors.bringCatalogLoadFailed'));
  }, [bringCatalog, withActionError]);

  const completeBringConnection = useCallback(async payload => {
    const data = await apiRequest('/api/integrations/bring/connect', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    setIntegrations(previous => ({ ...previous, bring: data.integration }));
    applyShoppingRecords(data);
    return data;
  }, [applyShoppingRecords]);

  const fetchBringLiveItems = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/bring/sync', {
        method: 'POST'
      });
      applyShoppingRecords(data);
      showToast(
        i18n.t('context:toasts.bringSynced.title'),
        i18n.t('context:toasts.bringSynced.message'),
        'success'
      );
      return data.records;
    }, i18n.t('context:errors.bringSyncFailed')), [
      applyShoppingRecords,
      showToast,
      withActionError
    ]);

  const disconnectBring = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/bring', {
        method: 'DELETE'
      });
      setIntegrations(previous => ({ ...previous, bring: data.integration }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.bringDisconnected.title'),
        i18n.t('context:toasts.bringDisconnected.message'),
        'info'
      );
    }), [showToast, withActionError]);

  const setupGotify = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/gotify/setup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIntegrations(previous => ({
        ...previous,
        gotify: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.gotifyConnected.title'),
        i18n.t('context:toasts.gotifyConnected.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.gotifyConnectFailed')), [showToast, withActionError]);

  const updateGotifySettings = useCallback(changes =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/gotify', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setIntegrations(previous => ({
        ...previous,
        gotify: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.notificationPrefsSaved.title'),
        i18n.t('context:toasts.gotifySaved.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.gotifySettingsSaveFailed')), [
      showToast,
      withActionError
    ]);

  const testGotify = useCallback(() =>
    withActionError(async () => {
      await apiRequest('/api/integrations/gotify/test', {
        method: 'POST'
      });
      showToast(
        i18n.t('context:toasts.gotifyTestSent.title'),
        i18n.t('context:toasts.gotifyTestSent.message'),
        'success'
      );
      return true;
    }, i18n.t('context:errors.gotifyTestFailed')), [showToast, withActionError]);

  const disconnectGotify = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/gotify', {
        method: 'DELETE'
      });
      setIntegrations(previous => ({
        ...previous,
        gotify: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.gotifyDisconnected.title'),
        i18n.t('context:toasts.gotifyDisconnected.message'),
        'info'
      );
      return true;
    }), [showToast, withActionError]);

  const setupNtfy = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/ntfy/setup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIntegrations(previous => ({ ...previous, ntfy: data.integration }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.ntfyConnected.title'),
        i18n.t('context:toasts.ntfyConnected.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.ntfyConnectFailed')), [showToast, withActionError]);

  const updateNtfySettings = useCallback(changes =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/ntfy', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setIntegrations(previous => ({ ...previous, ntfy: data.integration }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.notificationPrefsSaved.title'),
        i18n.t('context:toasts.ntfySaved.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.ntfySettingsSaveFailed')), [showToast, withActionError]);

  const testNtfy = useCallback(() =>
    withActionError(async () => {
      await apiRequest('/api/integrations/ntfy/test', { method: 'POST' });
      showToast(
        i18n.t('context:toasts.ntfyTestSent.title'),
        i18n.t('context:toasts.ntfyTestSent.message'),
        'success'
      );
      return true;
    }, i18n.t('context:errors.ntfyTestFailed')), [showToast, withActionError]);

  const disconnectNtfy = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/ntfy', {
        method: 'DELETE'
      });
      setIntegrations(previous => ({ ...previous, ntfy: data.integration }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.ntfyDisconnected.title'),
        i18n.t('context:toasts.ntfyDisconnected.message'),
        'info'
      );
      return true;
    }), [showToast, withActionError]);

  const setupHomeAssistant = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/home-assistant/setup',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );
      setIntegrations(previous => ({
        ...previous,
        homeAssistant: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.homeAssistantConnected.title'),
        i18n.t('context:toasts.homeAssistantConnected.message', {
          count: data.entities?.length || 0
        }),
        'success'
      );
      return data;
    }, i18n.t('context:errors.homeAssistantConnectFailed')), [
    showToast,
    withActionError
  ]);

  const fetchHomeAssistantEntities = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/home-assistant/entities'
      );
      return data.entities || [];
    }, i18n.t('context:errors.deviceListLoadFailed')), [withActionError]);

  const updateHomeAssistant = useCallback(changes =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/home-assistant', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setIntegrations(previous => ({
        ...previous,
        homeAssistant: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      await refreshHomeAssistantStates({ silent: true });
      showToast(
        i18n.t('context:toasts.homeDashboardSaved.title'),
        i18n.t('context:toasts.homeDashboardSaved.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.homeAssistantSettingsSaveFailed')), [
    refreshHomeAssistantStates,
    showToast,
    withActionError
  ]);

  const testHomeAssistant = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/home-assistant/test',
        { method: 'POST' }
      );
      showToast(
        i18n.t('context:toasts.connectionOk.title'),
        data.message,
        'success'
      );
      return data;
    }, i18n.t('context:errors.homeAssistantNoResponse')), [
    showToast,
    withActionError
  ]);

  const disconnectHomeAssistant = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/home-assistant', {
        method: 'DELETE'
      });
      setIntegrations(previous => ({
        ...previous,
        homeAssistant: data.integration
      }));
      setHomeAssistantEntities([]);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.homeAssistantDisconnected.title'),
        i18n.t('context:toasts.homeAssistantDisconnected.message'),
        'info'
      );
      return true;
    }), [showToast, withActionError]);

  const callHomeAssistantAction = useCallback((entityId, action, payload = {}) =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/home-assistant/actions',
        {
          method: 'POST',
          body: JSON.stringify({ entityId, action, ...payload })
        }
      );
      setHomeAssistantEntities(data.entities || []);
      return data.entities || [];
    }, i18n.t('context:errors.deviceControlFailed')), [withActionError]);

  const setupNextcloud = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud/setup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      await refreshBootstrap({ silent: true });
      showToast(
        i18n.t('context:toasts.nextcloudConnected.title'),
        i18n.t('context:toasts.nextcloudConnected.message'),
        'success'
      );
      return data;
    }, i18n.t('context:errors.nextcloudConnectFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const setupBundledNextcloud = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/nextcloud/bundled-setup',
        {
          method: 'POST',
          body: JSON.stringify(payload)
        }
      );
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      await refreshBootstrap({ silent: true });
      showToast(
        i18n.t('context:toasts.nextcloudBundledReady.title'),
        i18n.t('context:toasts.nextcloudBundledReady.message'),
        'success'
      );
      return data;
    }, i18n.t('context:errors.nextcloudBundledSetupFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const getBundledNextcloudAccess = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest(
        '/api/integrations/nextcloud/access'
      );
      return data.access;
    }, i18n.t('context:errors.cloudAccessLoadFailed')), [withActionError]);

  const updateNextcloud = useCallback(changes =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud', {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.nextcloudSaved.title'),
        i18n.t('context:toasts.nextcloudSaved.message'),
        'success'
      );
      return data.integration;
    }, i18n.t('context:errors.nextcloudSettingsSaveFailed')), [
    showToast,
    withActionError
  ]);

  const testNextcloud = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud/test', {
        method: 'POST'
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.nextcloudReachable.title'),
        data.message,
        'success'
      );
      return data;
    }, i18n.t('context:errors.nextcloudNoResponse')), [showToast, withActionError]);

  const syncNextcloud = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud/sync', {
        method: 'POST'
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      await refreshBootstrap({ silent: true });
      const changed = Object.values(data.stats || {})
        .reduce((sum, value) => sum + Number(value || 0), 0);
      showToast(
        i18n.t('context:toasts.nextcloudSynced.title'),
        changed
          ? i18n.t('context:toasts.nextcloudSynced.changedMessage', {
              count: changed
            })
          : i18n.t('context:toasts.nextcloudSynced.unchangedMessage'),
        'success'
      );
      return data;
    }, i18n.t('context:errors.nextcloudSyncFailed')), [
    refreshBootstrap,
    showToast,
    withActionError
  ]);

  const backupToNextcloud = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud/backup', {
        method: 'POST'
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.cloudBackupCreated.title'),
        i18n.t('context:toasts.cloudBackupCreated.message', {
          name:
            data.backup?.fileName || i18n.t('context:defaults.familyArchive')
        }),
        'success'
      );
      return data;
    }, i18n.t('context:errors.cloudBackupFailed')), [
    showToast,
    withActionError
  ]);

  const disconnectNextcloud = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/integrations/nextcloud', {
        method: 'DELETE'
      });
      setIntegrations(previous => ({
        ...previous,
        nextcloud: data.integration
      }));
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.nextcloudDisconnected.title'),
        i18n.t('context:toasts.nextcloudDisconnected.message'),
        'info'
      );
      return true;
    }), [showToast, withActionError]);

  const addChatMessage = useCallback(message =>
    withActionError(() => createResource('chatMessages', {
      id: makeId('message'),
      timestamp: Date.now(),
      ...message
    })), [createResource, withActionError]);

  const addMoodCheckin = useCallback(mood =>
    withActionError(async () => {
      const record = await createResource('moodCheckins', {
        id: makeId('mood'),
        memberId: activeMember?.id,
        mood,
        createdAt: Date.now()
      });
      showToast(
        i18n.t('context:toasts.moodShared.title'),
        i18n.t('context:toasts.moodShared.message'),
        'success'
      );
      return record;
    }), [activeMember?.id, createResource, showToast, withActionError]);

  const addTrashEvent = useCallback(record =>
    withActionError(() => createResource('trashEvents', {
      id: makeId('trash'),
      household: activeHouseholdState,
      ...record
    })), [activeHouseholdState, createResource, withActionError]);

  const addTrashEvents = useCallback(records =>
    withActionError(() => bulkCreateResources(
      'trashEvents',
      records.map(record => ({
        id: record.id || makeId('trash'),
        household: activeHouseholdState,
        ...record
      }))
    )), [activeHouseholdState, bulkCreateResources, withActionError]);

  const updateTrashEvent = useCallback((id, changes) =>
    withActionError(() => patchResource('trashEvents', id, changes)), [
      patchResource,
      withActionError
    ]);

  const deleteTrashEvent = useCallback(id =>
    withActionError(() => removeResource('trashEvents', id)), [
      removeResource,
      withActionError
    ]);

  const addFamilyLink = useCallback(record =>
    withActionError(() => createResource('familyTree', {
      id: makeId('family-link'),
      ...record
    })), [createResource, withActionError]);

  const requestFamilyRelationship = useCallback((targetFamilyId, relationType) =>
    withActionError(async () => {
      const data = await apiRequest('/api/family/relationships', {
        method: 'POST',
        body: JSON.stringify({ targetFamilyId, relationType })
      });
      setFamilyRelationships(data.relationships || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.relationshipRequested.title'),
        i18n.t('context:toasts.relationshipRequested.message'),
        'success'
      );
      return data.relationship;
    }, i18n.t('context:errors.familyRequestFailed')), [showToast, withActionError]);

  const respondFamilyRelationship = useCallback((relationshipId, status) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/relationships/${relationshipId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }
      );
      setFamilyRelationships(data.relationships || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        status === 'accepted'
          ? i18n.t('context:toasts.familiesConnected.title')
          : i18n.t('context:toasts.requestDeclined.title'),
        status === 'accepted'
          ? i18n.t('context:toasts.familiesConnected.message')
          : i18n.t('context:toasts.requestDeclined.message'),
        status === 'accepted' ? 'success' : 'info'
      );
      return data.relationship;
    }, i18n.t('context:errors.requestAnswerFailed')), [showToast, withActionError]);

  const removeFamilyRelationship = useCallback(relationshipId =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/relationships/${relationshipId}`,
        { method: 'DELETE' }
      );
      setFamilyRelationships(data.relationships || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.relationshipRemoved.title'),
        i18n.t('context:toasts.relationshipRemoved.message'),
        'info'
      );
      return true;
    }, i18n.t('context:errors.relationshipRemoveFailed')), [
    showToast,
    withActionError
  ]);

  const updateFamilyRelationshipGrants = useCallback(
    (relationshipId, grants) =>
      withActionError(async () => {
        const data = await apiRequest(
          `/api/family/relationships/${relationshipId}/grants`,
          {
            method: 'PATCH',
            body: JSON.stringify(grants)
          }
        );
        setFamilyRelationships(data.relationships || []);
        versionRef.current = Number(data.version || versionRef.current);
        showToast(
          i18n.t('context:toasts.familyGrantsSaved.title'),
          i18n.t('context:toasts.familyGrantsSaved.message'),
          'success'
        );
        return data.relationship;
      }, i18n.t('context:errors.familyGrantsSaveFailed')),
    [showToast, withActionError]
  );

  const refreshFamilyMail = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/family/mail');
      setFamilyLetters(data.letters || []);
      versionRef.current = Number(data.version || versionRef.current);
      return data.letters || [];
    }, i18n.t('context:errors.familyMailLoadFailed')), [withActionError]);

  const sendFamilyLetter = useCallback(letter =>
    withActionError(async () => {
      const data = await apiRequest('/api/family/mail', {
        method: 'POST',
        body: JSON.stringify(letter)
      });
      setFamilyLetters(data.letters || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.letterSent.title'),
        i18n.t('context:toasts.letterSent.message'),
        'success'
      );
      return data.letter;
    }, i18n.t('context:errors.letterSendFailed')), [
    showToast,
    withActionError
  ]);

  const updateFamilyLetter = useCallback((letterId, changes) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/family/mail/${letterId}`, {
        method: 'PATCH',
        body: JSON.stringify(changes)
      });
      setFamilyLetters(data.letters || []);
      versionRef.current = Number(data.version || versionRef.current);
      return data.letter;
    }, i18n.t('context:errors.letterUpdateFailed')), [withActionError]);

  const refreshFamilyChatGuests = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/family/chat-guests');
      setFamilyChatGuests(data.invitations || []);
      versionRef.current = Number(data.version || versionRef.current);
      return data.invitations || [];
    }, i18n.t('context:errors.chatInvitationsLoadFailed')), [withActionError]);

  const inviteFamilyChatGuest = useCallback(invitation =>
    withActionError(async () => {
      const data = await apiRequest('/api/family/chat-guests', {
        method: 'POST',
        body: JSON.stringify(invitation)
      });
      setFamilyChatGuests(data.invitations || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.chatInvitationSent.title'),
        i18n.t('context:toasts.chatInvitationSent.message'),
        'success'
      );
      return data.invitation;
    }, i18n.t('context:errors.chatInvitationSendFailed')), [
    showToast,
    withActionError
  ]);

  const updateFamilyChatGuest = useCallback((invitationId, status) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/chat-guests/${invitationId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status })
        }
      );
      setFamilyChatGuests(data.invitations || []);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        status === 'accepted'
          ? i18n.t('context:toasts.invitationAccepted.title')
          : status === 'revoked'
            ? i18n.t('context:toasts.guestAccessEnded.title')
            : i18n.t('context:toasts.invitationDeclined.title'),
        status === 'accepted'
          ? i18n.t('context:toasts.invitationAccepted.message')
          : i18n.t('context:toasts.chatAccessUpdated.message'),
        status === 'accepted' ? 'success' : 'info'
      );
      return data.invitation;
    }, i18n.t('context:errors.chatAccessUpdateFailed')), [
    showToast,
    withActionError
  ]);

  const fetchGuestChatMessages = useCallback(invitationId =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/chat-guests/${invitationId}/messages`
      );
      return data.messages || [];
    }, i18n.t('context:errors.guestChatLoadFailed')), [
    withActionError
  ]);

  const sendGuestChatMessage = useCallback((invitationId, message) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/chat-guests/${invitationId}/messages`,
        {
          method: 'POST',
          body: JSON.stringify(message)
        }
      );
      return data.message;
    }, i18n.t('context:errors.messageSendFailed')), [withActionError]);

  const addRelatedFamilyTask = useCallback((relationshipId, task) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/relationships/${relationshipId}/tasks`,
        {
          method: 'POST',
          body: JSON.stringify(task)
        }
      );
      showToast(
        i18n.t('context:toasts.taskSentToGrandchild.title'),
        i18n.t('context:toasts.taskSentToGrandchild.message', {
          title: data.task.title
        }),
        'success'
      );
      return data.task;
    }, i18n.t('context:errors.taskSendFailed')), [
    showToast,
    withActionError
  ]);

  const addRelatedFamilyReward = useCallback((relationshipId, reward) =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family/relationships/${relationshipId}/rewards`,
        {
          method: 'POST',
          body: JSON.stringify(reward)
        }
      );
      showToast(
        i18n.t('context:toasts.rewardCreated.title'),
        i18n.t('context:toasts.rewardCreated.grandchildMessage', {
          title: data.reward.title
        }),
        'success'
      );
      return data.reward;
    }, i18n.t('context:errors.rewardCreateFailed')), [
    showToast,
    withActionError
  ]);

  const addRelatedFamilyPocketMoney = useCallback(
    (relationshipId, transaction) =>
      withActionError(async () => {
        const data = await apiRequest(
          `/api/family/relationships/${relationshipId}/pocket-money`,
          {
            method: 'POST',
            body: JSON.stringify(transaction)
          }
        );
        showToast(
          i18n.t('context:toasts.pocketMoneyBooked.title'),
          i18n.t('context:toasts.grandchildPocketMoneyBooked.message'),
          'success'
        );
        return data.transaction;
      }, i18n.t('context:errors.pocketMoneyBookFailed')),
    [showToast, withActionError]
  );

  const submitProblemReport = useCallback(report =>
    withActionError(async () => {
      const data = await apiRequest('/api/problem-reports', {
        method: 'POST',
        body: JSON.stringify(report)
      });
      showToast(
        i18n.t('context:toasts.problemReportSaved.title'),
        i18n.t('context:toasts.problemReportSaved.message'),
        'success'
      );
      return data.report;
    }, i18n.t('context:errors.reportSaveFailed')), [
    showToast,
    withActionError
  ]);

  const fetchProblemReports = useCallback(() =>
    withActionError(async () => {
      const data = await apiRequest('/api/problem-reports');
      return data.reports || [];
    }, i18n.t('context:errors.problemReportsLoadFailed')), [withActionError]);

  const updateProblemReport = useCallback((reportId, status) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/problem-reports/${reportId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      return data.report;
    }, i18n.t('context:errors.reportStatusChangeFailed')), [withActionError]);

  const addDashboardLink = useCallback(link =>
    withActionError(async () => {
      const created = await createResource('dashboardLinks', {
        id: makeId('dashboard-link'),
        ...link
      });
      showToast(
        i18n.t('context:toasts.dashboardLinkAdded.title'),
        i18n.t('context:toasts.dashboardLinkAdded.message', {
          title: created.title
        }),
        'success'
      );
      return created;
    }, i18n.t('context:errors.mediaWidgetSaveFailed')), [
      createResource,
      showToast,
      withActionError
    ]);

  const deleteDashboardLink = useCallback(linkId =>
    withActionError(async () => {
      await removeResource('dashboardLinks', linkId);
      showToast(
        i18n.t('context:toasts.dashboardLinkRemoved.title'),
        i18n.t('context:toasts.dashboardLinkRemoved.message'),
        'info'
      );
      return true;
    }), [removeResource, showToast, withActionError]);

  const addFamilyLifeRecord = useCallback((type, record) =>
    withActionError(async () => {
      const prefixes = {
        dailyRoutines: 'routine',
        savingsGoals: 'saving',
        schoolItems: 'school',
        familyPolls: 'poll',
        encouragements: 'encouragement',
        familyMissions: 'family-mission',
        familyContacts: 'family-contact',
        familySettings: 'family-settings',
        kidProfiles: 'kid-profile'
      };
      const created = await createResource(type, {
        id: record.id || makeId(prefixes[type] || 'family-life'),
        ...record
      });
      showToast(
        i18n.t('context:toasts.familyLifeSaved.title'),
        i18n.t('context:toasts.familyLifeSaved.message'),
        'success'
      );
      return created;
    }, i18n.t('context:errors.entrySaveFailed')), [
      createResource,
      showToast,
      withActionError
    ]);

  const updateFamilyLifeRecord = useCallback((type, id, changes) =>
    withActionError(async () => {
      const updated = await patchResource(type, id, changes);
      showToast(
        i18n.t('context:toasts.familyLifeUpdated.title'),
        i18n.t('context:shared.changeSaved'),
        'success'
      );
      return updated;
    }, i18n.t('context:errors.entryUpdateFailed')), [
      patchResource,
      showToast,
      withActionError
    ]);

  const deleteFamilyLifeRecord = useCallback((type, id) =>
    withActionError(async () => {
      await removeResource(type, id);
      showToast(
        i18n.t('context:toasts.familyLifeRemoved.title'),
        i18n.t('context:toasts.familyLifeRemoved.message'),
        'info'
      );
      return true;
    }, i18n.t('context:errors.entryDeleteFailed')), [
      removeResource,
      showToast,
      withActionError
    ]);

  const toggleRoutineStep = useCallback((routineId, stepId, date) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/routines/${routineId}/toggle`, {
        method: 'POST',
        body: JSON.stringify({ stepId, date })
      });
      updateResourceState('dailyRoutines', data.record);
      versionRef.current = Number(data.version || versionRef.current);
      if (data.completedToday) {
        showToast(
          i18n.t('context:toasts.routineCompleted.title'),
          i18n.t('context:toasts.routineCompleted.message'),
          'star'
        );
      }
      return data.record;
    }, i18n.t('context:errors.routineUpdateFailed')), [
      showToast,
      updateResourceState,
      withActionError
    ]);

  const toggleSchoolItem = useCallback(itemId =>
    withActionError(async () => {
      const data = await apiRequest(`/api/school/${itemId}/toggle`, {
        method: 'POST'
      });
      updateResourceState('schoolItems', data.record);
      versionRef.current = Number(data.version || versionRef.current);
      return data.record;
    }, i18n.t('context:errors.schoolItemUpdateFailed')), [
      updateResourceState,
      withActionError
    ]);

  const voteFamilyPoll = useCallback((pollId, optionId) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId })
      });
      updateResourceState('familyPolls', data.record);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.voteCounted.title'),
        i18n.t('context:toasts.voteCounted.message'),
        'success'
      );
      return data.record;
    }, i18n.t('context:errors.pollSaveFailed')), [
      showToast,
      updateResourceState,
      withActionError
    ]);

  const toggleFamilyMission = useCallback((missionId, memberId = '') =>
    withActionError(async () => {
      const data = await apiRequest(
        `/api/family-missions/${missionId}/toggle`,
        {
          method: 'POST',
          body: JSON.stringify({ memberId })
        }
      );
      updateResourceState('familyMissions', data.record);
      versionRef.current = Number(data.version || versionRef.current);
      return data.record;
    }, i18n.t('context:errors.familyMissionUpdateFailed')), [
      updateResourceState,
      withActionError
    ]);

  const addPocketMoneyTransaction = useCallback(payload =>
    withActionError(async () => {
      const data = await apiRequest('/api/pocket-money/transactions', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      updateResourceState('pocketMoneyTransactions', data.transaction);
      setMembers(previous =>
        previous.map(member =>
          member.id === data.member.id ? data.member : member
        )
      );
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        data.transaction.starCost
          ? i18n.t('context:toasts.starsConverted.title')
          : i18n.t('context:toasts.pocketMoneyBooked.title'),
        i18n.t('context:toasts.pocketMoneyBooked.message', {
          name: data.member.name
        }),
        'success'
      );
      return data.transaction;
    }, i18n.t('context:errors.pocketMoneyBookFailed')), [
      showToast,
      updateResourceState,
      withActionError
    ]);

  const updateKidProfile = useCallback((memberId, changes) =>
    withActionError(async () => {
      const data = await apiRequest(`/api/kids/${memberId}/style`, {
        method: 'PUT',
        body: JSON.stringify(changes)
      });
      updateResourceState('kidProfiles', data.record);
      versionRef.current = Number(data.version || versionRef.current);
      showToast(
        i18n.t('context:toasts.kidWorldReady.title'),
        i18n.t('context:toasts.kidWorldReady.message'),
        'star'
      );
      return data.record;
    }, i18n.t('context:errors.kidWorldSaveFailed')), [
      showToast,
      updateResourceState,
      withActionError
    ]);

  const bringCredentials = useMemo(() => ({
    mail: integrations.bring?.email || '',
    listUuid: integrations.bring?.listUuid || '',
    listName: integrations.bring?.listName || '',
    isConnected: Boolean(integrations.bring?.connected)
  }), [integrations.bring]);

  const currentFamily = familyAccount;
  const activeFamilyId = familyAccount?.id || '';
  const canEditFamily = useCallback(
    () => canManageFamily(activeMember),
    [activeMember]
  );

  const value = {
    appVersion,
    releaseNotes,
    acknowledgeReleaseNotes,
    authStatus,
    loginFamily,
    registerFamily,
    selectMemberProfile,
    logout,
    refreshPublicFamilies,
    refreshBootstrap,
    theme,
    setTheme,
    previewCustomThemeCss,
    restoreCustomThemeCss,
    saveCustomThemeCss,
    activeTab,
    setActiveTab,
    activeHousehold: activeHouseholdState,
    setActiveHousehold,
    familyAccount,
    familiesList,
    publicAccess,
    readOnlyDemo,
    currentFamily,
    activeFamilyId,
    updateFamilyAccount,
    deleteFamily: deleteFamilyAccount,
    selectFamilyAccount: loginFamily,
    canEditFamily,
    resetAllData: logout,
    isPortalUnlocked: true,
    loginPortal: () => true,
    logoutPortal: logout,
    toast,
    setToast,
    showToast,
    members,
    addMember,
    updateMember,
    deleteMember,
    resetMemberStars,
    activeMemberId: activeMemberIdState,
    setActiveMemberId: selectMemberProfile,
    activeMember,
    bringCredentials,
    bringCatalog,
    connectBringLogin,
    completeBringConnection,
    disconnectBring,
    fetchBringCatalog,
    fetchBringLiveItems,
    gotifyIntegration: integrations.gotify,
    setupGotify,
    updateGotifySettings,
    testGotify,
    disconnectGotify,
    ntfyIntegration: integrations.ntfy,
    setupNtfy,
    updateNtfySettings,
    testNtfy,
    disconnectNtfy,
    homeAssistantIntegration: integrations.homeAssistant,
    homeAssistantEntities,
    homeAssistantLoading,
    setupHomeAssistant,
    fetchHomeAssistantEntities,
    updateHomeAssistant,
    testHomeAssistant,
    disconnectHomeAssistant,
    refreshHomeAssistantStates,
    callHomeAssistantAction,
    nextcloudIntegration: integrations.nextcloud,
    setupNextcloud,
    setupBundledNextcloud,
    getBundledNextcloudAccess,
    updateNextcloud,
    testNextcloud,
    syncNextcloud,
    backupToNextcloud,
    disconnectNextcloud,
    webdavIntegration: integrations.webdav,
    webPush,
    refreshWebPushStatus,
    enableWebPush,
    disableWebPush,
    updateWebPushPreferences,
    testWebPush,
    nativePush,
    refreshNativePushStatus,
    enableNativePush,
    disableNativePush,
    updateNativePushPreferences,
    testNativePush,
    fetchPushDevices,
    removePushDevice,
    notifications,
    unreadNotificationCount,
    refreshNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    shoppingItems: resources.shoppingItems,
    toggleShoppingSelected,
    toggleShoppingInCart,
    addShoppingItem,
    addMealIngredientsToShopping,
    setRawShoppingItems,
    savedRecipes: resources.savedRecipes,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    events: calendarEvents,
    calendarSubscriptions,
    addCalendarSubscription,
    updateCalendarSubscription,
    syncCalendarSubscription,
    syncAllCalendarSubscriptions,
    deleteCalendarSubscription,
    addEvent,
    updateEvent,
    deleteEvent,
    importICS,
    exportICS,
    meals: resources.meals,
    updateMeal,
    deleteMeal,
    tasks: resources.tasks,
    toggleTask,
    completeTaskAs,
    reviewTask,
    addTask,
    updateTask,
    deleteTask,
    clearTasks,
    rewards: resources.rewards,
    addReward,
    updateReward,
    deleteReward,
    redeemReward,
    notes: resources.notes,
    addNote,
    updateNote,
    deleteNote,
    chatMessages: resources.chatMessages,
    addChatMessage,
    familyTree: resources.familyTree,
    addFamilyLink,
    familyRelationships,
    requestFamilyRelationship,
    respondFamilyRelationship,
    removeFamilyRelationship,
    updateFamilyRelationshipGrants,
    familyLetters,
    refreshFamilyMail,
    sendFamilyLetter,
    updateFamilyLetter,
    familyChatGuests,
    refreshFamilyChatGuests,
    inviteFamilyChatGuest,
    updateFamilyChatGuest,
    fetchGuestChatMessages,
    sendGuestChatMessage,
    addRelatedFamilyTask,
    addRelatedFamilyReward,
    addRelatedFamilyPocketMoney,
    submitProblemReport,
    fetchProblemReports,
    updateProblemReport,
    dashboardLinks: resources.dashboardLinks,
    addDashboardLink,
    deleteDashboardLink,
    trashEvents: resources.trashEvents,
    addTrashEvent,
    addTrashEvents,
    updateTrashEvent,
    deleteTrashEvent,
    moodCheckins: resources.moodCheckins,
    addMoodCheckin,
    dailyRoutines: resources.dailyRoutines,
    savingsGoals: resources.savingsGoals,
    pocketMoneyTransactions: resources.pocketMoneyTransactions,
    schoolItems: resources.schoolItems,
    familyPolls: resources.familyPolls,
    encouragements: resources.encouragements,
    familyMissions: resources.familyMissions,
    familyContacts: resources.familyContacts,
    familySettings: resources.familySettings,
    kidProfiles: resources.kidProfiles,
    addFamilyLifeRecord,
    updateFamilyLifeRecord,
    deleteFamilyLifeRecord,
    toggleRoutineStep,
    toggleSchoolItem,
    voteFamilyPoll,
    toggleFamilyMission,
    addPocketMoneyTransaction,
    updateKidProfile,
    isProfileModalOpen,
    setIsProfileModalOpen,
    isQuickAddOpen,
    setIsQuickAddOpen,
    quickAddDefaultType,
    setQuickAddDefaultType,
    quickAddEventPreset,
    setQuickAddEventPreset,
    isBringModalOpen,
    setIsBringModalOpen
  };

  return (
    <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error('useFamily muss innerhalb von FamilyProvider verwendet werden.');
  }
  return context;
}
