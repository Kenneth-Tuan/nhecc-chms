import { CourseClassService } from '~/../server/services/courseClass.service'
import { requireAbility } from "../../../utils/validation";

const courseClassService = new CourseClassService()

export default defineEventHandler(async (event) => {
  requireAbility(event, "delete", "CourseClass");

  const userAbility = event.context.ability
  if (!userAbility) {
    throw createError({ statusCode: 401, message: '未授權' })
  }
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({ statusCode: 400, message: '遺漏班級 ID' })
  }

  await courseClassService.deleteClass(id, userAbility)

  return { success: true }
})
