export const SCHOOL_SUBJECT_COLORS = Object.freeze([
  { value: '#3d7ea6', labelKey: 'school.colors.ocean' },
  { value: '#648b62', labelKey: 'school.colors.meadow' },
  { value: '#bd8a3d', labelKey: 'school.colors.ochre' },
  { value: '#b66457', labelKey: 'school.colors.terracotta' },
  { value: '#786da6', labelKey: 'school.colors.indigo' },
  { value: '#ad6681', labelKey: 'school.colors.berry' },
  { value: '#60798a', labelKey: 'school.colors.slate' },
  { value: '#4d91b8', labelKey: 'school.colors.sky' },
  { value: '#2c937d', labelKey: 'school.colors.jade' },
  { value: '#4d9b70', labelKey: 'school.colors.fern' },
  { value: '#d19a3f', labelKey: 'school.colors.amber' },
  { value: '#cc7357', labelKey: 'school.colors.coral' },
  { value: '#bf698a', labelKey: 'school.colors.rose' },
  { value: '#9675b0', labelKey: 'school.colors.lilac' },
  { value: '#7184a0', labelKey: 'school.colors.steel' },
  { value: '#8b7658', labelKey: 'school.colors.cocoa' }
]);

const allowedColors = new Set(SCHOOL_SUBJECT_COLORS.map(color => color.value));

export function normalizeSchoolSubjectKey(value) {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLocaleLowerCase()
    .slice(0, 80);
}

export function normalizeSchoolSubjectColors(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value)
      .map(([subject, color]) => [
        normalizeSchoolSubjectKey(subject),
        String(color || '').trim().toLocaleLowerCase()
      ])
      .filter(([subject, color]) => subject && allowedColors.has(color))
      .slice(0, 40)
  );
}

export function resolveSchoolSubjectColor(subject, colors, fallback = '') {
  const key = normalizeSchoolSubjectKey(subject);
  const mapped = normalizeSchoolSubjectColors(colors)[key];
  const legacy = String(fallback || '').trim().toLocaleLowerCase();
  return mapped || (allowedColors.has(legacy) ? legacy : '');
}
