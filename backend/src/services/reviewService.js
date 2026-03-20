const { startOfDay, endOfDay, isoDateKey, normalizeDateInput } = require("./dateUtils");
const Log = require("../models/Log");
const Task = require("../models/Task");
const { generateReviewWithAI } = require("./aiReviewer");

async function upsertReviewLog({ weekStart, payload }) {
  const start = startOfDay(weekStart);
  const existing = await Log.findOne({ type: "ai_review", date: { $gte: start, $lt: endOfDay(weekStart) } });
  if (existing) {
    existing.payload = payload;
    existing.date = start;
    await existing.save();
    return existing;
  }
  return Log.create({ type: "ai_review", date: start, payload });
}

async function generateAndStoreWeeklyReview({ weekStart, weekEnd }) {
  const ws = normalizeDateInput(weekStart, new Date());
  const we = endOfDay(weekEnd || new Date());

  const logsMissed = await Log.find({ type: "task_missed", date: { $gte: ws, $lte: we } }).lean();
  const logsCompleted = await Log.find({ type: "task_completed", date: { $gte: ws, $lte: we } }).lean();
  const habitMarks = await Log.find({ type: "habit_mark", date: { $gte: ws, $lte: we } }).lean();

  const missedTaskIds = [...new Set(logsMissed.map((l) => String(l.payload?.taskId)))].filter(Boolean);

  const missedTasks = await Task.find({ _id: { $in: missedTaskIds } }).select(
    "_id title priority deadline"
  );

  const priorityCounts = {};
  for (const t of missedTasks) {
    priorityCounts[t.priority] = (priorityCounts[t.priority] || 0) + 1;
  }

  const stats = {
    missedCount: logsMissed.length,
    completedCount: logsCompleted.length,
    habitMarks: habitMarks.length,
    missedByPriority: priorityCounts,
  };

  const input = {
    stats,
    weekStart: isoDateKey(ws),
    weekEnd: isoDateKey(we),
    missedTasks: missedTasks.map((t) => ({
      taskId: t._id,
      title: t.title,
      priority: t.priority,
      deadline: t.deadline,
    })),
  };

  const review = await generateReviewWithAI(input);

  const payload = {
    weekStart: isoDateKey(ws),
    weekEnd: isoDateKey(we),
    stats,
    ...review,
  };

  const log = await upsertReviewLog({ weekStart: ws, payload });
  return { review: payload, logId: log._id };
}

module.exports = { generateAndStoreWeeklyReview };

