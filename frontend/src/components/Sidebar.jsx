import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

function AppLogoIcon({ className = "" }) {
  return (
    <svg
      className={className}
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="rythm-grad" x1="4" y1="4" x2="24" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0ea5e9" />
          <stop offset="0.5" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#22c55e" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="22" height="22" rx="6" fill="url(#rythm-grad)" opacity="0.18" />
      <path
        d="M9 9.6C12.5 7.5 15.7 8.2 19 10.1"
        stroke="url(#rythm-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M8.8 14.1C11.9 12.2 15.9 12.5 19.1 14.3"
        stroke="url(#rythm-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M10.2 18.2C12.6 16.9 15.6 17.1 17.8 18.4"
        stroke="url(#rythm-grad)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="8.1" cy="20.1" r="1.6" fill="url(#rythm-grad)" />
    </svg>
  );
}

function NavIcon({ type, className = "" }) {
  // Icons use `currentColor` so active styles automatically recolor.
  const common = { className: `shrink-0 ${className}`, width: 20, height: 20, viewBox: "0 0 24 24", fill: "none" };
  if (type === "dashboard") {
    return (
      <svg {...common} aria-hidden="true">
        <path d="M4 13.5V20h7v-6.5H4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 4h7v7h-7V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M13 13h7v7h-7v-7Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M4 4h7v7H4V4Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
    );
  }
  if (type === "tasks") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M9 6h11M9 12h11M9 18h11"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path
          d="M4.5 6.5l1.2 1.2 2.3-2.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 12.5l1.2 1.2 2.3-2.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.5 18.5l1.2 1.2 2.3-2.7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (type === "goals") {
    return (
      <svg {...common} aria-hidden="true">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 12h-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  if (type === "habits") {
    return (
      <svg {...common} aria-hidden="true">
        <path
          d="M12 2s4 4.5 4 9a4 4 0 1 1-8 0c0-4.5 4-9 4-9Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M8 16.5c1 .9 2.4 1.5 4 1.5s3-.6 4-1.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return null;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { path: "/tasks", label: "Tasks", icon: "tasks" },
  { path: "/goals", label: "Goals", icon: "goals" },
  { path: "/habits", label: "Habits", icon: "habits" },
];

export default function Sidebar({ activePath }) {
  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="hidden w-64 shrink-0 sm:block"
      >
        <div className="rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-soft">
          <div className="mb-4 px-2">
            <div className="flex items-center gap-3">
              <AppLogoIcon className="text-slate-900" />
              <div>
                <div className="text-lg font-semibold tracking-tight">RythmOS</div>
                <div className="text-sm text-slate-500">Student Productivity</div>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const active = activePath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={[
                    "flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition",
                    active
                      ? "bg-slate-900 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")}
                >
                  <NavIcon type={item.icon} className="text-inherit" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </motion.aside>

      <div className="sm:hidden">
        <nav className="fixed bottom-0 left-0 right-0 z-10 border-t border-slate-200 bg-white">
          <div className="grid grid-cols-4">
            {navItems.map((item) => {
              const active = activePath === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={[
                    "flex flex-col items-center justify-center gap-1 px-2 py-3 text-center text-xs font-semibold transition",
                    active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                  ].join(" ")}
                >
                  <NavIcon type={item.icon} className="text-inherit" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </>
  );
}

