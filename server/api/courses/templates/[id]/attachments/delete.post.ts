import { readBody } from "h3"
import { CourseTemplateService } from "../../../../../services/courseTemplate.service"
import { requireAbility } from "../../../../../utils/validation"

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'manage', 'CourseTemplate')
  const id = getRouterParam(event, 'id')!

  const body = await readBody(event)
  if (!body || !body.url) {
    throw createError({ statusCode: 400, message: '缺少要刪除的檔案連結 (url)' })
  }

  try {
    await service.removeAttachment(id, body.url)

    return {
      success: true,
      message: '檔案刪除成功',
    }
  } catch (error: any) {
    console.error('[Course Attachment Delete] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '刪除檔案失敗',
    })
  }
})
