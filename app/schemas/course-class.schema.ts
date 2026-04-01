import { z } from "zod";

export const classSessionSchema = z
  .object({
    sessionId: z.string().min(1),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
  })
  .refine((data) => new Date(data.startTime) < new Date(data.endTime), {
    message: "結束時間必須晚於開始時間",
    path: ["endTime"],
  });

const classAttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  type: z.enum(["PDF", "DOCUMENT", "IMAGE", "RECORDING", "LINK"]),
  source: z.enum(["template", "class"]),
  createdAt: z.string(),
  updatedAt: z.string(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
});

export const courseClassSchema = z.object({
  templateId: z.string().min(1, "必須指定課程模板"),
  name: z.string().min(1, "班級名稱為必填").max(100),
  teachers: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
      }),
    )
    .default([]),
  teacherIds: z.array(z.string()).default([]),
  status: z.enum(["SETUP", "IN_PROGRESS", "COMPLETED"]).default("SETUP"),
  startDate: z.string().min(1, "開課日期為必填"),
  endDate: z.string().min(1, "結課日期為必填"),
  location: z.string().min(1, "上課地點為必填"),
  meetingLink: z.string().url("請輸入正確的網址").or(z.literal("")).default(""),
  scheduleDescription: z.string().default(""),
  description: z.string().default(""),
  attachments: z.array(classAttachmentSchema).default([]),
  maxCapacity: z.coerce
    .number()
    .int()
    .positive("人數上限必須大於 0")
    .default(50),
  enrollmentCount: z.number().int().nonnegative().default(0),
  isPublished: z.boolean().default(false),
  sessions: z.array(classSessionSchema).default([]),
  currentSessionId: z.string().nullable().default(null),
  studentIds: z.array(z.string()).default([]),
});

export const createCourseClassSchema = courseClassSchema;
export const updateCourseClassSchema = courseClassSchema.partial();

export type CreateCourseClassInput = z.infer<typeof createCourseClassSchema>;
export type UpdateCourseClassInput = z.infer<typeof updateCourseClassSchema>;
