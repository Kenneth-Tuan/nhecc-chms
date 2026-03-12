/**
 * POST /api/course-categories
 * 新增課程分類。
 */
import { readBody } from 'h3'
import { createCourseCategorySchema } from '~/schemas/course.schema'
import { CourseCategoryService } from '../../services/courseCategory.service'
import { requireAbility, validateWithSchema } from '../../utils/validation'

const service = new CourseCategoryService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'create', 'Course')
  const body = await readBody(event)
  const payload = validateWithSchema(createCourseCategorySchema, body)
  const category = await service.create(payload)
  return { success: true, data: category, message: '課程分類建立成功' }
})
