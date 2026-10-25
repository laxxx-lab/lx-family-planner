import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import {
  Network,
  Sparkles,
  Server,
  Settings,
  Tablet,
  Home,
  Users,
  LogOut,
  Star,
  X
} from 'lucide-react';
import { useFamily } from '../context/FamilyContext';
import { canManageFamily } from '../constants/roles';
import { useNavigationTabs } from '../hooks/useNavigationTabs';
import { useNavigationFavorites } from '../hooks/useNavigationFavorites';
import { useViewportScrollLock } from '../hooks/useViewportScrollLock';
import LanguageSwitcher from './LanguageSwitcher';

/**
 * Slide-in navigation drawer for narrow viewports (handy + tablet portrait).
 *
 * Rendered via portal from the Header. Mirrors the NotificationCenter overlay
 * pattern: a fixed layer acts as the backdrop (click-to-close) and an aside
 * panel slides in from the left. Escape closes; body scroll is locked while
 * open. After picking a tab, the drawer closes automatically so the chosen
 * view is immediately visible.
 *
 * The tab list is shared with the horizontal tab bar via `useNavigationTabs`,
 * guaranteeing both surfaces stay in sync.
 */
export default function MobileNavDrawer({
  isOpen,
  onClose,
  onOpenFamilyTree,
  onOpenTheme,
  onOpenServerConfig,
  onLogout,
  onOpenFamilySettings,
  showPlanningLocations = false,
  activeHousehold,
  onSelectHousehold,
  showTabletMode = false,
  isTabletModeActive = false,
  onToggleTabletMode
}) {
  const { t } = useTranslation('chrome');
  const { activeTab, setActiveTab, activeMember } = useFamily();
  const { visibleTabs } = useNavigationTabs();
  const { favoriteIds, toggleFavorite, maxFavorites } = useNavigationFavorites(visibleTabs);

  // Close on Escape while open (mirrors NotificationCenter behavior).
  useEffect(() => {
    if (!isOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  // overflow:hidden alone leaks scroll events through to the page in iOS Safari.
  useViewportScrollLock(isOpen);

  if (!isOpen) return null;

  const selectTab = id => {
    setActiveTab(id);
    onClose();
  };

  const openFamilyTree = () => {
    onClose();
    onOpenFamilyTree?.();
  };

  // Triggered actions close the drawer first, then hand off to their overlay.
  const runAction = handler => () => {
    onClose();
    handler?.();
  };

  const selectHousehold = household => {
    onSelectHousehold?.(household);
    onClose();
  };

  return createPortal(
    <div
      className="mobile-nav-drawer-layer"
      onPointerDown={onClose}
    >
      <aside
        className="mobile-nav-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-drawer-title"
        onPointerDown={event => event.stopPropagation()}
      >
        <div className="mobile-nav-drawer-header">
          <strong id="mobile-nav-drawer-title">{t('header.menu.title')}</strong>
          <button
            type="button"
            className="mobile-nav-drawer-close"
            onClick={onClose}
            aria-label={t('header.menu.close')}
          >
            <X size={20} />
          </button>
        </div>

        <nav className="mobile-nav-drawer-tabs" aria-label={t('navigation.allAreas')}>
          <div className="mobile-nav-drawer-section-heading">
            <strong>{t('navigation.allAreas')}</strong>
            <small>{t('navigation.favoritesHint', { count: maxFavorites })}</small>
          </div>
          {favoriteIds.length >= maxFavorites && <p className="mobile-nav-favorites-limit" role="status">
            {t('navigation.favoritesLimit', { count: maxFavorites })}
          </p>}
          {visibleTabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isFavorite = favoriteIds.includes(tab.id);
            return (
              <div className={`mobile-nav-item-row ${isActive ? 'active' : ''}`} key={tab.id}>
                <button
                  type="button"
                  className="mobile-nav-item"
                  onClick={() => selectTab(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon size={20} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="mobile-nav-item-badge">{tab.badge}</span>
                  )}
                </button>
                <button
                  type="button"
                  className={`mobile-nav-favorite-toggle ${isFavorite ? 'is-favorite' : ''}`}
                  aria-disabled={tab.id === 'dashboard' || (!isFavorite && favoriteIds.length >= maxFavorites)}
                  onClick={() => toggleFavorite(tab.id)}
                  aria-label={t(
                    isFavorite
                      ? 'navigation.favoriteRemoveAria'
                      : 'navigation.favoriteAddAria',
                    { name: tab.label }
                  )}
                  title={!isFavorite && favoriteIds.length >= maxFavorites
                    ? t('navigation.favoritesLimit', { count: maxFavorites }) : t(
                    isFavorite
                      ? 'navigation.favoriteRemoveAria'
                      : 'navigation.favoriteAddAria',
                    { name: tab.label }
                  )}
                >
                  <Star size={17} fill={isFavorite ? 'currentColor' : 'none'} />
                </button>
              </div>
            );
          })}

          {canManageFamily(activeMember) && (
            <button
              type="button"
              className="mobile-nav-item mobile-nav-item-secondary"
              onClick={openFamilyTree}
            >
              <Network size={20} />
              <span>{t('navigation.familyTree')}</span>
            </button>
          )}
        </nav>

        <div className="mobile-nav-drawer-actions">
          {showPlanningLocations && (
            <section className="mobile-nav-planning-location" aria-label={t('header.planLocationAria')}>
              <span className="mobile-nav-section-label">{t('header.planLocation')}</span>
              <div className="mobile-nav-household-options">
                <button
                  type="button"
                  className={activeHousehold === 'familie' ? 'active' : ''}
                  onClick={() => selectHousehold('familie')}
                  aria-pressed={activeHousehold === 'familie'}
                >
                  <Home size={18} />
                  <span>{t('header.ourHome')}</span>
                </button>
                <button
                  type="button"
                  className={activeHousehold === 'oma_opa' ? 'active grandparents' : ''}
                  onClick={() => selectHousehold('oma_opa')}
                  aria-pressed={activeHousehold === 'oma_opa'}
                >
                  <Users size={18} />
                  <span>{t('header.grandparentsHome')}</span>
                </button>
              </div>
            </section>
          )}

          <span className="mobile-nav-section-label">
            {t('header.menu.settings')}
          </span>
          {onOpenFamilySettings && (
            <button
              type="button"
              className="mobile-nav-action-btn"
              onClick={runAction(onOpenFamilySettings)}
            >
              <Settings size={18} />
              <span>{t('header.manageFamily')}</span>
            </button>
          )}
          {showTabletMode && (
            <button
              type="button"
              className={`mobile-nav-action-btn ${isTabletModeActive ? 'is-active' : ''}`}
              onClick={runAction(onToggleTabletMode)}
            >
              <Tablet size={18} />
              <span>{isTabletModeActive ? t('header.tabletMode.exit') : t('header.tabletMode.enter')}</span>
            </button>
          )}
          <LanguageSwitcher />
          <button
            type="button"
            className="mobile-nav-action-btn"
            onClick={runAction(onOpenTheme)}
          >
            <Sparkles size={18} style={{ color: 'var(--primary)' }} />
            <span>{t('header.themePicker.kicker')}</span>
          </button>
          {onOpenServerConfig && (
            <button
              type="button"
              className="mobile-nav-action-btn"
              onClick={runAction(onOpenServerConfig)}
            >
              <Server size={18} />
              <span>{t('header.serverConfigTitle')}</span>
            </button>
          )}
          <button
            type="button"
            className="mobile-nav-action-btn mobile-nav-action-danger"
            onClick={runAction(onLogout)}
          >
            <LogOut size={18} />
            <span>{t('header.logoutTitle')}</span>
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}
