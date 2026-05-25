import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'
import { CourseClassRepository } from '~/../server/repositories/courseClass.repository'
import type { AttendanceStatus } from '~/types/course-attendance'

const attendanceService = new CourseAttendanceService()
const classRepo = new CourseClassRepository()

const VALID_STATUSES: AttendanceStatus[] = ['PRESENT', 'ABSENT', 'EXCUSED']

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, 'id')
  const attendanceId = getRouterParam(event, 'attendanceId')

  if (!classId || !attendanceId) {
    throw createError({ statusCode: 400, message: '缺少必要參數' })
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

  const body = await readBody(event)
  if (!body.status || !VALID_STATUSES.includes(body.status)) {
    throw createError({ statusCode: 400, message: '無效的出席狀態，應為 PRESENT、ABSENT 或 EXCUSED' })
  }

  return attendanceService.updateAttendanceStatus(attendanceId, body.status, userContext.userId)
})
