import { z } from "zod"

export const courseDetailsSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  instructor: z.string().min(1, "Instructor is required"),
  price: z
    .string()
    .optional()
    .refine(
      (val) => !val || (!isNaN(Number(val)) && Number(val) >= 0),
      "Price must be a valid number ≥ 0"
    ),
})

export const lessonSchema = z
  .object({
    title: z.string().min(1, "Title is required"),
    type: z.enum(["video", "article", "quiz", "assignment"]),
    videoUrl: z.string().optional(),
    numQuestions: z.number().optional(),
    passingScore: z.number().optional(),
    maxScore: z.number().optional(),
    daysToComplete: z.number().optional(),
  })
  .passthrough()
  .superRefine((data, ctx) => {
    if (data.type === "video" && data.videoUrl) {
      const result = z.string().url().safeParse(data.videoUrl)
      if (!result.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["videoUrl"],
          message: "Must be a valid URL",
        })
      }
    }
    if (data.type === "quiz") {
      if (data.numQuestions != null && data.numQuestions < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["numQuestions"],
          message: "Number of questions must be at least 1",
        })
      }
      if (
        data.passingScore != null &&
        (data.passingScore < 0 || data.passingScore > 100)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["passingScore"],
          message: "Passing score must be between 0 and 100",
        })
      }
    }
    if (data.type === "assignment") {
      if (data.maxScore != null && data.maxScore < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["maxScore"],
          message: "Max score must be at least 1",
        })
      }
      if (data.daysToComplete != null && data.daysToComplete < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["daysToComplete"],
          message: "Days to complete must be at least 1",
        })
      }
    }
  })

export const publishSchema = z
  .object({
    mode: z.enum(["immediate", "schedule"]),
    scheduleDate: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.mode === "schedule") {
      if (!data.scheduleDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleDate"],
          message: "Schedule date is required",
        })
      } else if (new Date(data.scheduleDate) <= new Date()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["scheduleDate"],
          message: "Schedule date must be in the future",
        })
      }
    }
  })

