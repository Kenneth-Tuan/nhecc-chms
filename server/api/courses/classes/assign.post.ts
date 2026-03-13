import { CourseClassService } from '~/../server/services/courseClass.service'

const classService = new CourseClassService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  if (!userContext.permissions['course:manage']) {
    throw createError({ statusCode: 403, message: '無權限指派學生' })
  }

  const body = await readBody(event)
  if (!body.classId || !Array.isArray(body.enrollmentIds)) {
    throw createError({ statusCode: 400, message: '參數錯誤' })
  }

  await classService.assignStudentsToClass(body.classId, body.enrollmentIds)
  return { success: true }
})
