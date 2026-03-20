const cron = require("node-cron");
const dayjs = require("dayjs");

const { addDays, startOfDay } = require("../services/dateUtils");
const { generateAndStoreSchedule } = require("../services/scheduleService");
const { generateAndStoreWeeklyReview } = require("../services/reviewService");

let started = false;

function getTimezone() {
  return process.env.CRON_TIMEZONE || "UTC";
}

function startCronJobs() {
  if (started) return;
  started = true;

  function parseTimeToMinutes(t) {
    const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t || ""));
    if (!m) return null;
    const hh = Number(m[1]);
    const mm = Number(m[2]);
    return hh * 60 + mm;
  }

  // Nightly schedule for the next day.
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        const tomorrow = addDays(new Date(), 1);

        const wakeupTime = process.env.DEFAULT_WAKEUP_TIME || process.env.DEFAULT_START_TIME || "09:00";
        const sleepTime = process.env.DEFAULT_SLEEP_TIME;
        const lunchTime = process.env.DEFAULT_LUNCH_TIME;
        const lunchDurationMinutes = Number(process.env.DEFAULT_LUNCH_DURATION_MINUTES || 60);

        // Derive focus minutes if we have wake+sleep; otherwise fall back to legacy defaults.
        let availableTimeMinutes = Number(process.env.DEFAULT_AVAILABLE_MINUTES || 6 * 60);
        if (sleepTime) {
          const wakeMins = parseTimeToMinutes(wakeupTime);
          const sleepMins = parseTimeToMinutes(sleepTime);
          if (wakeMins !== null && sleepMins !== null && sleepMins > wakeMins) {
            const total = sleepMins - wakeMins;
            const lunchMins = parseTimeToMinutes(lunchTime);
            if (lunchMins !== null && lunchMins >= wakeMins && lunchMins < sleepMins) {
              availableTimeMinutes = Math.max(0, total - lunchDurationMinutes);
            } else {
              availableTimeMinutes = total;
            }
          }
        }

        await generateAndStoreSchedule({
          scheduleDate: startOfDay(tomorrow),
          availableTimeMinutes,
          startTime: wakeupTime,
          wakeupTime,
          sleepTime,
          lunchTime,
          lunchDurationMinutes,
        });
        console.log("[cron] generated schedule for tomorrow");
      } catch (err) {
        console.error("[cron] schedule generation failed:", err);
      }
    },
    { timezone: getTimezone() }
  );

  // Weekly AI review every Sunday.
  // We compute the "last 7 days" review window ending at the current moment.
  cron.schedule(
    "0 1 * * 0",
    async () => {
      try {
        const end = new Date();
        const weekStart = dayjs(end).subtract(6, "day").toDate();
        await generateAndStoreWeeklyReview({ weekStart, weekEnd: end });
        console.log("[cron] generated weekly AI review");
      } catch (err) {
        console.error("[cron] weekly review failed:", err);
      }
    },
    { timezone: getTimezone() }
  );
}

module.exports = { startCronJobs };

