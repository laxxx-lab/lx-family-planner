import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeSchoolTimetable, resolveSchoolLesson } from '../shared/schoolTimetable.js';

test('one family period supplies times to lessons on different weekdays', () => {
  const template = normalizeSchoolTimetable({ periods: [{ period: 1, label: 'First', time: '08:00', endTime: '08:45' }], subjects: ['Maths', 'Maths', 'English'] });
  assert.deepEqual(template.subjects, ['Maths', 'English']);
  for (const weekday of [1, 4]) {
    const lesson = resolveSchoolLesson({ kind: 'lesson', period: 1, weekday, usesTimetableTemplate: true, time: '09:00' }, template);
    assert.equal(lesson.time, '08:00');
    assert.equal(lesson.endTime, '08:45');
  }
  const legacy = resolveSchoolLesson({ kind: 'lesson', period: 1, time: '09:00' }, template);
  assert.equal(legacy.time, '09:00');
});

test('school templates reject malformed, reversed and overlapping times', () => {
  for (const periods of [
    [{ period: 1, time: '25:00', endTime: '25:45' }],
    [{ period: 1, time: '08:45', endTime: '08:00' }],
    [{ period: 1, time: '08:00', endTime: '08:45' }, { period: 2, time: '08:30', endTime: '09:00' }],
    [{ period: 1, time: '08:00', endTime: '08:45' }, { period: 1, time: '09:00', endTime: '09:45' }]
  ]) assert.throws(() => normalizeSchoolTimetable({ periods }), { code: 'INVALID_SCHOOL_TIMETABLE' });
});
