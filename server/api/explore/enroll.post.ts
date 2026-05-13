import { CourseEnrollmentService } from '~/../server/services/courseEnrollment.service'

export default defineEventHandler(async (event) => {
  if (!event.context.userId) {
    throw createError({ statusCode: 401, message: '請先登入以報名課程' })
  }

  const body = await readBody(event)
  if (!body.classId) {
    throw createError({ statusCode: 400, message: '缺少班級 ID' })
  }

  const service = new CourseEnrollmentService()
  await service.enrollToClass(event.context.userId, body.classId)

  return { success: true }
})
