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

  const ability = event.context.ability
  const canManage =
    ability?.can('manage', { ...targetClass, __type: 'CourseClass' } as any) ||
    ability?.can('teach', { ...targetClass, __type: 'CourseClass' } as any)

  if (!canManage) {
    throw createError({ statusCode: 403, message: '權限不足' })
  }

  const { sessionId } = getQuery(event) as { sessionId?: string }

  return attendanceService.listAttendance(classId, sessionId)
})
