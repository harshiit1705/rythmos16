const { z } = require("zod");

const priorityEnum = z.enum(["low", "medium", "high"]);
const deadlineStringSchema = z
  .string()
  .optional()
  .refine((v) => {
    if (!v) return true;
    const t = new Date(v);
    return !Number.isNaN(t.getTime());
  }, "Invalid deadline date");

const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().optional().default(""),
  priority: priorityEnum.optional().default("medium"),
  deadline: deadlineStringSchema,
  status: z.enum(["pending", "completed"]).optional().default("pending"),
});

const taskUpdateSchema = taskCreateSchema.partial().extend({
  title: z.string().min(1).max(200).optional(),
});

const goalCreateSchema = z.object({
  title: z.string().min(1).max(200),
  targetValue: z.number().min(0),
  currentProgress: z.number().min(0).optional(),
  unit: z.string().optional().default(""),
});

const habitCreateSchema = z.object({
  title: z.string().min(1).max(200),
});

module.exports = {
  taskCreateSchema,
  taskUpdateSchema,
  goalCreateSchema,
  habitCreateSchema,
};

