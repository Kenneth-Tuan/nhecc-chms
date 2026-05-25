import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'

const attendanceService = new CourseAttendanceService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const body = await readBody(event)
  if (!body.token) {
    throw createError({ statusCode: 400, message: '缺少簽到 token' })
  }

  return attendanceService.submitAttendance(userContext.userId, body.token)
})
