const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
    estimatedMinutes: { type: Number, default: 45 },
    completedAt: { type: Date },

    // Smart rescheduler support:
    // We keep track of which "deadline days" were missed so we don't log duplicates.
    missedDates: { type: [Date], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);

