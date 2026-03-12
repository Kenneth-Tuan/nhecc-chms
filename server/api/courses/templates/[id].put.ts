/**
 * PUT /api/courses/templates/:id
 * 更新課程模板。
 */
import { readBody } from 'h3'
import { updateCourseTemplateSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'update', 'Course')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const payload = validateWithSchema(updateCourseTemplateSchema, body)
  const template = await service.update(id, payload)
  return { success: true, data: template, message: '課程模板更新成功' }
})
