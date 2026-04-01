import { CourseClassService } from '~/../server/services/courseClass.service'

export default defineEventHandler(async (event) => {
  if (!event.context.userId) {
    throw createError({ statusCode: 401, message: '請先登入以報名課程' })
  }

  const body = await readBody(event)
  if (!body.classId) {
    throw createError({ statusCode: 400, message: '缺少班級 ID' })
  }

  const service = new CourseClassService()
  await service.enrollUser(body.classId, event.context.userId)

  return { success: true }
})
