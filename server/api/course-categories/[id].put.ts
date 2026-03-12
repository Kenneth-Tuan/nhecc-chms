/**
 * PUT /api/course-categories/:id
 * 更新課程分類。
 */
import { readBody } from 'h3'
import { updateCourseCategorySchema } from '~/schemas/course.schema'
import { CourseCategoryService } from '../../services/courseCategory.service'
import { requireAbility, validateWithSchema } from '../../utils/validation'

const service = new CourseCategoryService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'update', 'Course')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const payload = validateWithSchema(updateCourseCategorySchema, body)
  const category = await service.update(id, payload)
  return { success: true, data: category, message: '課程分類更新成功' }
})
