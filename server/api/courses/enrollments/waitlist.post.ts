import { CourseEnrollmentService } from '~/../server/services/courseEnrollment.service'

const enrollmentService = new CourseEnrollmentService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const body = await readBody(event)
  if (!body.templateId) {
    throw createError({ statusCode: 400, message: '缺少 templateId' })
  }

  // 學生可以為自己加入 waitlist。如果是代為報名，需要檢查權限。
  // 這裡預設為目前登入者加入。
  return enrollmentService.joinWaitlist(userContext.userId, body.templateId)
})
