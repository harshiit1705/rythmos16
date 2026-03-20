RythmOS (MERN Student Productivity System)

This is a full-stack MERN app:
- Backend: Node.js + Express + MongoDB (Mongoose)
- Frontend: React + Tailwind CSS + Recharts

Includes:
- Tasks CRUD + filtering (priority/status)
- Goals CRUD + progress bars
- Habits tracking (daily check-ins, streak, weekly consistency)
- AI Smart Planner routes: `POST /api/ai/schedule` and `GET /api/ai/schedule`
- Weekly AI Review routes: `POST /api/ai/review` and `GET /api/ai/review`
- Cron automation (nightly schedule generation + Sunday review)

## Project Structure

```text
rythmOS/
  backend/
    src/
      models/ Task, Goal, Habit, Log
      routes/ tasks, goals, habits, aiSchedule, aiReview
      services/ aiPlanner, aiReviewer, scheduleService, reviewService
      jobs/ cronJobs
  frontend/
    src/
      pages/ Dashboard, Tasks, Goals, Habits
      components/ Sidebar, UI primitives
      api/ api client
      utils/ habit computations
```

## Run Locally

Prerequisites:
- MongoDB running (or set `MONGODB_URI`)
- Node.js installed

### 1) Backend
1. Open a terminal in `backend/`.
2. Install dependencies:
   - `npm install`
3. Copy env file:
   - `cp .env.example .env` (or create `.env` manually on Windows)
4. Set:
   - `MONGODB_URI`
   - `OPENAI_API_KEY` (optional; if omitted, the app uses a deterministic mock)
5. Start:
   - `npm run dev`
Backend listens on `http://localhost:5000`.

Cron jobs automatically start when the backend runs.

### 2) Frontend
1. Open a terminal in `frontend/`.
2. Install dependencies:
   - `npm install`
3. Start:
   - `npm run dev`
Frontend runs on `http://localhost:5173`.

## Notes
- `deadline` fields accept both `YYYY-MM-DD` and full datetime strings.
- The “Smart Planner” returns structured `slots` with `startTime`/`endTime` and `taskId`/`title`.
- Weekly review outputs suggestions from OpenAI when configured; otherwise it uses a safe mock.

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
