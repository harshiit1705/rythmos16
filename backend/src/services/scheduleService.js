const dayjs = require("dayjs");
const Task = require("../models/Task");
const Log = require("../models/Log");
const { startOfDay, endOfDay, isoDateKey, normalizeDateInput } = require("./dateUtils");
const { generateScheduleWithAI } = require("./aiPlanner");

async function detectAndLogMissedTasks(scheduleDate) {
  const scheduleDay = startOfDay(scheduleDate);

  // Missed tasks are those whose deadline day is strictly before the schedule day.
  const missed = await Task.find({
    status: "pending",
    deadline: { $lt: scheduleDay },
  }).select("_id title deadline missedDates");

  const createdLogs = [];

  for (const t of missed) {
    const missedDay = startOfDay(t.deadline);
    const missedKey = isoDateKey(missedDay);

    const alreadyLogged = (t.missedDates || []).some((d) => isoDateKey(d) === missedKey);
    if (alreadyLogged) continue;

    t.missedDates.push(missedDay);
    await t.save();

    createdLogs.push(
      await Log.create({
        type: "task_missed",
        date: missedDay,
        payload: { taskId: t._id, title: t.title, missedDate: missedKey },
      })
    );
  }

  return createdLogs.length;
}

async function upsertScheduleLog({ scheduleDate, payload }) {
  const start = startOfDay(scheduleDate);
  const end = endOfDay(scheduleDate);

  const existing = await Log.findOne({ type: "ai_schedule", date: { $gte: start, $lt: end } });

  if (existing) {
    existing.payload = payload;
    // Keep `date` anchored to the day for stable lookups.
    existing.date = start;
    await existing.save();
    return existing;
  }

  return Log.create({
    type: "ai_schedule",
    date: start,
    payload,
  });
}

async function getScheduleLogForDate(date) {
  const scheduleDate = normalizeDateInput(date);
  const start = startOfDay(scheduleDate);
  const end = endOfDay(scheduleDate);
  return Log.findOne({ type: "ai_schedule", date: { $gte: start, $lt: end } })
    .sort({ createdAt: -1 })
    .lean();
}

async function generateAndStoreSchedule({
  scheduleDate,
  availableTimeMinutes,
  startTime,
  wakeupTime,
  sleepTime,
  lunchTime,
  lunchDurationMinutes,
}) {
  const scheduleDay = normalizeDateInput(scheduleDate, new Date());
  const scheduleKey = isoDateKey(scheduleDay);

  // Smart rescheduler: detect overdue tasks and mark them missed before planning.
  await detectAndLogMissedTasks(scheduleDay);

  const tasks = await Task.find({ status: "pending" }).select(
    "_id title priority deadline estimatedMinutes missedDates"
  );

  const tasksWithFlags = tasks.map((t) => {
    const deadlineDay = t.deadline ? startOfDay(t.deadline) : null;
    const missed = deadlineDay ? deadlineDay.getTime() < scheduleDay.getTime() : false;
    return { ...t.toObject(), missed };
  });

  const { slots, unscheduled } = await generateScheduleWithAI({
    tasks: tasksWithFlags,
    availableTimeMinutes,
    startTime,
    wakeupTime,
    sleepTime,
    lunchTime,
    lunchDurationMinutes,
    scheduleDate: scheduleKey,
  });

  const payload = {
    date: scheduleKey,
    availableTimeMinutes,
    startTime,
    wakeupTime,
    sleepTime,
    lunchTime,
    lunchDurationMinutes,
    slots,
    unscheduled,
  };

  const log = await upsertScheduleLog({ scheduleDate: scheduleDay, payload });
  return { schedule: payload, logId: log._id };
}

module.exports = {
  generateAndStoreSchedule,
  getScheduleLogForDate,
  upsertScheduleLog,
};

