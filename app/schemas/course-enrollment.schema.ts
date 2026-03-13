import { z } from 'zod'

export const courseEnrollmentSchema = z.object({
  userId: z.string().min(1, '必須指定使用者'),
  templateId: z.string().min(1, '必須指定課程模板'),
  classId: z.string().nullable().default(null),
  status: z.enum(['PENDING_WAITLIST', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED']).default('PENDING_WAITLIST'),
  credits: z.number().nonnegative().default(0),
})

export const createCourseEnrollmentSchema = courseEnrollmentSchema
export const updateCourseEnrollmentSchema = courseEnrollmentSchema.partial()

export type CreateCourseEnrollmentInput = z.infer<typeof createCourseEnrollmentSchema>
export type UpdateCourseEnrollmentInput = z.infer<typeof updateCourseEnrollmentSchema>
