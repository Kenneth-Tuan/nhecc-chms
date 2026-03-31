/**
 * 課程模板 Zod 驗證 Schema (ST015)
 */
import { z } from 'zod'

const prerequisiteSchema = z.object({
  type: z.enum(['COURSE', 'STATUS']),
  value: z.string().min(1),
})

const courseDurationSchema = z.object({
  type: z.enum(['WEEKLY', 'EVENT']),
  weeks: z.number().int().positive().optional(),
  hoursPerSession: z.number().positive().optional(),
})

const courseAttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.string(),
})

export const createCourseTemplateSchema = z.object({
  name: z.string().min(1, '課程名稱為必填').max(100),
  code: z
    .string()
    .min(1, '課程代號為必填')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, '課程代號只能包含大寫英文、數字與連字號'),
  categoryIds: z.array(z.string()).default([]),
  format: z
    .enum([
      'LARGE_GROUP',
      'SMALL_GROUP',
      'ONE_ON_ONE',
      'CORPORATE',
      'VIDEO_LARGE',
      'YT_CORPORATE',
      'OUTREACH',
    ])
    .optional(),
  prerequisites: z.array(prerequisiteSchema).default([]),
  estimatedDuration: courseDurationSchema.optional(),
  frequency: z
    .enum([
      'MONTHLY',
      'TWICE_YEARLY',
      'YEARLY',
      'ONE_TO_TWICE_YEARLY',
      'AS_PLANNED',
      'IRREGULAR',
    ])
    .optional(),
  attachments: z.array(courseAttachmentSchema).default([]),
  syllabus: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const updateCourseTemplateSchema = createCourseTemplateSchema.partial()

export const courseTemplateFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'all']).default('all'),
  categoryId: z.string().optional(),
})

export const createCourseCategorySchema = z.object({
  name: z.string().min(1, '分類名稱為必填').max(50),
  order: z.coerce.number().int().nonnegative().default(0),
  description: z.string().max(200).optional(),
})

export const updateCourseCategorySchema = createCourseCategorySchema.partial()

// 型別推導
export type CreateCourseTemplateInput = z.infer<
  typeof createCourseTemplateSchema
>
export type UpdateCourseTemplateInput = z.infer<
  typeof updateCourseTemplateSchema
>
export type CourseTemplateFiltersInput = z.infer<
  typeof courseTemplateFiltersSchema
>
export type CreateCourseCategoryInput = z.infer<
  typeof createCourseCategorySchema
>
export type UpdateCourseCategoryInput = z.infer<
  typeof updateCourseCategorySchema
>
