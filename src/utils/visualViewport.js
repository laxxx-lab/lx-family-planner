export function visualViewportDialogMetrics(viewport, fallbackHeight) {
  const height = Number(viewport?.height) > 0
    ? Math.round(viewport.height)
    : Math.max(0, Math.round(fallbackHeight || 0));
  const offsetTop = Math.max(0, Math.round(Number(viewport?.offsetTop) || 0));
  return { height, offsetTop };
}
