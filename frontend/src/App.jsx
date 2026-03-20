import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import Sidebar from "./components/Sidebar.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Tasks from "./pages/Tasks.jsx";
import Goals from "./pages/Goals.jsx";
import Habits from "./pages/Habits.jsx";

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex max-w-7xl">
        <Sidebar activePath={location.pathname} />
        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 sm:pb-6">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/habits" element={<Habits />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

