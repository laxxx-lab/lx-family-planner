import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useFamily } from '../context/FamilyContext';
import { HeartHandshake, Tablet, Star, LogOut, Home, Users, Sparkles, Settings, PawPrint, X, Server, Code2, Monitor, Menu } from 'lucide-react';
import { isChildProfile, isPetProfile, isWallProfile } from '../constants/roles';
import {
  ADULT_THEMES,
  CHILD_THEMES,
  CUSTOM_THEME_ID,
  PET_THEMES
} from '../constants/themes';
import { parseCustomThemeCss } from '../../shared/customThemeCss.js';
import FamilyEditModal from './FamilyTree/FamilyEditModal';
import PlanLocationHelp from './PlanLocationHelp';
import NotificationCenter from './Notifications/NotificationCenter';
import CustomThemeEditor from './Theme/CustomThemeEditor';
import LanguageSwitcher from './LanguageSwitcher';
import MobileNavDrawer from './MobileNavDrawer';
import { useViewportScrollLock } from '../hooks/useViewportScrollLock';
import { PRODUCT_NAME, PRODUCT_TAGLINE } from '../../shared/brand.js';

export default function Header({ onLogout, onOpenServerConfig, onOpenFamilyTree, unreadChatCount = 0 }) {
  const { t } = useTranslation('chrome');
  const {
    theme, setTheme,
    activeTab, setActiveTab,
    activeHousehold, setActiveHousehold,
    activeMember, familyAccount,
    setIsProfileModalOpen, showToast,
    previewCustomThemeCss, restoreCustomThemeCss, saveCustomThemeCss
  } = useFamily();

  const [isThemePickerOpen, setIsThemePickerOpen] = useState(false);
  const [isCustomThemeOpen, setIsCustomThemeOpen] = useState(false);
  const [customThemePreviewActive, setCustomThemePreviewActive] = useState(false);
  const [isFamilySettingsOpen, setIsFamilySettingsOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const headerRef = useRef(null);
  const [mobileHeaderHeight, setMobileHeaderHeight] = useState(0);
  useViewportScrollLock(isThemePickerOpen);
  const isChild = isChildProfile(activeMember);
  const isPet = isPetProfile(activeMember);
  const isWall = isWallProfile(activeMember);
  const grandparentsHouseholdEnabled =
    familyAccount?.grandparentsHouseholdEnabled !== false;
  const customThemeResult = parseCustomThemeCss(
    activeMember?.customThemeCss || ''
  );
  const customThemeOption = customThemeResult.css
    ? {
        id: CUSTOM_THEME_ID,
        plain: true,
        custom: true,
        color: customThemeResult.variables['--primary'] || '#365f55',
        accent: customThemeResult.variables['--accent'] || '#b56f52'
      }
    : null;
  const availableThemes = isPet
    ? PET_THEMES
    : isChild
      ? CHILD_THEMES
      : customThemeOption
        ? [...ADULT_THEMES, customThemeOption]
        : ADULT_THEMES;
  const themeGroup = isPet ? 'pet' : isChild ? 'child' : 'adult';
  const themePickerTitle = isPet
    ? t('header.themePicker.titlePet', {
        name:
          activeMember?.name?.split(' ')[0] ||
          t('header.themePicker.petNameFallback')
      })
    : isChild
      ? t('header.themePicker.titleChild')
      : t('header.themePicker.titleAdult');
  const themePickerDescription = isPet
    ? t('header.themePicker.descriptionPet')
    : isChild
      ? t('header.themePicker.descriptionChild')
      : t('header.themePicker.descriptionAdult');
  const themeGroups = !isChild && !isPet
    ? [
        {
          id: 'plain',
          title: t('header.themePicker.groups.plain'),
          themes: availableThemes.filter(option => option.plain)
        },
        {
          id: 'expressive',
          title: t('header.themePicker.groups.expressive'),
          themes: availableThemes.filter(option => !option.plain)
        }
      ]
    : [{ id: 'worlds', title: '', themes: availableThemes }];

  const closeThemePicker = () => {
    if (customThemePreviewActive) restoreCustomThemeCss();
    setCustomThemePreviewActive(false);
    setIsCustomThemeOpen(false);
    setIsThemePickerOpen(false);
  };

  // On iOS Safari a sticky flex item can disappear once the browser's visual
  // viewport changes. The phone header is therefore fixed and this measured
  // spacer keeps the page content exactly where it belongs below it.
  useLayoutEffect(() => {
    const header = headerRef.current;
    if (!header) return undefined;

    const updateHeight = () => {
      const nextHeight = Math.ceil(header.getBoundingClientRect().height);
      setMobileHeaderHeight(previous =>
        previous === nextHeight ? previous : nextHeight
      );
    };

    updateHeight();
    const observer = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(updateHeight);
    observer?.observe(header);
    window.addEventListener('resize', updateHeight);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  useEffect(() => {
    if (!isThemePickerOpen) return undefined;
    const closeOnEscape = event => {
      if (event.key === 'Escape') closeThemePicker();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isThemePickerOpen, customThemePreviewActive, restoreCustomThemeCss]);

  const toggleHousehold = (targetHousehold) => {
    setActiveHousehold(targetHousehold);
    showToast(
      t('header.householdSwitched'),
      targetHousehold === 'familie' ? t('header.householdViewFamily') : t('header.householdViewGrandparents'),
      'info'
    );
  };

  return (
    <>
    <header className="app-header" ref={headerRef}>
      <button
        type="button"
        className="icon-circle-btn app-menu-btn"
        onClick={() => setIsMobileNavOpen(true)}
        aria-label={t('header.menu.open')}
        aria-expanded={isMobileNavOpen}
        aria-haspopup="dialog"
      >
        <Menu size={20} />
      </button>
      <a href="#" className="brand-logo" onClick={(e) => { e.preventDefault(); setActiveTab('dashboard'); }}>
        <div className="brand-icon-wrapper">
          <HeartHandshake size={26} />
        </div>
        <div className="brand-text">
          <h1>{PRODUCT_NAME}</h1>
          <p>{PRODUCT_TAGLINE}</p>
        </div>
      </a>

      {/* Household planning context */}
      {!isChild && !isPet && grandparentsHouseholdEnabled && <div
        className="household-switcher mobile-header-context"
        role="group"
        aria-label={t('header.planLocationAria')}
      >
        <span className="household-switcher-label">
          {t('header.planLocation')}
          <PlanLocationHelp />
        </span>
        <button
          onClick={() => toggleHousehold('familie')}
          className={activeHousehold === 'familie' ? 'active' : ''}
          aria-pressed={activeHousehold === 'familie'}
        >
          <Home size={15} /> {t('header.ourHome')}
        </button>

        <button
          onClick={() => toggleHousehold('oma_opa')}
          className={activeHousehold === 'oma_opa' ? 'active grandparents' : ''}
          aria-pressed={activeHousehold === 'oma_opa'}
        >
          <Users size={15} /> {t('header.grandparentsHome')}
        </button>
      </div>}

      <div className="header-right">
        {!isPet && !isWall && <NotificationCenter />}
        {!isWall && <div className="hide-below-tablet"><LanguageSwitcher /></div>}
        {!isChild && !isPet && !isWall && (
          <button
            className="icon-circle-btn mobile-header-secondary-action"
            onClick={() => setIsFamilySettingsOpen(true)}
            title={t('header.manageFamily')}
          >
            <Settings size={18} />
          </button>
        )}
        {/* Role-aware theme worlds */}
        {<div className="theme-picker-wrap hide-below-tablet">
          <button
            className="icon-circle-btn"
            onClick={() => {
              if (isThemePickerOpen) closeThemePicker();
              else setIsThemePickerOpen(true);
            }}
            title={isPet ? t('header.themePicker.openPet') : isChild ? t('header.themePicker.openChild') : t('header.themePicker.openAdult')}
            aria-label={isPet ? t('header.themePicker.openPet') : isChild ? t('header.themePicker.openChild') : t('header.themePicker.openAdult')}
            aria-expanded={isThemePickerOpen}
          >
            <Sparkles size={20} style={{ color: 'var(--primary)' }} />
          </button>

          {isThemePickerOpen &&
            createPortal(
              <div
                className="theme-picker-layer"
                onPointerDown={closeThemePicker}
              >
                <section
                  className={`theme-picker theme-picker-portal ${
                    isCustomThemeOpen ? 'is-customizing' : ''
                  }`}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="theme-picker-title"
                  onPointerDown={event => event.stopPropagation()}
                >
                  <div className="theme-picker-title">
                    <span className="theme-picker-kicker">
                      <Sparkles size={14} /> {t('header.themePicker.kicker')}
                    </span>
                    <strong id="theme-picker-title">{themePickerTitle}</strong>
                    <span>{themePickerDescription}</span>
                    <button
                      type="button"
                      className="theme-picker-close"
                      onClick={closeThemePicker}
                      aria-label={t('header.themePicker.close')}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="theme-library">
                    {themeGroups.map(group => (
                      <section className="theme-library-group" key={group.id}>
                        {group.title && <h3>{group.title}</h3>}
                        <div>
                          {group.themes.map(themeOption => (
                            <button
                              key={themeOption.id}
                              onClick={() => {
                                setTheme(themeOption.id);
                                closeThemePicker();
                              }}
                              className={`theme-choice ${theme === themeOption.id ? 'active' : ''}`}
                              style={{ '--choice-color': themeOption.color, '--choice-accent': themeOption.accent }}
                              aria-pressed={theme === themeOption.id}
                            >
                              <span
                                className={`theme-choice-preview ${themeOption.plain ? 'is-plain' : ''} ${themeOption.custom ? 'is-custom' : ''}`}
                                aria-hidden="true"
                              >
                                {themeOption.plain
                                  ? <><i /><i /><i /></>
                                  : themeOption.icon}
                              </span>
                              <span className="theme-choice-copy">
                                <strong>{t(`header.themes.${themeGroup}.${themeOption.id}.name`)}</strong>
                                <small>{t(`header.themes.${themeGroup}.${themeOption.id}.description`)}</small>
                              </span>
                            </button>
                          ))}
                        </div>
                      </section>
                    ))}
                    {!isChild && !isPet && !isWall && (
                      <button
                        type="button"
                        className={`custom-theme-launch ${activeMember?.customThemeCss ? 'is-active' : ''}`}
                        onClick={() => setIsCustomThemeOpen(value => !value)}
                        aria-expanded={isCustomThemeOpen}
                      >
                        <Code2 size={17} />
                        <span>
                          <strong>
                            {t(activeMember?.customThemeCss
                              ? 'header.customTheme.editLaunch'
                              : 'header.customTheme.createLaunch')}
                          </strong>
                          <small>
                            {t(activeMember?.customThemeCss
                              ? 'header.customTheme.editLaunchHint'
                              : 'header.customTheme.createLaunchHint')}
                          </small>
                        </span>
                      </button>
                    )}
                  </div>
                  {isCustomThemeOpen && !isChild && !isPet && !isWall && (
                    <CustomThemeEditor
                      savedCss={activeMember?.customThemeCss || ''}
                      onPreview={previewCustomThemeCss}
                      onPreviewStateChange={setCustomThemePreviewActive}
                      onSave={saveCustomThemeCss}
                    />
                  )}
                </section>
              </div>,
              document.body
            )}
        </div>}

        {/* Tablet Dashboard Toggle */}
        {!isChild && !isPet && !isWall && <button
          className={`tablet-mode-btn mobile-header-secondary-action ${activeTab === 'kitchen' ? 'active' : ''}`}
          onClick={() => setActiveTab(activeTab === 'kitchen' ? 'dashboard' : 'kitchen')}
          title={activeTab === 'kitchen' ? t('header.tabletMode.exitTitle') : t('header.tabletMode.enterTitle')}
        >
          <Tablet size={18} />
          <span className="hide-mobile">
            {activeTab === 'kitchen' ? t('header.tabletMode.exit') : t('header.tabletMode.enter')}
          </span>
        </button>}

        {/* Profile Switcher Pill with Unread Chat Notification Badge */}
        {isWall ? (
          <button type="button" className="wall-display-badge" onClick={() => setIsProfileModalOpen(true)} title={t('header.wallDisplayHint')}>
            <Monitor size={17} />
            <span>{t('header.wallDisplay')}</span>
          </button>
        ) : <div className="profile-pill-btn" onClick={() => setIsProfileModalOpen(true)}>
          {activeMember?.avatar ? (
            <img src={activeMember.avatar} alt={activeMember.name} className="avatar-img-sm" />
          ) : (
            <div className="avatar-fallback-sm" style={{ backgroundColor: activeMember?.color || '#2563eb' }}>
              {activeMember?.name?.charAt(0) || 'F'}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
            <span className="profile-pill-name">{activeMember?.name?.split(' ')[0]}</span>
            {isChild && (
              <span style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Star size={10} fill="#f59e0b" /> {activeMember.stars || 0}★
              </span>
            )}
            {isPet && (
              <span className="profile-pill-pet">
                <PawPrint size={11} /> {t('header.pet')}
              </span>
            )}
          </div>

          {/* Unread Chat Badge Counter */}
          {!isPet && unreadChatCount > 0 && (
            <span style={{
              position: 'absolute', top: -4, right: -4,
              background: '#ef4444', color: 'white',
              fontSize: '0.75rem', fontWeight: 800,
              width: 20, height: 20, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(239, 68, 68, 0.5)'
            }}>
              {unreadChatCount}
            </span>
          )}
        </div>}

        {/* Server IP Config Button */}
        {onOpenServerConfig && !isWall && (
          <button
            className="icon-circle-btn hide-below-tablet"
            onClick={onOpenServerConfig}
            title={t('header.serverConfigTitle')}
          >
            <Server size={18} />
          </button>
        )}

        {/* Logout / Switch Family Button */}
        <button
          className="icon-circle-btn hide-below-tablet"
          onClick={onLogout}
          title={t('header.logoutTitle')}
        >
          <LogOut size={18} />
        </button>
      </div>
      <FamilyEditModal
        family={familyAccount}
        isOpen={isFamilySettingsOpen}
        onClose={() => setIsFamilySettingsOpen(false)}
      />
      <MobileNavDrawer
        isOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
        onOpenFamilyTree={onOpenFamilyTree}
        onOpenTheme={() => setIsThemePickerOpen(true)}
        onOpenServerConfig={onOpenServerConfig}
        onLogout={onLogout}
        onOpenFamilySettings={!isWall ? () => setIsFamilySettingsOpen(true) : undefined}
        showPlanningLocations={!isChild && !isPet && grandparentsHouseholdEnabled}
        activeHousehold={activeHousehold}
        onSelectHousehold={toggleHousehold}
        showTabletMode={!isChild && !isPet && !isWall}
        isTabletModeActive={activeTab === 'kitchen'}
        onToggleTabletMode={() => setActiveTab(activeTab === 'kitchen' ? 'dashboard' : 'kitchen')}
      />
    </header>
    <div
      className="mobile-header-spacer"
      aria-hidden="true"
      style={{ '--mobile-header-height': `${mobileHeaderHeight}px` }}
    />
    </>
  );
}
