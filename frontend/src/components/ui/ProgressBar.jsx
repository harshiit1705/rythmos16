import React from "react";

export default function ProgressBar({ value, max = 100, label }) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div>
      {label ? (
        <div className="mb-2 flex items-center justify-between text-sm text-slate-600">
          <span>{label}</span>
          <span>{Math.round(pct)}%</span>
        </div>
      ) : null}
      <div className="h-3 w-full rounded-full bg-slate-100">
        <div
          className="h-3 rounded-full bg-slate-900"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

