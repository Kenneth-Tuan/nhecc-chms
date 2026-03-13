import { z } from 'zod'

export const courseAttendanceSchema = z.object({
  classId: z.string().min(1, '必須指定班級'),
  sessionId: z.string().min(1, '必須指定堂數'),
  userId: z.string().min(1, '必須指定使用者'),
  status: z.enum(['PRESENT', 'ABSENT', 'EXCUSED']).default('PRESENT'),
  scannedAt: z.string().datetime().nullable().default(null),
  scannedBy: z.string().nullable().default(null),
})

export const createCourseAttendanceSchema = courseAttendanceSchema
export const updateCourseAttendanceSchema = courseAttendanceSchema.partial()

export type CreateCourseAttendanceInput = z.infer<typeof createCourseAttendanceSchema>
export type UpdateCourseAttendanceInput = z.infer<typeof updateCourseAttendanceSchema>
