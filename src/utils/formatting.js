import i18n from '../i18n/index.js';

// Zentrale Zuordnung von App-Sprache zu Formatierungs-Locale.
const LOCALE_BY_LANGUAGE = {
  de: 'de-DE',
  en: 'en-GB',
  zh: 'zh-CN'
};

export function getActiveLocale() {
  return LOCALE_BY_LANGUAGE[i18n.language] || LOCALE_BY_LANGUAGE.de;
}

export function formatDate(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(getActiveLocale(), options);
}

export function formatTime(value, options = { hour: '2-digit', minute: '2-digit' }) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString(getActiveLocale(), options);
}

export function formatDateTime(value, options = {}) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(getActiveLocale(), options);
}

export function formatNumber(value, options = {}) {
  return new Intl.NumberFormat(getActiveLocale(), options).format(value);
}

export function formatCurrency(value, currency = 'EUR', options = {}) {
  return new Intl.NumberFormat(getActiveLocale(), {
    style: 'currency',
    currency,
    ...options
  }).format(value);
}

// Liefert die Wochentagsnamen in App-Sprache, beginnend bei Montag.
export function getWeekdayNames(width = 'long', startOnMonday = true) {
  const formatter = new Intl.DateTimeFormat(getActiveLocale(), { weekday: width });
  // Der 5. Januar 2026 ist ein Montag, der 4. Januar ein Sonntag.
  const firstDay = startOnMonday ? 5 : 4;
  return Array.from({ length: 7 }, (_, index) =>
    formatter.format(new Date(Date.UTC(2026, 0, firstDay + index, 12)))
  );
}

export function compareStrings(a, b, options = { sensitivity: 'base' }) {
  return String(a ?? '').localeCompare(String(b ?? ''), getActiveLocale(), options);
}

export function toLocaleLowerCase(value) {
  return String(value ?? '').toLocaleLowerCase(getActiveLocale());
}
