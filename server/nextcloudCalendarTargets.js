function text(value, limit = 2000) {
  return String(value || '').trim().slice(0, limit);
}

export function routeEventToCalendarTarget(
  event,
  { sharedTarget, personalTargets = [] }
) {
  const memberIds = [...new Set(
    Array.isArray(event?.memberIds) ? event.memberIds.filter(Boolean) : []
  )];
  if (memberIds.length === 1) {
    const personalTarget = personalTargets.find(target =>
      target?.kind === 'member' &&
      target.enabled &&
      target.memberId === memberIds[0]
    );
    if (personalTarget) return personalTarget;
  }
  return sharedTarget?.enabled ? sharedTarget : null;
}

export function targetProvider(target) {
  return target?.kind === 'family'
    ? 'nextcloud'
    : `nextcloud-target:${text(target?.id, 100)}`;
}

export function normalizePersonalCalendarTarget(
  input,
  members = [],
  existingTargets = []
) {
  const memberId = text(input?.memberId, 100);
  const memberIds = new Set(
    members.map(member => text(typeof member === 'string' ? member : member?.id, 100))
  );
  if (!memberId || !memberIds.has(memberId)) {
    throw new Error('Das Familienmitglied ist ungültig.');
  }
  if (existingTargets.some(target => target?.memberId === memberId)) {
    throw new Error('Für dieses Familienmitglied besteht bereits ein Kalenderziel.');
  }
  const calendarHref = text(input?.calendarHref);
  if (!calendarHref) throw new Error('Der Kalender fehlt.');

  return {
    id: text(input?.id, 100),
    kind: 'member',
    memberId,
    name: text(input?.name, 200),
    calendarHref,
    enabled: input?.enabled !== false
  };
}
