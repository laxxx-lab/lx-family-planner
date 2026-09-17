import { useEffect } from 'react';
import { visualViewportDialogMetrics } from '../utils/visualViewport.js';

export function useVisualViewportDialog(isOpen, backdropRef) {
  useEffect(() => {
    if (!isOpen) return undefined;
    const viewport = window.visualViewport;
    const update = () => {
      const { height, offsetTop } = visualViewportDialogMetrics(
        viewport,
        window.innerHeight
      );
      backdropRef.current?.style.setProperty('--dialog-viewport-height', `${height}px`);
      backdropRef.current?.style.setProperty('--dialog-viewport-offset', `${offsetTop}px`);
      backdropRef.current?.classList.toggle(
        'is-visual-viewport-constrained',
        height < window.innerHeight || offsetTop > 0
      );
    };
    update();
    viewport?.addEventListener('resize', update);
    viewport?.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      viewport?.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      backdropRef.current?.classList.remove('is-visual-viewport-constrained');
    };
  }, [backdropRef, isOpen]);
}
