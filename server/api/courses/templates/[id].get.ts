/**
 * GET /api/courses/templates/:id
 * 取得單一課程模板詳情。
 */
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'view', 'Course')
  const id = getRouterParam(event, 'id')!
  return service.getById(id)
})
