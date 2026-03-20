const express = require("express");
const Habit = require("../models/Habit");
const Log = require("../models/Log");
const { habitCreateSchema } = require("../validation/schemas");

const router = express.Router();

function toMidnight(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

router.get("/", async (req, res, next) => {
  try {
    const habits = await Habit.find({}).sort({ createdAt: -1 });
    res.json(habits);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = habitCreateSchema.parse(req.body);
    const habit = await Habit.create({ title: body.title, checkins: [] });
    res.status(201).json(habit);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await Habit.findByIdAndUpdate(id, req.body, { new: true });
    if (!updated) return res.status(404).json({ error: "NotFound", message: "Habit not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Habit.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "NotFound", message: "Habit not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// Mark habit as completed for a given date (defaults to today).
router.post("/:id/mark", async (req, res, next) => {
  try {
    const { id } = req.params;
    const completed = req.body?.completed !== undefined ? Boolean(req.body.completed) : true;
    const dateStr = req.body?.date;
    const date = toMidnight(dateStr ? new Date(dateStr) : new Date());

    const habit = await Habit.findById(id);
    if (!habit) return res.status(404).json({ error: "NotFound", message: "Habit not found" });

    const dateKey = date.toISOString().slice(0, 10);
    const existing = habit.checkins.find((c) => toMidnight(c.date).toISOString().slice(0, 10) === dateKey);

    if (existing) {
      existing.completed = completed;
    } else {
      habit.checkins.push({ date, completed });
    }

    await habit.save();

    if (completed) {
      await Log.create({
        type: "habit_mark",
        date,
        payload: { habitId: habit._id, habitTitle: habit.title, completed },
      });
    }

    res.json(habit);
  } catch (err) {
    next(err);
  }
});

module.exports = router;

