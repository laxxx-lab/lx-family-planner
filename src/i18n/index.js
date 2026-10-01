import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { plannerApiFetch } from '../utils/apiConfig.js';
import { resources } from './resources.js';

export const SUPPORTED_LANGUAGES = ['de', 'en', 'fr', 'es', 'it', 'nl', 'pl', 'zh'];
export const DEFAULT_LANGUAGE = 'de';
const LANGUAGE_STORAGE_KEY = 'lx_family_language';

export function normalizeLanguage(value) {
  const clean = String(value || '').trim().toLowerCase().slice(0, 2);
  return SUPPORTED_LANGUAGES.includes(clean) ? clean : '';
}

function getStoredLanguage() {
  try {
    return normalizeLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY));
  } catch {
    return '';
  }
}

export function setStoredLanguage(language) {
  try {
    const clean = normalizeLanguage(language);
    if (clean) {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, clean);
    } else {
      localStorage.removeItem(LANGUAGE_STORAGE_KEY);
    }
  } catch {
    // Ignore
  }
}

function applyDocumentMetadata(language) {
  document.documentElement.lang = language;
  document.title = i18n.t('common:app.title');
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute('content', i18n.t('common:app.description'));
  }
}

export function applyLanguage(language) {
  const clean = normalizeLanguage(language) || DEFAULT_LANGUAGE;
  if (i18n.language !== clean) {
    i18n.changeLanguage(clean).then(() => applyDocumentMetadata(clean));
  } else {
    applyDocumentMetadata(clean);
  }
  return clean;
}

async function fetchServerLanguage() {
  try {
    const response = await plannerApiFetch('/api/config');
    if (!response.ok) return '';
    const data = await response.json();
    return normalizeLanguage(data?.language);
  } catch {
    return '';
  }
}

export async function initI18n() {
  const startupLanguage =
    getStoredLanguage() ||
    normalizeLanguage(import.meta.env.VITE_APP_LANGUAGE) ||
    DEFAULT_LANGUAGE;

  await i18n.use(initReactI18next).init({
    resources,
    lng: startupLanguage,
    // Fallback auf EN: neue Sprachen können schrittweise gepflegt werden,
    // fehlende Keys zeigen stattdessen den englischen Text.
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    interpolation: {
      // React übernimmt das Escaping bereits selbst.
      escapeValue: false
    },
    returnNull: false
  });
  applyDocumentMetadata(i18n.language);

  // Die Server-Einstellung (APP_LANGUAGE) gewinnt, sobald sie geladen ist –
  // außer die Familie hat lokal bereits eine Sprache gewählt.
  if (!getStoredLanguage()) {
    fetchServerLanguage().then(serverLanguage => {
      if (serverLanguage) applyLanguage(serverLanguage);
    });
  }

  return i18n;
}

export default i18n;
