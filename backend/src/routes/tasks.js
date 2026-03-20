const express = require("express");
const Task = require("../models/Task");
const Log = require("../models/Log");
const { taskCreateSchema, taskUpdateSchema } = require("../validation/schemas");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    const { status, priority } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    const tasks = await Task.find(filter).sort({ deadline: 1, createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = taskCreateSchema.parse(req.body);
    const deadline = body.deadline ? new Date(body.deadline) : undefined;

    const task = await Task.create({
      ...body,
      deadline,
      status: body.status,
      completedAt: body.status === "completed" ? new Date() : undefined,
    });

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = taskUpdateSchema.parse(req.body);
    if (body.deadline !== undefined) {
      body.deadline = body.deadline ? new Date(body.deadline) : undefined;
    }

    const before = await Task.findById(id);
    if (!before) return res.status(404).json({ error: "NotFound", message: "Task not found" });

    const after = await Task.findByIdAndUpdate(
      id,
      {
        ...body,
        completedAt:
          body.status === "completed"
            ? before.status !== "completed"
              ? new Date()
              : before.completedAt
            : body.status === "pending"
              ? undefined
              : before.completedAt,
      },
      { new: true }
    );

    if (body.status === "completed" && before.status !== "completed") {
      await Log.create({
        type: "task_completed",
        date: new Date(),
        payload: { taskId: after._id, title: after.title },
      });
    }

    res.json(after);
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await Task.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "NotFound", message: "Task not found" });
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

