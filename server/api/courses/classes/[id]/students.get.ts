/**
 * GET /api/courses/classes/:id/students
 * 獲取班級成員清單 (ST015)
 */
import { CourseClassService } from "../../../../services/courseClass.service";

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

  const students = await classService.getClassStudents(id, ability, event.context.userContext);

  return {
    data: students
  };
});
