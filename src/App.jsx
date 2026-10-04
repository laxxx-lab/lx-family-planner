import React, { lazy, Suspense, useEffect, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FamilyProvider, useFamily } from './context/FamilyContext';
import Header from './components/Header';
import Navigation from './components/Navigation';
import FamilyTreeModal from './components/FamilyTree/FamilyTreeModal';
import ProfileModal from './components/ProfileModal';
import QuickAddModal from './components/QuickAddModal';
import ToastNotification from './components/ToastNotification';
import BringAccountModal from './components/Shopping/BringAccountModal';
import NotificationPermissionBanner from './components/Notifications/NotificationPermissionBanner';
import ProblemReportButton from './components/ProblemReportButton';
import ReleaseNotesModal from './components/ReleaseNotesModal';
import ServerConfigModal from './components/ServerConfigModal';
import AppUpdateBanner from './components/AppUpdateBanner';
import IOSInstallPrompt from './components/IOSInstallPrompt';
import { canAccessAppView, isWallProfile } from './constants/roles';
import {
  getStoredServerUrl,
  hydrateStoredServerUrl,
  isCapacitorNative
} from './utils/apiConfig';

const EMPTY_DISABLED_MODULES = [];

const PersonalDashboard = lazy(() => import('./components/Dashboard/PersonalDashboard'));
const KitchenTabletView = lazy(() => import('./components/Dashboard/KitchenTabletView'));
const CalendarView = lazy(() => import('./components/Calendar/CalendarView'));
const TrashCalendarView = lazy(() => import('./components/Calendar/TrashCalendarView'));
const BringShoppingList = lazy(() => import('./components/Shopping/BringShoppingList'));
const MealPlanner = lazy(() => import('./components/Meals/MealPlanner'));
const ChoreRewardsPlanner = lazy(() => import('./components/Tasks/ChoreRewardsPlanner'));
const FamilyPinboard = lazy(() => import('./components/Board/FamilyPinboard'));
const FamilyChatView = lazy(() => import('./components/Chat/FamilyChatView'));
const FamilyLoginScreen = lazy(() => import('./components/Auth/FamilyLoginScreen'));
const OnboardingWizard = lazy(() => import('./components/Auth/OnboardingWizard'));
const ParentAdmin = lazy(() => import('./components/Admin/ParentAdmin'));
const CloudFileBrowser = lazy(() => import('./components/Admin/CloudFileBrowser'));
const FamilyLifeHub = lazy(() => import('./components/FamilyLife/FamilyLifeHub'));
const FamilyMailbox = lazy(() => import('./components/FamilyMail/FamilyMailbox'));

const DEEP_LINK_VIEWS = new Set([
  'dashboard',
  'chat',
  'calendar',
  'trash',
  'tasks',
  'board',
  'shopping',
  'meals',
  'family-life',
  'cloud',
  'mail',
  'admin'
]);

function ViewLoading() {
  const { t } = useTranslation('chrome');
  return (
    <div className="app-loading" role="status" aria-live="polite">
      <LoaderCircle className="spin" size={28} />
      <strong>{t('app.loading')}</strong>
    </div>
  );
}

