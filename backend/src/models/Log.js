const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["ai_schedule", "ai_review", "task_missed", "task_completed", "habit_mark"],
      required: true,
    },
    date: { type: Date, default: () => new Date() },

    // Free-form payload for dashboards/analysis.
    payload: { type: Object, default: {} },
  },
  { timestamps: true }
);

// Helpful for date-based queries
LogSchema.index({ type: 1, date: -1 });

module.exports = mongoose.model("Log", LogSchema);

