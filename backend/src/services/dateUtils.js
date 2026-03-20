const dayjs = require("dayjs");

function startOfDay(d) {
  return dayjs(d).startOf("day").toDate();
}

function endOfDay(d) {
  return dayjs(d).endOf("day").toDate();
}

function addDays(d, days) {
  return dayjs(d).add(days, "day").toDate();
}

function parseTimeToMinutes(hhmm) {
  // Expects "HH:mm" 24-hour format.
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(hhmm);
  if (!m) throw new Error(`Invalid time format: ${hhmm} (expected HH:mm)`);
  const hh = Number(m[1]);
  const mm = Number(m[2]);
  return hh * 60 + mm;
}

function minutesToTime(mins) {
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function normalizeDateInput(dateStrOrUndefined, fallback = new Date()) {
  if (!dateStrOrUndefined) return startOfDay(fallback);
  return startOfDay(new Date(dateStrOrUndefined));
}

function isoDateKey(d) {
  return dayjs(d).format("YYYY-MM-DD");
}

module.exports = {
  startOfDay,
  endOfDay,
  addDays,
  parseTimeToMinutes,
  minutesToTime,
  normalizeDateInput,
  isoDateKey,
};

