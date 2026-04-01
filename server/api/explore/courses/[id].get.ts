import { CourseClassService } from '~/../server/services/courseClass.service'

export default defineEventHandler(async (event) => {
  // 檢查是否登入
  if (!event.context.userId) {
    throw createError({ statusCode: 401, message: '請先登入以瀏覽課程詳情' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少課程 ID' })
  }

  const classService = new CourseClassService()
  
  try {
    const course = await classService.getPublishedById(id)
    const userStatus = await classService.getUserEnrollmentStatus(event.context.userId)

    return {
      course,
      userStatus
    }
  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '獲取課程詳情失敗'
    })
  }
})
