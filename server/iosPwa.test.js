import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isAppleMobileDevice,
  shouldOfferIosInstall
} from '../src/utils/iosPwa.js';
import { visualViewportDialogMetrics } from '../src/utils/visualViewport.js';

test('iPhone and iPad browsers receive the home screen offer only when needed', () => {
  assert.equal(
    isAppleMobileDevice({ userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' }),
    true
  );
  assert.equal(
    isAppleMobileDevice({ platform: 'MacIntel', maxTouchPoints: 5 }),
    true
  );
  assert.equal(
    shouldOfferIosInstall({
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)',
      standalone: false,
      dismissedUntil: 0,
      now: 100
    }),
    true
  );
  assert.equal(
    shouldOfferIosInstall({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      standalone: true,
      dismissedUntil: 0,
      now: 100
    }),
    false
  );
  assert.equal(
    shouldOfferIosInstall({
      userAgent: 'Mozilla/5.0 (Linux; Android 15)',
      standalone: false,
      dismissedUntil: 0,
      now: 100
    }),
    false
  );
  assert.equal(
    shouldOfferIosInstall({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
      standalone: false,
      dismissedUntil: 101,
      now: 100
    }),
    false
  );
});

test('input dialogs stay within the visible iOS viewport above the keyboard', () => {
  assert.deepEqual(
    visualViewportDialogMetrics({ height: 412, offsetTop: 176 }, 844),
    { height: 412, offsetTop: 176 }
  );
  assert.deepEqual(
    visualViewportDialogMetrics({ height: 0, offsetTop: -20 }, 844),
    { height: 844, offsetTop: 0 }
  );
});
