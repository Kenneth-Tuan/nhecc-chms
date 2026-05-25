import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'

const attendanceService = new CourseAttendanceService()

// 此 API 為公開端點，不需要登入即可查詢 token 狀態
export default defineEventHandler(async (event) => {
  const { token } = getQuery(event) as { token?: string }

  if (!token) {
    throw createError({ statusCode: 400, message: '缺少 token' })
  }

  return attendanceService.verifyToken(token)
})
