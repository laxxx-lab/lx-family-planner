function normalizedText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();
}

export function eventMatchesCalendarSearch(event, query) {
  const words = normalizedText(query).trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return true;
  const searchable = normalizedText([
    event?.title,
    event?.location,
    event?.notes
  ].join(' '));
  return words.every(word => searchable.includes(word));
}
