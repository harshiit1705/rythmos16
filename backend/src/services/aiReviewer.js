const OpenAI = require("openai");

function buildMockReview({ stats }) {
  const suggestions = [];

  if (stats.missedCount > 0) {
    suggestions.push(
      `You missed ${stats.missedCount} task(s). Consider breaking high-priority tasks into smaller sessions and starting with the earliest deadlines first.`
    );
  }

  if (stats.completedCount === 0) {
    suggestions.push(`No tasks were marked completed. Pick 1–2 “starter” tasks (high impact, low friction) and schedule them first.`);
  } else {
    suggestions.push(
      `Completed ${stats.completedCount} task(s). Try protecting your focus window by moving low-priority tasks to later slots.`
    );
  }

  if (stats.habitMarks === 0) {
    suggestions.push(`Habits weren’t marked much this week. Add a quick habit check-in at the same time each day to improve consistency.`);
  } else if (stats.habitMarks < stats.completedCount) {
    suggestions.push(`Your habit check-ins are lower than task completions. Pair one habit with a task (e.g., 10 minutes of study right after gym).`);
  }

  suggestions.push(`For next week: set 2 goals with a clear measurement and review missed deadlines every Sunday.`);

  return { suggestions };
}

async function generateReviewWithAI(input) {
  if (!process.env.OPENAI_API_KEY) {
    return buildMockReview({ stats: input.stats });
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const prompt = `
You are an expert student coach for a productivity system.

Given weekly stats, produce practical suggestions to improve next week.

Return strict JSON:
{ "suggestions": string[] }

Input JSON:
${JSON.stringify(input)}
`.trim();

  const resp = await openai.chat.completions.create({
    model,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3,
  });

  const text = resp.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned empty review content");

  const parsed = JSON.parse(text);
  return { suggestions: parsed.suggestions || [] };
}

module.exports = { generateReviewWithAI };

