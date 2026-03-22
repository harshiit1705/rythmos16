const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const { notFoundHandler } = require("./middlewares/notFoundHandler");
const { errorHandler } = require("./middlewares/errorHandler");

const tasksRouter = require("./routes/tasks");
const goalsRouter = require("./routes/goals");
const habitsRouter = require("./routes/habits");
const aiScheduleRouter = require("./routes/aiSchedule");
const aiReviewRouter = require("./routes/aiReview");

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "https://rythmos16.vercel.app"],
  methods: ["GET", "POST", "PATCH", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "rythmOS-backend" });
});

app.use("/api/tasks", tasksRouter);
app.use("/api/goals", goalsRouter);
app.use("/api/habits", habitsRouter);
app.use("/api/ai/schedule", aiScheduleRouter);
app.use("/api/ai/review", aiReviewRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

