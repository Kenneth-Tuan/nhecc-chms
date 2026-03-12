/**
 * GET /api/courses/templates
 * 取得課程模板清單。
 */
import { getQuery } from 'h3'
import { courseTemplateFiltersSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'view', 'Course')
  const query = getQuery(event)
  const filters = validateWithSchema(courseTemplateFiltersSchema, query)
  return service.list(filters)
})
