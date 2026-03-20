const OpenAI = require("openai");
const {
  parseTimeToMinutes,
  minutesToTime,
} = require("./dateUtils");

const PRIORITY_WEIGHT = { low: 1, medium: 2, high: 3 };

function buildMockSchedule({
  tasks,
  availableTimeMinutes,
  startTime,
  wakeupTime,
  sleepTime,
  lunchTime,
  lunchDurationMinutes,
}) {
  const tasksSorted = [...tasks].sort((a, b) => {
    const aMissed = Boolean(a.missed);
    const bMissed = Boolean(b.missed);
    if (aMissed !== bMissed) return aMissed ? -1 : 1;

    const pa = PRIORITY_WEIGHT[a.priority] || 0;
    const pb = PRIORITY_WEIGHT[b.priority] || 0;
    if (pa !== pb) return pb - pa;

    const da = a.deadline ? new Date(a.deadline).getTime() : Number.POSITIVE_INFINITY;
    const db = b.deadline ? new Date(b.deadline).getTime() : Number.POSITIVE_INFINITY;
    return da - db;
  });

  const startMinutes = parseTimeToMinutes(wakeupTime || startTime || "09:00");
  let cursor = startMinutes;

  const sleepMins = sleepTime ? parseTimeToMinutes(sleepTime) : null;
  const endLimit =
    sleepMins !== null
      ? sleepMins
      : startMinutes + Number(availableTimeMinutes || 0);

  const lunchStart = lunchTime ? parseTimeToMinutes(lunchTime) : null;
  const lunchDur = Number(lunchDurationMinutes || 60);
  const lunchEnd =
    lunchStart !== null ? Math.min(lunchStart + lunchDur, endLimit) : null;
  let lunchInserted = false;

  const slots = [];
  const unscheduled = [];

  const breakMinutes = 15;
  let tasksPlaced = 0;

  for (const t of tasksSorted) {
    const duration = Math.max(10, Number(t.estimatedMinutes || 45));

    // If cursor is currently in the lunch window, fast-forward and insert lunch slot once.
    if (
      lunchStart !== null &&
      lunchEnd !== null &&
      cursor >= lunchStart &&
      cursor < lunchEnd
    ) {
      if (!lunchInserted) {
        slots.push({
          startTime: minutesToTime(cursor),
          endTime: minutesToTime(lunchEnd),
          taskId: null,
          title: "Lunch",
          priority: null,
          missed: false,
          type: "break",
        });
        lunchInserted = true;
      }
      cursor = lunchEnd;
    }

    // If this task would overlap lunch, schedule lunch first.
    if (
      lunchStart !== null &&
      lunchEnd !== null &&
      cursor < lunchStart &&
      cursor + duration > lunchStart
    ) {
      if (!lunchInserted) {
        slots.push({
          startTime: minutesToTime(lunchStart),
          endTime: minutesToTime(lunchEnd),
          taskId: null,
          title: "Lunch",
          priority: null,
          missed: false,
          type: "break",
        });
        lunchInserted = true;
      }
      cursor = lunchEnd;
    }

    if (cursor + duration > endLimit) {
      unscheduled.push({ taskId: t._id, title: t.title });
      continue;
    }

    slots.push({
      startTime: minutesToTime(cursor),
      endTime: minutesToTime(cursor + duration),
      taskId: t._id,
      title: t.title,
      priority: t.priority,
      missed: Boolean(t.missed),
    });
    cursor += duration;
    tasksPlaced += 1;

    // Add a break after every 2 tasks (if time remains).
    if (tasksPlaced % 2 === 0) {
      if (cursor + breakMinutes <= endLimit) {
        // Avoid crossing the lunch block.
        if (
          lunchStart !== null &&
          lunchEnd !== null &&
          cursor < lunchEnd &&
          cursor + breakMinutes > lunchStart
        ) {
          // If break would overlap lunch, jump to lunch end instead.
          if (!lunchInserted && lunchStart >= cursor) {
            slots.push({
              startTime: minutesToTime(lunchStart),
              endTime: minutesToTime(lunchEnd),
              taskId: null,
              title: "Lunch",
              priority: null,
              missed: false,
              type: "break",
            });
            lunchInserted = true;
          }
          cursor = lunchEnd;
        } else {
          slots.push({
            startTime: minutesToTime(cursor),
            endTime: minutesToTime(cursor + breakMinutes),
            taskId: null,
            title: "Break",
            priority: null,
            missed: false,
            type: "break",
          });
          cursor += breakMinutes;
        }
      }
    }
  }

  return { slots, unscheduled };
}

async function generateScheduleWithAI({
  tasks,
  availableTimeMinutes,
  startTime,
  scheduleDate,
  wakeupTime,
  sleepTime,
  lunchTime,
  lunchDurationMinutes,
}) {
  // If no API key is present, we always return mock output.
  if (!process.env.OPENAI_API_KEY) {
    return buildMockSchedule({
      tasks,
      availableTimeMinutes,
      startTime,
      wakeupTime,
      sleepTime,
      lunchTime,
      lunchDurationMinutes,
    });
  }

  // OpenAI call: ask for JSON schedule output.
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const tasksBrief = tasks.map((t) => ({
    _id: String(t._id),
    title: t.title,
    priority: t.priority,
    deadline: t.deadline || null,
    missed: Boolean(t.missed),
    estimatedMinutes: t.estimatedMinutes || 45,
  }));

  const prompt = `
You are an expert student productivity planner.
Given a list of tasks and the student&apos;s daily routine inputs, produce an optimized day schedule.

Rules:
- Use the provided tasks' priority and deadlines.
- If a task is marked missed=true, place it earlier in the day than non-missed tasks when possible.
- Create time slots in chronological order.
- Include breaks after focus tasks (type="break", 10-20 minutes).
- Schedule a lunch break at lunchTime for lunchDurationMinutes (type="break", title="Lunch") and do not schedule tasks during lunch.
- Total planned focus time should not exceed availableTimeMinutes.
- Use 24-hour time.

Return strict JSON with:
{
  "slots": [
    {
      "startTime": "HH:mm",
      "endTime": "HH:mm",
      "taskId": string|null,
      "title": string,
      "priority": "low"|"medium"|"high"|null,
      "missed": boolean,
      "type": "task"|"break"
    }
  ],
  "unscheduled": [{ "taskId": string, "title": string }]
}

Input:
scheduleDate: ${scheduleDate}
student wakeupTime: ${wakeupTime || startTime}
student sleepTime: ${sleepTime || "unknown"}
student lunchTime: ${lunchTime || "unknown"}
student lunchDurationMinutes: ${lunchDurationMinutes || 60}
startTime: ${startTime}
availableTimeMinutes: ${availableTimeMinutes}
tasks: ${JSON.stringify(tasksBrief)}
`.trim();

  const resp = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.2,
  });

  const text = resp.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty schedule content");
  const parsed = JSON.parse(text);

  // Ensure required fields exist, and normalize break type.
  const slots = (parsed.slots || []).map((s) => ({
    startTime: s.startTime,
    endTime: s.endTime,
    taskId: s.taskId ?? null,
    title: s.title,
    priority: s.priority ?? null,
    missed: Boolean(s.missed),
    type: s.type || (s.taskId ? "task" : "break"),
  }));
  const unscheduled = (parsed.unscheduled || []).map((u) => ({
    taskId: u.taskId,
    title: u.title,
  }));

  return { slots, unscheduled };
}

module.exports = { generateScheduleWithAI };

