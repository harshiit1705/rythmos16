import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import ProgressBar from "../components/ui/ProgressBar.jsx";
import Spinner from "../components/ui/Spinner.jsx";

export default function Goals() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [goals, setGoals] = useState([]);

  const [form, setForm] = useState({
    title: "",
    targetValue: 100,
    currentProgress: 0,
    unit: "",
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/goals");
      setGoals(res || []);
    } catch (e) {
      setError(e?.message || "Failed to load goals");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onCreate(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const created = await api.post("/goals", {
        ...form,
        targetValue: Number(form.targetValue),
        currentProgress: Number(form.currentProgress),
        unit: form.unit || "",
      });
      setGoals((prev) => [created, ...prev]);
      setForm({ title: "", targetValue: 100, currentProgress: 0, unit: "" });
    } catch (err) {
      setError(err?.message || "Failed to create goal");
    } finally {
      setSaving(false);
    }
  }

  async function onUpdate(id, nextProgress) {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch(`/goals/${id}`, { currentProgress: nextProgress });
      setGoals((prev) => prev.map((g) => (g._id === id ? updated : g)));
    } catch (err) {
      setError(err?.message || "Failed to update goal");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    setSaving(true);
    setError("");
    try {
      await api.del(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g._id !== id));
    } catch (err) {
      setError(err?.message || "Failed to delete goal");
    } finally {
      setSaving(false);
    }
  }

  const avgProgressPct = useMemo(() => {
    if (!goals.length) return 0;
    const pcts = goals.map((g) =>
      g.targetValue > 0 ? Math.max(0, Math.min(100, (g.currentProgress / g.targetValue) * 100)) : 0
    );
    const avg = pcts.reduce((a, b) => a + b, 0) / pcts.length;
    return Math.round(avg);
  }, [goals]);

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
        <div className="text-2xl font-semibold tracking-tight">Goals</div>
        <div className="text-sm text-slate-500">Track academic and skill progress with bars.</div>
      </div>

      <Card>
        <form onSubmit={onCreate} className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <label className="mb-1 block text-sm text-slate-600">Title</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                required
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-sm text-slate-600">Target</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.targetValue}
                onChange={(e) => setForm((p) => ({ ...p, targetValue: e.target.value }))}
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-sm text-slate-600">Current</label>
              <input
                type="number"
                min={0}
                step={0.1}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.currentProgress}
                onChange={(e) => setForm((p) => ({ ...p, currentProgress: e.target.value }))}
              />
            </div>
            <div className="w-40">
              <label className="mb-1 block text-sm text-slate-600">Unit</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.unit}
                onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))}
                placeholder="e.g. %"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Create Goal"}
            </Button>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {goals.length ? (
          goals.map((g) => (
            <Card key={g._id}>
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{g.title}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {g.currentProgress} / {g.targetValue} {g.unit || ""}
                  </div>
                </div>
                <Button variant="danger" type="button" disabled={saving} onClick={() => onDelete(g._id)}>
                  Delete
                </Button>
              </div>

              <ProgressBar value={g.currentProgress} max={g.targetValue} />

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-600">Update progress</div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm hover:bg-slate-50 disabled:opacity-60"
                    disabled={saving}
                    onClick={() => onUpdate(g._id, Number(g.currentProgress) + 1)}
                  >
                    +1
                  </button>
                  <input
                    className="w-24 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                    type="number"
                    value={g.currentProgress}
                    step={0.1}
                    min={0}
                    onChange={(e) => onUpdate(g._id, Number(e.target.value))}
                  />
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-sm text-slate-500">No goals yet.</div>
          </Card>
        )}
      </div>

      {goals.length ? (
        <Card>
          <div className="text-sm text-slate-600">
            Average goal progress: <span className="font-semibold">{avgProgressPct}%</span>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

