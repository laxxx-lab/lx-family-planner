import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFamily } from '../context/FamilyContext';
import i18n from '../i18n/index.js';

const MAX_FAVORITES = 5;
const PINNED_FAVORITE_ID = 'dashboard';
const DEFAULT_FAVORITE_IDS = ['dashboard', 'calendar', 'tasks', 'shopping'];
const FAVORITES_CHANGED_EVENT = 'lx-navigation-favorites-changed';

function storageKey(familyId, memberId) {
  return `lx_navigation_favorites:${familyId || 'family'}:${memberId || 'member'}`;
}

function normalizeFavoriteIds(value, visibleIds) {
  const allowed = new Set(visibleIds);
  const requested = Array.isArray(value) ? value : [];
  const normalized = requested.filter(
    (id, index) => allowed.has(id) && requested.indexOf(id) === index
  );
  const requestedFavorites = normalized.length
    ? normalized
    : DEFAULT_FAVORITE_IDS.filter(id => allowed.has(id));
  // The personal dashboard is the fixed first quick link; the rest remains
  // freely configurable and ordered by the profile owner.
  const pinned = allowed.has(PINNED_FAVORITE_ID) ? [PINNED_FAVORITE_ID] : [];
  return [...pinned, ...requestedFavorites.filter(id => id !== PINNED_FAVORITE_ID)]
    .slice(0, MAX_FAVORITES);
}

function sameIds(left, right) {
  return left.length === right.length &&
    left.every((value, index) => value === right[index]);
}

/** Per-profile quick links stay on the current device, so each person can keep
 * the main bar short without changing the navigation for the whole family. */
export function useNavigationFavorites(visibleTabs) {
  const { activeFamilyId, activeMember, showToast } = useFamily();
  const visibleIds = useMemo(
    () => visibleTabs.map(tab => tab.id),
    [visibleTabs]
  );
  const visibleIdsKey = visibleIds.join('|');
  const key = storageKey(activeFamilyId, activeMember?.id);
  const stateKey = `${key}|${visibleIdsKey}`;
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loadedStateKey, setLoadedStateKey] = useState('');

  useEffect(() => {
    let stored = null;
    try {
      const raw = localStorage.getItem(key);
      stored = raw === null ? null : JSON.parse(raw);
    } catch {
      // Local storage may be disabled in private browser contexts.
    }
    const normalized = normalizeFavoriteIds(stored, visibleIds);
    setFavoriteIds(previous => sameIds(previous, normalized) ? previous : normalized);
    setLoadedStateKey(stateKey);
  }, [key, stateKey, visibleIdsKey]);

  useEffect(() => {
    // Navigation and the drawer mount independently. Do not let the second
    // instance write its initial empty state before both have read storage.
    if (loadedStateKey !== stateKey) return;
    try {
      localStorage.setItem(key, JSON.stringify(favoriteIds));
      window.dispatchEvent(new CustomEvent(FAVORITES_CHANGED_EVENT, {
        detail: { key, favoriteIds }
      }));
    } catch {
      // Favorites remain available for this session even without storage.
    }
  }, [favoriteIds, key, loadedStateKey, stateKey]);

  useEffect(() => {
    const syncFavorites = event => {
      if (event.detail?.key !== key) return;
      const next = normalizeFavoriteIds(event.detail.favoriteIds, visibleIds);
      setFavoriteIds(previous => sameIds(previous, next) ? previous : next);
    };
    window.addEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
    return () => window.removeEventListener(FAVORITES_CHANGED_EVENT, syncFavorites);
  }, [key, visibleIdsKey]);

  const toggleFavorite = useCallback(id => {
    if (!visibleIds.includes(id)) return;
    if (!favoriteIds.includes(id) && favoriteIds.length >= MAX_FAVORITES) {
      showToast(i18n.t('chrome:navigation.favorites'),
        i18n.t('chrome:navigation.favoritesLimit', { count: MAX_FAVORITES }), 'info');
      return;
    }
    setFavoriteIds(previous => {
      if (id === PINNED_FAVORITE_ID) return previous;
      if (previous.includes(id)) {
        return previous.length > 1
          ? previous.filter(value => value !== id)
          : previous;
      }
      return previous.length >= MAX_FAVORITES ? previous : [...previous, id];
    });
  }, [visibleIds, favoriteIds, showToast]);

  const favoriteTabs = useMemo(
    () => favoriteIds
      .map(id => visibleTabs.find(tab => tab.id === id))
      .filter(Boolean),
    [favoriteIds, visibleTabs]
  );

  return {
    favoriteIds,
    favoriteTabs,
    toggleFavorite,
    maxFavorites: MAX_FAVORITES
  };
}
