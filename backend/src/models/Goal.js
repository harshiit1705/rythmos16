const mongoose = require("mongoose");

const GoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    targetValue: { type: Number, required: true, min: 0 },
    currentProgress: { type: Number, default: 0, min: 0 },
    unit: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Goal", GoalSchema);

