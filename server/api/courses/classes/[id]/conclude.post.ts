import { CourseClassService } from '~/../server/services/courseClass.service'

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, 'id')
  if (!classId) {
    throw createError({ statusCode: 400, message: '缺少 classId' })
  }

  return courseClassService.concludeCourse(classId, userContext.userId)
})
