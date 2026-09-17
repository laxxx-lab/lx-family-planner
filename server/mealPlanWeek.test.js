import assert from 'node:assert/strict';
import test from 'node:test';
import {
  mealBelongsToWeek,
  shiftWeekStart,
  weekStartFor
} from '../src/utils/mealPlanWeek.js';

test('meal plans use local Mondays and keep legacy meals in the current week', () => {
  assert.equal(
    weekStartFor(new Date('2026-09-17T12:00:00')),
    '2026-09-14'
  );
  assert.equal(shiftWeekStart('2026-09-14', -1), '2026-09-07');
  assert.equal(shiftWeekStart('2026-09-14', 1), '2026-09-21');
  assert.equal(
    mealBelongsToWeek({ weekStart: '2026-09-21' }, '2026-09-21', '2026-09-14'),
    true
  );
  assert.equal(
    mealBelongsToWeek({}, '2026-09-21', '2026-09-14'),
    false
  );
  assert.equal(
    mealBelongsToWeek({}, '2026-09-14', '2026-09-14'),
    true
  );
});
