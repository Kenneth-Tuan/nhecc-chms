import { CourseEnrollmentService } from '~/../server/services/courseEnrollment.service'

const enrollmentService = new CourseEnrollmentService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  requireAbility(event, "manage", "CourseClass");

  const body = await readBody(event)
  if (!body.classId || !Array.isArray(body.enrollmentIds)) {
    throw createError({ statusCode: 400, message: '參數錯誤' })
  }

  await enrollmentService.assignStudentsToClass(body.classId, body.enrollmentIds)
  return { success: true }
})
