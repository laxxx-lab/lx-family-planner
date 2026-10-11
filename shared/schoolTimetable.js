const TIME = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function normalizeSchoolTimetable(value) {
  const periods = (Array.isArray(value?.periods) ? value.periods : [])
    .slice(0, 20)
    .filter(entry => entry?.time || entry?.endTime)
    .map(entry => ({
      period: Number(entry.period),
      label: String(entry.label || '').trim().slice(0, 60),
      time: String(entry.time || ''),
      endTime: String(entry.endTime || '')
    })).sort((left, right) => left.period - right.period);
  if (periods.some((entry, index) =>
    !Number.isInteger(entry.period) || entry.period < 1 || entry.period > 20 ||
    !TIME.test(entry.time) || !TIME.test(entry.endTime) || entry.endTime <= entry.time ||
    (index > 0 && (periods[index - 1].period === entry.period || periods[index - 1].endTime > entry.time))
  )) {
    const error = new Error('Lesson periods need valid, non-overlapping start and end times.');
    error.code = 'INVALID_SCHOOL_TIMETABLE';
    error.statusCode = 400;
    throw error;
  }
  const subjects = [...new Set((Array.isArray(value?.subjects) ? value.subjects : [])
    .map(subject => String(subject).trim().slice(0, 80)).filter(Boolean))].slice(0, 50);
  return { periods, subjects };
}

export function resolveSchoolLesson(lesson, template) {
  if (lesson.kind !== 'lesson' || !lesson.usesTimetableTemplate) return lesson;
  const period = template?.periods?.find(entry => Number(entry.period) === Number(lesson.period));
  return period ? { ...lesson, time: period.time, endTime: period.endTime } : lesson;
}
