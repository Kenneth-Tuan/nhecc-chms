import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'

const attendanceService = new CourseAttendanceService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const body = await readBody(event)
  if (!body.payload) {
    throw createError({ statusCode: 400, message: '缺少 QR Code Payload' })
  }

  // 學生掃碼簽到
  return attendanceService.submitAttendance(userContext.userId, body.payload)
})
