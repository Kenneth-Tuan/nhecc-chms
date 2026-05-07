import { CourseClassService } from '~/../server/services/courseClass.service'
import { requireAbility } from "../../../../utils/validation";

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "CourseClass");

  const ability = event.context.ability
  if (!ability) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, 'id')
  if (!classId) {
    throw createError({ statusCode: 400, message: '缺少 classId' })
  }

  return courseClassService.concludeCourse(classId, ability)
})
