import assert from 'node:assert/strict';
import test from 'node:test';
import { eventMatchesCalendarSearch } from '../shared/calendarSearch.js';

test('calendar search matches every query word across title, location and notes', () => {
  const event = {
    title: 'Zahnarzttermin',
    location: 'Praxis am Park',
    notes: 'Impfpass mitnehmen'
  };

  assert.equal(eventMatchesCalendarSearch(event, 'zahnarzt park'), true);
  assert.equal(eventMatchesCalendarSearch(event, 'Park Impfpass'), true);
  assert.equal(eventMatchesCalendarSearch(event, 'zahnarzt schule'), false);
});

test('calendar search ignores casing, accents and empty queries', () => {
  const event = { title: 'Überraschung für Jörg' };

  assert.equal(eventMatchesCalendarSearch(event, 'uberraschung jorg'), true);
  assert.equal(eventMatchesCalendarSearch(event, '   '), true);
});
