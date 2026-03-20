import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";
import { getHabitStreak, getWeeklyConsistency } from "../utils/habits";
import { toISODate } from "../utils/date";

function dateKey(d) {
  return toISODate(d);
}

function hasCheckinForDate(habit, key) {
  return (habit.checkins || []).some((c) => dateKey(c.date) === key);
}

export default function Habits() {
  const todayKey = useMemo(() => toISODate(new Date()), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [habits, setHabits] = useState([]);

  const [formTitle, setFormTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/habits");
      setHabits(res || []);
    } catch (e) {
      setError(e?.message || "Failed to load habits");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function createHabit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api.post("/habits", { title: formTitle });
      setHabits((prev) => [created, ...prev]);
      setFormTitle("");
    } catch (err) {
      setError(err?.message || "Failed to create habit");
    } finally {
      setSaving(false);
    }
  }

  async function markHabit(id) {
    setSaving(true);
    setError("");
    try {
      const updated = await api.post(`/habits/${id}/mark`, { date: todayKey, completed: true });
      setHabits((prev) => prev.map((h) => (h._id === id ? updated : h)));
    } catch (err) {
      setError(err?.message || "Failed to mark habit");
    } finally {
      setSaving(false);
    }
  }

  async function deleteHabit(id) {
    setSaving(true);
    setError("");
    try {
      await api.del(`/habits/${id}`);
      setHabits((prev) => prev.filter((h) => h._id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete habit");
    } finally {
      setSaving(false);
    }
  }

  const weeklySummary = useMemo(() => {
    if (!habits.length) return 0;
    const avg = habits.reduce((acc, h) => acc + getWeeklyConsistency(h), 0) / habits.length;
    return Math.round(avg);
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

      <div>
        <div className="text-2xl font-semibold tracking-tight">Habits</div>
        <div className="text-sm text-slate-500">Mark habits daily and track streaks + weekly consistency.</div>
      </div>

      <Card>
        <form onSubmit={createHabit} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex-1">
            <label className="mb-1 block text-sm text-slate-600">New habit</label>
            <input
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Coding"
              required
            />
          </div>
          <Button type="submit" disabled={saving}>
            {saving ? "Adding..." : "Add Habit"}
          </Button>
        </form>
      </Card>

      <Card>
        <div className="text-sm text-slate-600">
          Average weekly consistency: <span className="font-semibold">{weeklySummary}%</span>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {habits.length ? (
          habits.map((h) => {
            const streak = getHabitStreak(h);
            const consistency = getWeeklyConsistency(h);
            const doneToday = hasCheckinForDate(h, todayKey);
            return (
              <Card key={h._id}>
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold">{h.title}</div>
                    <div className="mt-1 text-xs text-slate-600">Streak: {streak} day(s)</div>
                    <div className="mt-1 text-xs text-slate-600">Weekly consistency: {consistency}%</div>
                  </div>
                  <Button variant="danger" type="button" disabled={saving} onClick={() => deleteHabit(h._id)}>
                    Delete
                  </Button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-slate-600">Today&apos;s check-in</div>
                  <Button type="button" disabled={saving || doneToday} onClick={() => markHabit(h._id)}>
                    {doneToday ? "Completed" : "Mark completed"}
                  </Button>
                </div>

                <div className="mt-4 grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }).map((_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - (6 - i));
                    const k = dateKey(d);
                    const entry = (h.checkins || []).find((c) => dateKey(c.date) === k);
                    const on = Boolean(entry?.completed);
                    return (
                      <div
                        key={k}
                        className={[
                          "rounded-lg border px-2 py-2 text-center text-[11px]",
                          on ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-white border-slate-200 text-slate-400",
                        ].join(" ")}
                        title={k}
                      >
                        {d.toLocaleDateString(undefined, { weekday: "short" })}
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })
        ) : (
          <Card className="lg:col-span-2">
            <div className="text-sm text-slate-500">No habits yet. Add one above.</div>
          </Card>
        )}
      </div>
    </div>
  );
}

