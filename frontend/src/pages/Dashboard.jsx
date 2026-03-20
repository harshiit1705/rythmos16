import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import Card from "../components/ui/Card.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import Button from "../components/ui/Button.jsx";
import { toISODate } from "../utils/date";
import { getHabitStreak, getWeeklyConsistency } from "../utils/habits";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = {
  pending: "#0f172a",
  completed: "#16a34a",
  high: "#ef4444",
  medium: "#f59e0b",
  low: "#94a3b8",
};

export default function Dashboard() {
  const todayKey = useMemo(() => toISODate(new Date()), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habits, setHabits] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [review, setReview] = useState(null);

  const [wakeupTime, setWakeupTime] = useState("07:00");
  const [sleepTime, setSleepTime] = useState("23:00");
  const [lunchTime, setLunchTime] = useState("13:00");
  const [lunchDurationMinutes, setLunchDurationMinutes] = useState(60);
  const [generating, setGenerating] = useState(false);

  const computedAvailableTimeMinutes = useMemo(() => {
    const parse = (t) => {
      const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(String(t || ""));
      if (!m) return null;
      const hh = Number(m[1]);
      const mm = Number(m[2]);
      return hh * 60 + mm;
    };

    const wakeMins = parse(wakeupTime);
    const sleepMins = parse(sleepTime);
    if (wakeMins === null || sleepMins === null) return null;

    if (sleepMins <= wakeMins) return null;

    const total = sleepMins - wakeMins;
    const lunchMins = parse(lunchTime);
    const lunchDur = Number(lunchDurationMinutes || 60);

    if (lunchMins === null || lunchDur <= 0) return total;

    // Subtract lunch duration if lunch starts inside the window.
    if (lunchMins >= wakeMins && lunchMins < sleepMins) {
      return Math.max(0, total - lunchDur);
    }
    return total;
  }, [wakeupTime, sleepTime, lunchTime, lunchDurationMinutes]);

  async function loadAll() {
    setLoading(true);
    setError("");
    try {
      const [tasksRes, goalsRes, habitsRes, scheduleRes, reviewRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/goals"),
        api.get("/habits"),
        api.get(`/ai/schedule?date=${encodeURIComponent(todayKey)}`),
        api.get("/ai/review"),
      ]);

      setTasks(tasksRes || []);
      setGoals(goalsRes || []);
      setHabits(habitsRes || []);
      setSchedule(scheduleRes?.schedule || null);
      setReview(reviewRes?.review || null);
    } catch (e) {
      setError(e?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function generateScheduleForToday() {
    setGenerating(true);
    setError("");
    try {
      if (!computedAvailableTimeMinutes || computedAvailableTimeMinutes <= 0) {
        throw new Error("Please enter a valid wakeup/sleep/lunch time window.");
      }
      const res = await api.post("/ai/schedule", {
        date: todayKey,
        // The backend will use wakeup/sleep/lunch to build a non-working lunch block.
        wakeupTime,
        sleepTime,
        lunchTime,
        lunchDurationMinutes,
        availableTimeMinutes: Number(computedAvailableTimeMinutes),
        startTime: wakeupTime,
      });
      setSchedule(res?.schedule || null);
    } catch (e) {
      setError(e?.message || "Failed to generate schedule");
    } finally {
      setGenerating(false);
    }
  }

  const taskStats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === "pending").length;
    const completed = tasks.filter((t) => t.status === "completed").length;
    return { pending, completed, total: pending + completed };
  }, [tasks]);

  const pendingTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status === "pending")
      .slice()
      .sort((a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"))
      .slice(0, 6);
  }, [tasks]);

  const goalChartData = useMemo(() => {
    return goals.map((g) => ({
      name: g.title,
      pct: g.targetValue > 0 ? Math.round((g.currentProgress / g.targetValue) * 100) : 0,
    }));
  }, [goals]);

  const habitChartData = useMemo(() => {
    return habits.map((h) => ({
      name: h.title.length > 14 ? h.title.slice(0, 14) + "…" : h.title,
      consistency: getWeeklyConsistency(h),
    }));
  }, [habits]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Card className="border-red-200 bg-red-50 text-red-700">
          <div className="font-semibold">Error</div>
          <div className="text-sm">{error}</div>
        </Card>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Dashboard</div>
          <div className="text-sm text-slate-500">Today: {todayKey}</div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:gap-3">
            <div>
              <div className="text-xs text-slate-600">Wakeup</div>
              <input
                className="mt-1 w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="time"
                value={wakeupTime}
                onChange={(e) => setWakeupTime(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-600">Sleep</div>
              <input
                className="mt-1 w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="time"
                value={sleepTime}
                onChange={(e) => setSleepTime(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-600">Lunch</div>
              <input
                className="mt-1 w-28 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="time"
                value={lunchTime}
                onChange={(e) => setLunchTime(e.target.value)}
              />
            </div>
            <div>
              <div className="text-xs text-slate-600">Lunch (mins)</div>
              <input
                className="mt-1 w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="number"
                value={lunchDurationMinutes}
                min={10}
                max={180}
                onChange={(e) => setLunchDurationMinutes(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 sm:pl-2">
            Focus time:{" "}
            <span className="font-semibold text-slate-700">
              {computedAvailableTimeMinutes === null ? "-" : computedAvailableTimeMinutes} mins
            </span>
          </div>

          <Button onClick={generateScheduleForToday} disabled={generating}>
            {generating ? "Planning..." : "Generate Plan"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Task Status</div>
          </div>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Pending", value: taskStats.pending, key: "pending" },
                    { name: "Completed", value: taskStats.completed, key: "completed" },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={45}
                  outerRadius={70}
                >
                  <Cell fill={COLORS.pending} />
                  <Cell fill={COLORS.completed} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Pending</div>
              <div className="text-xl font-semibold">{taskStats.pending}</div>
            </div>
            <div className="rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Completed</div>
              <div className="text-xl font-semibold">{taskStats.completed}</div>
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div className="font-semibold">Today&apos;s Schedule</div>
            <div className="text-xs text-slate-500">
              {schedule?.date ? `Generated for ${schedule.date}` : "No schedule yet"}
            </div>
          </div>

          {schedule?.slots?.length ? (
            <div className="space-y-2">
              {schedule.slots
                .filter((s) => s.type !== "break")
                .slice(0, 10)
                .map((s, i) => {
                  const color = COLORS[s.priority] || "#0f172a";
                  return (
                    <div
                      key={`${s.taskId || "break"}-${i}`}
                      className="flex items-start justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="min-w-0 pr-4">
                        <div className="truncate text-sm font-semibold">{s.title}</div>
                        <div className="mt-1 text-xs text-slate-600">
                          {s.missed ? "Missed task (rescheduled)" : "Focus block"}{" "}
                          {s.priority ? `• ${s.priority}` : ""}
                        </div>
                      </div>
                      <div className="shrink-0 text-sm font-semibold" style={{ color }}>
                        {s.startTime} - {s.endTime}
                      </div>
                    </div>
                  );
                })}
              {schedule.unscheduled?.length ? (
                <div className="text-xs text-slate-600">
                  {schedule.unscheduled.length} task(s) didn&apos;t fit into the available time window.
                </div>
              ) : null}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              Generate a plan to see time slots for today.
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <div className="mb-2 font-semibold">Pending Tasks</div>
          <div className="space-y-2">
            {pendingTasks.length ? (
              pendingTasks.map((t) => (
                <div key={t._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{t.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {t.deadline ? `Due: ${t.deadline.slice(0, 10)}` : "No deadline"}
                      </div>
                    </div>
                    <div
                      className="rounded-full px-2 py-1 text-xs font-semibold"
                      style={{
                        background:
                          t.priority === "high"
                            ? "rgba(239,68,68,0.12)"
                            : t.priority === "medium"
                              ? "rgba(245,158,11,0.16)"
                              : "rgba(148,163,184,0.16)",
                        color:
                          t.priority === "high"
                            ? COLORS.high
                            : t.priority === "medium"
                              ? COLORS.medium
                              : COLORS.low,
                      }}
                    >
                      {t.priority}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No pending tasks 🎉</div>
            )}
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Goals</div>
          </div>
          <div className="space-y-3">
            {goals.length ? (
              goals.map((g) => (
                <div key={g._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{g.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        {g.currentProgress} / {g.targetValue} {g.unit || ""}
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={g.currentProgress} max={g.targetValue} />
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No goals yet.</div>
            )}
          </div>

          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={goalChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="pct" fill="#0f172a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-1">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Habits</div>
          </div>
          <div className="space-y-3">
            {habits.length ? (
              habits.map((h) => (
                <div key={h._id} className="rounded-xl border border-slate-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold">{h.title}</div>
                      <div className="mt-1 text-xs text-slate-600">
                        Streak: {getHabitStreak(h)} day(s)
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Weekly consistency: {getWeeklyConsistency(h)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-500">No habits yet.</div>
            )}
          </div>

          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={habitChartData}>
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="consistency" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {review?.suggestions?.length ? (
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="font-semibold">Weekly AI Review</div>
            <div className="text-xs text-slate-500">
              {review.weekStart ? `${review.weekStart} → ${review.weekEnd}` : ""}
            </div>
          </div>
          <div className="space-y-2">
            {review.suggestions.slice(0, 6).map((s, i) => (
              <div key={`${i}-${s}`} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                {s}
              </div>
            ))}
          </div>
        </Card>
      ) : null}
    </div>
  );
}

