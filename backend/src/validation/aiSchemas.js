const { z } = require("zod");

const deadlineStringSchema = z
  .string()
  .optional()
  .nullable()
  .refine((v) => {
    if (!v) return true;
    const t = new Date(v);
    return !Number.isNaN(t.getTime());
  }, "Invalid deadline date");

const taskBriefSchema = z.object({
  _id: z.string().optional(),
  title: z.string(),
  priority: z.enum(["low", "medium", "high"]).optional().default("medium"),
  deadline: deadlineStringSchema,
  status: z.enum(["pending", "completed"]).optional().default("pending"),
  estimatedMinutes: z.number().min(5).max(240).optional(),
  missed: z.boolean().optional().default(false),
});

const aiSchedulePostSchema = z.object({
  date: z.string().optional(), // YYYY-MM-DD preferred, but we parse in code
  // Legacy fields (still supported)
  availableTimeMinutes: z.number().min(30).max(24 * 60).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),

  // Preferred “human schedule” inputs
  wakeupTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  sleepTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  lunchTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(),
  lunchDurationMinutes: z.number().min(10).max(180).optional().default(60),

  tasks: z.array(taskBriefSchema).optional(),
});

const aiReviewPostSchema = z.object({
  weekStart: z.string().optional(), // YYYY-MM-DD
});

module.exports = { aiSchedulePostSchema, aiReviewPostSchema };

