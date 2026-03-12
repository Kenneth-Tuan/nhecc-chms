/**
 * DELETE /api/course-categories/:id
 * 刪除課程分類（使用中時禁止刪除）。
 */
import { CourseCategoryService } from '../../services/courseCategory.service'
import { requireAbility } from '../../utils/validation'

const service = new CourseCategoryService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'delete', 'Course')
  const id = getRouterParam(event, 'id')!
  await service.delete(id)
  return { success: true, message: '課程分類刪除成功' }
})
