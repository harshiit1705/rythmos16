const express = require("express");
const { aiReviewPostSchema } = require("../validation/aiSchemas");
const { generateAndStoreWeeklyReview } = require("../services/reviewService");

const router = express.Router();

router.get("/", async (req, res, next) => {
  try {
    // Optional: return latest stored review for the last 7 days.
    const Log = require("../models/Log");
    const end = new Date();
    const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
    const log = await Log.findOne({
      type: "ai_review",
      date: { $gte: start, $lte: end },
    }).sort({ createdAt: -1 });
    res.json({ review: log?.payload || null });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const body = aiReviewPostSchema.parse(req.body || {});
    const weekStart = body.weekStart ? new Date(body.weekStart) : new Date();
    // Service treats weekStart as a date anchor and makes a 7-day window.
    const result = await generateAndStoreWeeklyReview({
      weekStart,
      weekEnd: new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000),
    });
    res.status(201).json({ review: result.review, logId: result.logId });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

