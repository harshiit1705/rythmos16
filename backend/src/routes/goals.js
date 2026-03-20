const express = require("express");
const Goal = require("../models/Goal");
const { goalCreateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const goals = await Goal.find({}).sort({ createdAt: -1 });
    res.json(goals);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = goalCreateSchema.parse(req.body);
    const goal = await Goal.create(body);
    res.status(201).json(goal);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    if (body.title !== undefined && typeof body.title !== "string") {
      return res.status(400).json({ error: "ValidationError", message: "title must be a string" });
    }

    if (body.targetValue !== undefined && typeof body.targetValue !== "number") {
      return res.status(400).json({ error: "ValidationError", message: "targetValue must be a number" });
    }

    if (body.currentProgress !== undefined && typeof body.currentProgress !== "number") {
      return res
        .status(400)
        .json({ error: "ValidationError", message: "currentProgress must be a number" });
    }

    const updated = await Goal.findByIdAndUpdate(id, body, { new: true });
    if (!updated) return res.status(404).json({ error: "NotFound", message: "Goal not found" });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Goal.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "NotFound", message: "Goal not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

