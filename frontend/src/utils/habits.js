import { toISODate } from "./date";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dateKey(d) {
  return toISODate(d);
}

export function getHabitStreak(habit, today = new Date()) {
  const checkMap = new Set((habit.checkins || []).filter((c) => c.completed).map((c) => dateKey(c.date)));
  let streak = 0;
  const cursor = startOfDay(today);
  while (true) {
    const key = dateKey(cursor);
    if (!checkMap.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export function getWeeklyConsistency(habit, today = new Date()) {
  // Percentage of last 7 days that are marked completed.
  const checkMap = new Map((habit.checkins || []).map((c) => [dateKey(c.date), Boolean(c.completed)]));
  const cursor = startOfDay(today);
  let completed = 0;
  for (let i = 0; i < 7; i++) {
    const d = new Date(cursor);
    d.setDate(d.getDate() - i);
    const key = dateKey(d);
    if (checkMap.get(key)) completed += 1;
  }
  return Math.round((completed / 7) * 100);
}

