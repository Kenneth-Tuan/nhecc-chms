import { CourseClassService } from '~/../server/services/courseClass.service'
import { CourseCategoryService } from '~/../server/services/courseCategory.service'

export default defineEventHandler(async (event) => {
  // 檢查是否登入
  if (!event.context.userId) {
    throw createError({ statusCode: 401, message: '請先登入以瀏覽課程' })
  }

  const classService = new CourseClassService()
  const categoryService = new CourseCategoryService()
  
  const [courses, userStatus, categories] = await Promise.all([
    classService.listPublished(),
    classService.getUserEnrollmentStatus(event.context.userId),
    categoryService.list()
  ])

  // 只回傳有課程的分類（或全部，這裡選擇回傳有用到的分類提升精確度，但通常全部回傳亦可配合 UI）
  // 為了 UI 體驗，我們回傳所有分類，但前端可以決定是否顯示空分類
  return {
    courses,
    categories,
    userStatus
  }
})
