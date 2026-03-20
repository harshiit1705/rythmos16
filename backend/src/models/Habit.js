const mongoose = require("mongoose");

const HabitSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },

    // One entry per day for completed marking.
    // `date` is stored at midnight for stable calculations.
    checkins: [
      {
        date: { type: Date, required: true },
        completed: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Habit", HabitSchema);

