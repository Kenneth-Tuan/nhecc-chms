import { z } from 'zod'

export const classSessionSchema = z.object({
  sessionId: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
}).refine(data => new Date(data.startTime) < new Date(data.endTime), {
  message: "結束時間必須晚於開始時間",
  path: ["endTime"]
})

export const courseClassSchema = z.object({
  templateId: z.string().min(1, '必須指定課程模板'),
  name: z.string().min(1, '班級名稱為必填').max(100),
  teacherIds: z.array(z.string()).default([]),
  status: z.enum(['SETUP', 'IN_PROGRESS', 'COMPLETED']).default('SETUP'),
  sessions: z.array(classSessionSchema).default([]),
  currentSessionId: z.string().nullable().default(null),
})

export const createCourseClassSchema = courseClassSchema
export const updateCourseClassSchema = courseClassSchema.partial()

export type CreateCourseClassInput = z.infer<typeof createCourseClassSchema>
export type UpdateCourseClassInput = z.infer<typeof updateCourseClassSchema>
