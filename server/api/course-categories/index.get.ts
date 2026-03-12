/**
 * GET /api/course-categories
 * 取得課程分類清單。
 */
import { CourseCategoryService } from '../../services/courseCategory.service'
import { requireAbility } from '../../utils/validation'

const service = new CourseCategoryService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'view', 'Course')
  return service.list()
})
