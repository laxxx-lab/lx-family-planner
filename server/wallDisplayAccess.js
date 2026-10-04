const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function isWallDisplayMember(member) {
  return member?.role === 'wall';
}

export function wallDisplayMutationAllowed({ method, path, body, session }) {
  const normalizedMethod = String(method || 'GET').toUpperCase();
  const normalizedPath = String(path || '');
  if (SAFE_METHODS.has(normalizedMethod)) return true;
  if (normalizedMethod === 'POST' && ['/api/auth/logout', '/api/auth/member'].includes(normalizedPath)) {
    return true;
  }
  if (
    normalizedMethod === 'PATCH' && session?.memberId &&
    normalizedPath === `/api/members/${session.memberId}`
  ) {
    const changes = body && typeof body === 'object' ? body : {};
    return Object.keys(changes).length === 1 && typeof changes.theme === 'string';
  }
  if (
    normalizedMethod === 'POST' &&
    /^\/api\/tasks\/[^/]+\/toggle$/.test(normalizedPath)
  ) {
    return true;
  }
  if (
    normalizedMethod === 'PATCH' &&
    /^\/api\/resources\/shoppingItems\/[^/]+$/.test(normalizedPath)
  ) {
    const changes = body && typeof body === 'object' ? body : {};
    const keys = Object.keys(changes);
    return (
      keys.length === 1 &&
      keys[0] === 'inCart' &&
      typeof changes.inCart === 'boolean'
    );
  }
  return false;
}
