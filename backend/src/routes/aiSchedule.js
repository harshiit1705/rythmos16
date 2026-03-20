const express = require("express");
const { z } = require("zod");
const Task = require("../models/Task");
const Log = require("../models/Log");
const { aiSchedulePostSchema } = require("../validation/aiSchemas");
const {
  normalizeDateInput,
  startOfDay,
  isoDateKey,
} = require("../services/dateUtils");
const { generateAndStoreSchedule, getScheduleLogForDate, upsertScheduleLog } = require("../services/scheduleService");
const { generateScheduleWithAI } = require("../services/aiPlanner");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const date = req.query.date;
    const scheduleLog = await getScheduleLogForDate(date || new Date());
    res.json({ schedule: scheduleLog?.payload || null });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = aiSchedulePostSchema.parse(req.body);

    const scheduleDate = normalizeDateInput(body.date, new Date());
    const startTime = body.wakeupTime || body.startTime || process.env.DEFAULT_START_TIME || "09:00";

    const availableTimeMinutes = (() => {
      // If caller provided availableTimeMinutes, keep it (legacy behavior).
      if (body.availableTimeMinutes !== undefined) return Number(body.availableTimeMinutes);
      // Otherwise derive from wakeup/sleep.
      const wake = new Date(`2000-01-01T${startTime}:00`);
      if (Number.isNaN(wake.getTime())) return undefined;

      if (!body.sleepTime) return undefined;
      const sleep = new Date(`2000-01-01T${body.sleepTime}:00`);
      if (Number.isNaN(sleep.getTime())) return undefined;

      const wakeMins = wake.getHours() * 60 + wake.getMinutes();
      const sleepMins = sleep.getHours() * 60 + sleep.getMinutes();
      if (sleepMins <= wakeMins) return undefined;

      let focus = sleepMins - wakeMins;
      const lunchTime = body.lunchTime;
      const lunchDur = Number(body.lunchDurationMinutes || 60);
      if (lunchTime) {
        const lunch = new Date(`2000-01-01T${lunchTime}:00`);
        if (!Number.isNaN(lunch.getTime())) {
          const lunchMins = lunch.getHours() * 60 + lunch.getMinutes();
          if (lunchMins >= wakeMins && lunchMins < sleepMins) {
            focus = focus - lunchDur;
          }
        }
      }
      return focus;
    })();

    if (!availableTimeMinutes || Number.isNaN(Number(availableTimeMinutes)) || Number(availableTimeMinutes) <= 0) {
      return res.status(400).json({
        error: "ValidationError",
        message:
          "Provide a valid availableTimeMinutes or both wakeupTime and sleepTime (sleepTime must be later).",
      });
    }

    // If the client passes tasks, we generate schedule from that list.
    if (body.tasks && body.tasks.length > 0) {
      const tasks = body.tasks.map((t, idx) => {
        const deadline = t.deadline ? new Date(t.deadline) : undefined;
        const deadlineDay = deadline ? startOfDay(deadline) : null;
        const missed = deadlineDay ? deadlineDay.getTime() < scheduleDate.getTime() : false;

        return {
          _id: t._id || `client-${idx}-${Date.now()}`,
          title: t.title,
          priority: t.priority,
          deadline,
          status: t.status,
          estimatedMinutes: t.estimatedMinutes ?? 45,
          missed,
        };
      });

      const { slots, unscheduled } = await generateScheduleWithAI({
        tasks,
        availableTimeMinutes,
        startTime,
        wakeupTime: body.wakeupTime,
        sleepTime: body.sleepTime,
        lunchTime: body.lunchTime,
        lunchDurationMinutes: body.lunchDurationMinutes,
        scheduleDate: isoDateKey(scheduleDate),
      });

      const payload = {
        date: isoDateKey(scheduleDate),
        availableTimeMinutes,
        startTime,
        wakeupTime: body.wakeupTime,
        sleepTime: body.sleepTime,
        lunchTime: body.lunchTime,
        lunchDurationMinutes: body.lunchDurationMinutes,
        slots,
        unscheduled,
        note: "Generated from client-provided tasks (not persisted to Task model).",
      };

      const log = await upsertScheduleLog({ scheduleDate, payload });
      return res.status(201).json({ schedule: payload, logId: log._id });
    }

    // Otherwise, schedule pending tasks from Mongo (cron uses this path).
    const result = await generateAndStoreSchedule({
      scheduleDate,
      availableTimeMinutes,
      startTime,
      wakeupTime: body.wakeupTime,
      sleepTime: body.sleepTime,
      lunchTime: body.lunchTime,
      lunchDurationMinutes: body.lunchDurationMinutes,
    });

    return res.status(201).json({ schedule: result.schedule, logId: result.logId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

