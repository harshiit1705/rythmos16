import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/api";
import Card from "../components/ui/Card.jsx";
import Button from "../components/ui/Button.jsx";
import Spinner from "../components/ui/Spinner.jsx";

const PRIORITIES = [
  { value: "", label: "All priorities" },
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "completed", label: "Completed" },
];

function formatDateForInput(d) {
  if (!d) return "";
  // Accept ISO from backend
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "";
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
}

export default function Tasks() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tasks, setTasks] = useState([]);

  const [priorityFilter, setPriorityFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    deadline: "",
    status: "pending",
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const q = new URLSearchParams();
      if (priorityFilter) q.set("priority", priorityFilter);
      if (statusFilter) q.set("status", statusFilter);
      const res = await api.get(`/tasks${q.toString() ? `?${q.toString()}` : ""}`);
      setTasks(res || []);
    } catch (e) {
      setError(e?.message || "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [priorityFilter, statusFilter]);

  async function onSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...form,
        deadline: form.deadline || undefined,
      };

      if (editingId) {
        const updated = await api.patch(`/tasks/${editingId}`, payload);
        setTasks((prev) => prev.map((t) => (t._id === editingId ? updated : t)));
      } else {
        const created = await api.post("/tasks", payload);
        setTasks((prev) => [created, ...prev]);
      }

      setEditingId(null);
      setForm({
        title: "",
        description: "",
        priority: "medium",
        deadline: "",
        status: "pending",
      });
    } catch (e2) {
      setError(e2?.message || "Failed to save task");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id) {
    setSaving(true);
    setError("");
    try {
      await api.del(`/tasks/${id}`);
      setTasks((prev) => prev.filter((t) => t._id !== id));
    } catch (e) {
      setError(e?.message || "Failed to delete task");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(task) {
    setEditingId(task._id);
    setForm({
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "medium",
      deadline: formatDateForInput(task.deadline),
      status: task.status || "pending",
    });
  }

  async function quickSetStatus(id, status) {
    setSaving(true);
    setError("");
    try {
      const updated = await api.patch(`/tasks/${id}`, { status });
      setTasks((prev) => prev.map((t) => (t._id === id ? updated : t)));
    } catch (e) {
      setError(e?.message || "Failed to update status");
    } finally {
      setSaving(false);
    }
  }

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
      const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
      return da - db;
    });
  }, [tasks]);

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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-tight">Tasks</div>
          <div className="text-sm text-slate-500">Add, edit, delete, and filter tasks.</div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <select
            className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card>
        <form onSubmit={onSubmit} className="space-y-3">
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
              <label className="mb-1 block text-sm text-slate-600">Priority</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.priority}
                onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
              >
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
              </select>
            </div>

            <div className="w-52">
              <label className="mb-1 block text-sm text-slate-600">Deadline</label>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))}
              />
            </div>

            <div className="w-44">
              <label className="mb-1 block text-sm text-slate-600">Status</label>
              <select
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
                value={form.status}
                onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
              >
                <option value="pending">pending</option>
                <option value="completed">completed</option>
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-slate-600">Description</label>
            <textarea
              className="min-h-20 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-slate-400"
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              {editingId ? "Editing task" : "Add a new task"}.
            </div>
            <div className="flex gap-2">
              {editingId ? (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => {
                    setEditingId(null);
                    setForm({
                      title: "",
                      description: "",
                      priority: "medium",
                      deadline: "",
                      status: "pending",
                    });
                  }}
                >
                  Cancel
                </Button>
              ) : null}
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : editingId ? "Update Task" : "Add Task"}
              </Button>
            </div>
          </div>
        </form>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {sortedTasks.length ? (
          sortedTasks.map((t) => (
            <Card key={t._id} className="hover:shadow-soft transition">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold">{t.title}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    {t.deadline ? `Due: ${t.deadline.slice(0, 10)}` : "No deadline"} • Priority:{" "}
                    {t.priority}
                  </div>
                  {t.description ? (
                    <div className="mt-2 text-sm text-slate-700 line-clamp-3">
                      {t.description}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2 py-1 text-xs font-semibold",
                        t.status === "completed"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                          : "bg-amber-50 text-amber-700 border border-amber-200",
                      ].join(" ")}
                    >
                      {t.status}
                    </span>
                    {t.status !== "completed" ? (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3"
                        disabled={saving}
                        onClick={() => quickSetStatus(t._id, "completed")}
                      >
                        Mark completed
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        variant="secondary"
                        className="px-3"
                        disabled={saving}
                        onClick={() => quickSetStatus(t._id, "pending")}
                      >
                        Reopen
                      </Button>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 flex-col gap-2">
                  <Button type="button" variant="secondary" disabled={saving} onClick={() => startEdit(t)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="danger"
                    disabled={saving}
                    onClick={() => onDelete(t._id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="lg:col-span-2">
            <div className="text-sm text-slate-500">No tasks match the current filters.</div>
          </Card>
        )}
      </div>
    </div>
  );
}

