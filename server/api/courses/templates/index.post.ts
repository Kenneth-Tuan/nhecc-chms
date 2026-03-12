/**
 * POST /api/courses/templates
 * 建立新課程模板。
 */
import { readBody } from 'h3'
import { createCourseTemplateSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'create', 'Course')
  const body = await readBody(event)
  const payload = validateWithSchema(createCourseTemplateSchema, body)
  const template = await service.create(payload)
  return { success: true, data: template, message: '課程模板建立成功' }
})