function MainContent() {
  const { t } = useTranslation('chrome');
  const {
    activeTab,
    authStatus,
    logout,
    setActiveTab,
    activeMember,
    familySettings,
    readOnlyDemo,
    toast,
    setToast
  } = useFamily();
  const disabledModules =
    familySettings[0]?.disabledModules || EMPTY_DISABLED_MODULES;
  const [isCreatingNewFamily, setIsCreatingNewFamily] = useState(false);
  const [isFamilyTreeOpen, setIsFamilyTreeOpen] = useState(false);

  useEffect(() => {
    if (authStatus !== 'authenticated') return;
    const url = new URL(window.location.href);
    const isRecipeShareTarget =
      url.pathname.replace(/\/+$/, '') === '/share-recipe';
    const requestedView = isRecipeShareTarget
      ? 'meals'
      : url.searchParams.get('view');
    if (
      DEEP_LINK_VIEWS.has(requestedView) &&
      (!readOnlyDemo || requestedView !== 'cloud') &&
      canAccessAppView(activeMember, requestedView, disabledModules)
    ) {
      setActiveTab(requestedView);
      if (isRecipeShareTarget) return;
      url.searchParams.delete('view');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    }
  }, [activeMember, authStatus, disabledModules, readOnlyDemo, setActiveTab]);

  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
      (
        (readOnlyDemo && activeTab === 'cloud') ||
        !canAccessAppView(activeMember, activeTab, disabledModules)
      )
    ) {
      setActiveTab('dashboard');
    }
  }, [
    activeMember,
    activeTab,
    authStatus,
    disabledModules,
    readOnlyDemo,
    setActiveTab
  ]);

  useEffect(() => {
    if (authStatus !== 'authenticated') return undefined;
    const openNativeNotification = event => {
      const notification = event.detail || {};
      const data = notification.data || notification;
      try {
        const target = new URL(data.url || '/', window.location.origin);
        const requestedView = target.searchParams.get('view') || 'dashboard';
        if (!DEEP_LINK_VIEWS.has(requestedView)) return;
        if (readOnlyDemo && requestedView === 'cloud') return;
        if (!canAccessAppView(activeMember, requestedView, disabledModules)) {
          return;
        }
        const chatTarget = target.searchParams.get('chat');
        if (requestedView === 'chat' && chatTarget) {
          const currentUrl = new URL(window.location.href);
          currentUrl.searchParams.set('chat', chatTarget);
          window.history.replaceState(
            {},
            '',
            `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`
          );
        }
        setActiveTab(requestedView);
      } catch {
        // Eine Meldung ohne gültiges Ziel öffnet einfach die aktuelle Ansicht.
      }
    };
    window.addEventListener(
      'lx-native-notification-open',
      openNativeNotification
    );
    return () => {
      window.removeEventListener(
        'lx-native-notification-open',
        openNativeNotification
      );
    };
  }, [
    activeMember,
    authStatus,
    disabledModules,
    readOnlyDemo,
    setActiveTab
  ]);

  const [isServerConfigOpen, setIsServerConfigOpen] = useState(false);
  const canConfigureServer = isCapacitorNative();

  useEffect(() => {
    if (
      authStatus !== 'authenticated' &&
      canConfigureServer &&
      !getStoredServerUrl()
    ) {
      setIsServerConfigOpen(true);
    }
  }, [authStatus, canConfigureServer]);

  useEffect(() => {
    if (
      authStatus === 'authenticated' &&
      isWallProfile(activeMember) &&
      activeTab === 'dashboard'
    ) {
      setActiveTab('kitchen');
    }
  }, [activeMember, activeTab, authStatus, setActiveTab]);

  if (authStatus === 'loading') {
    return (
      <div className="app-loading">
        <div className="app-loading-mark">LX</div>
        <LoaderCircle className="spin" size={28} />
        <strong>{t('app.loading')}</strong>
      </div>
    );
  }

  if (isCreatingNewFamily && authStatus !== 'authenticated') {
    return (
      <>
        <Suspense fallback={<ViewLoading />}>
          <OnboardingWizard
            onComplete={() => setIsCreatingNewFamily(false)}
            onBack={() => setIsCreatingNewFamily(false)}
            onOpenServerConfig={
              canConfigureServer
                ? () => setIsServerConfigOpen(true)
                : undefined
            }
          />
        </Suspense>
        <ServerConfigModal
          isOpen={isServerConfigOpen}
          onClose={() => setIsServerConfigOpen(false)}
          onSave={() => window.location.reload()}
        />
      </>
    );
  }

  if (authStatus !== 'authenticated') {
    return (
      <>
        <Suspense fallback={<ViewLoading />}>
          <FamilyLoginScreen
            onStartOnboarding={() => setIsCreatingNewFamily(true)}
            onOpenServerConfig={
              canConfigureServer
                ? () => setIsServerConfigOpen(true)
                : undefined
            }
          />
        </Suspense>
        <ServerConfigModal
          isOpen={isServerConfigOpen}
          onClose={() => setIsServerConfigOpen(false)}
          onSave={() => window.location.reload()}
        />
      </>
    );
  }

  return (
    <div className={`app-container ${activeTab === 'kitchen' ? 'tablet-mode-active' : ''}`}>
      <div className="theme-atmosphere" aria-hidden="true">
        <span className="theme-spark">✦</span>
        <span className="theme-spark">✧</span>
        <span className="theme-spark">•</span>
      </div>
      <Header
        onLogout={logout}
        onOpenServerConfig={
          canConfigureServer
            ? () => setIsServerConfigOpen(true)
            : undefined
        }
        onOpenFamilyTree={() => setIsFamilyTreeOpen(true)}
      />
      <Navigation onOpenFamilyTree={() => setIsFamilyTreeOpen(true)} />
      <NotificationPermissionBanner />

      <main className="content-wrapper">
        <Suspense fallback={<ViewLoading />}>
          {activeTab === 'dashboard' && <PersonalDashboard />}
          {activeTab === 'chat' && <FamilyChatView />}
          {activeTab === 'kitchen' && <KitchenTabletView />}
          {activeTab === 'calendar' && <CalendarView />}
          {activeTab === 'trash' && <TrashCalendarView />}
          {activeTab === 'shopping' && <BringShoppingList />}
          {activeTab === 'meals' && <MealPlanner />}
          {activeTab === 'tasks' && <ChoreRewardsPlanner />}
          {activeTab === 'board' && <FamilyPinboard />}
          {activeTab === 'family-life' && <FamilyLifeHub />}
          {activeTab === 'cloud' && !readOnlyDemo && (
            <div className="family-cloud-page">
              <CloudFileBrowser />
            </div>
          )}
          {activeTab === 'mail' && <FamilyMailbox />}
          {activeTab === 'admin' && (
            <ParentAdmin onOpenFamilyTree={() => setIsFamilyTreeOpen(true)} />
          )}
        </Suspense>
      </main>

      <FamilyTreeModal
        isOpen={isFamilyTreeOpen}
        onClose={() => setIsFamilyTreeOpen(false)}
      />
      <ProfileModal />
      {!isWallProfile(activeMember) && <QuickAddModal />}
      <BringAccountModal />
      <ReleaseNotesModal />
      <ServerConfigModal
        isOpen={isServerConfigOpen}
        onClose={() => setIsServerConfigOpen(false)}
        onSave={() => window.location.reload()}
      />
      {!isWallProfile(activeMember) && <ProblemReportButton />}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

export default function App() {
  const nativeApp = isCapacitorNative();
  const [serverStorageReady, setServerStorageReady] = useState(!nativeApp);

  useEffect(() => {
    if (!nativeApp) return undefined;
    let active = true;
    hydrateStoredServerUrl().finally(() => {
      if (active) setServerStorageReady(true);
    });
    return () => {
      active = false;
    };
  }, [nativeApp]);

  if (!serverStorageReady) {
    return (
      <div className="app-loading" role="status" aria-live="polite">
        <div className="app-loading-mark">LX</div>
        <LoaderCircle className="spin" size={28} />
      </div>
    );
  }

  return (
    <FamilyProvider>
      <IOSInstallPrompt />
      <AppUpdateBanner />
      <MainContent />
    </FamilyProvider>
  );
}
