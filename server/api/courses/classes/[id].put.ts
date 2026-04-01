import { updateCourseClassSchema } from '~/schemas/course-class.schema'
import { CourseClassService } from '~/../server/services/courseClass.service'

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  const userAbility = event.context.ability
  if (!userAbility) {
    throw createError({ statusCode: 401, message: '未授權' })
  }
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '遺漏班級 ID' })
  }

  const body = await readBody(event)
  const forceOverride = body.forceOverride === true
  
  const payloadToParse = { ...body }
  delete payloadToParse.forceOverride

  const result = updateCourseClassSchema.safeParse(payloadToParse)
  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: result.error.issues[0]?.message || '資料格式錯誤',
      data: result.error.format()
    })
  }

  return courseClassService.updateClass(id, result.data, userAbility, forceOverride)
})
