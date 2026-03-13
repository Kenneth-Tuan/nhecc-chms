import { createCourseClassSchema } from '~/schemas/course-class.schema'
import { CourseClassService } from '~/../server/services/courseClass.service'

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  // 權限檢查: 需要有 course:manage 才能建立班級
  if (!userContext.permissions['course:manage']) {
    throw createError({ statusCode: 403, message: '無權建立課程班級' })
  }

  const body = await readBody(event)
  const forceOverride = body.forceOverride === true
  
  // 移除 forceOverride 以便 zod 解析
  const payloadToParse = { ...body }
  delete payloadToParse.forceOverride

  const result = createCourseClassSchema.safeParse(payloadToParse)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || '資料格式錯誤',
      data: result.error.format()
    })
  }

  return courseClassService.createClass(result.data, forceOverride)
})
