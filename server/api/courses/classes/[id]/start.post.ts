import { CourseClassService } from '~/../server/services/courseClass.service'

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, 'id')
  if (!classId) {
    throw createError({ statusCode: 400, message: '缺少 classId' })
  }

  // 權限在 Service 中檢查（需要是該班級的老師或具有管理權限）
  // 為了簡化，這裡將 userContext.userId 傳入作為 teacherId，
  // 若管理員能代為開啟，需要在 Service 中多做判斷或在此傳入一個具有 override 能力的 flag
  
  return courseClassService.startCourse(classId, userContext.userId)
})
