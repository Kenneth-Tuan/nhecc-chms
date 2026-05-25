import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'
import { CourseClassRepository } from '~/../server/repositories/courseClass.repository'

const attendanceService = new CourseAttendanceService()
const classRepo = new CourseClassRepository()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, 'id')
  if (!classId) {
    throw createError({ statusCode: 400, message: '缺少班級 ID' })
  }

  const targetClass = await classRepo.findById(classId)
  if (!targetClass) {
    throw createError({ statusCode: 404, message: '找不到班級' })
  }

  const userId = userContext.userId
  const isParticipant =
    targetClass.studentIds.includes(userId) || targetClass.teacherIds.includes(userId)

  if (!isParticipant) {
    throw createError({ statusCode: 403, message: '您不是此班級的成員' })
  }

  return attendanceService.listMyAttendance(userId, classId)
})
