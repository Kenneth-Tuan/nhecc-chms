/**
 * GET /api/courses/classes/:id
 * 獲取單一班級詳情 (ST015)
 */
import { CourseClassService } from "../../../services/courseClass.service";
import { requireAbility } from "../../../utils/validation";

const classService = new CourseClassService();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少班級 ID" });
  }

  const ability = event.context.ability;
  if (!ability) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  const courseClass = await classService.getById(id, ability);

  return {
    data: courseClass
  };
});
