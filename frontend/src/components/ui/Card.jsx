import React from "react";

export default function Card({ className = "", children }) {
  return (
    <div
      className={[
        "rounded-2xl border border-slate-200 bg-white p-4 shadow-soft",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

