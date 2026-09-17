function localDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0')
  ].join('-');
}

function localDateForKey(value) {
  return new Date(`${value}T12:00:00`);
}

export function weekStartFor(date = new Date()) {
  const result = new Date(date);
  result.setHours(12, 0, 0, 0);
  result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
  return localDateKey(result);
}

export function shiftWeekStart(weekStart, weeks) {
  const result = localDateForKey(weekStart);
  result.setDate(result.getDate() + Number(weeks || 0) * 7);
  return localDateKey(result);
}

export function mealBelongsToWeek(meal, weekStart, currentWeekStart) {
  return meal.weekStart
    ? meal.weekStart === weekStart
    : weekStart === currentWeekStart;
}
