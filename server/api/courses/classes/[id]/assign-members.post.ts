/**
 * POST /api/courses/classes/:id/assign-members
 * 管理員批量指派學生到班級中
 */
import { CourseEnrollmentService } from "../../../../services/courseEnrollment.service";
import { requireAbility } from "../../../../utils/validation";

const enrollmentService = new CourseEnrollmentService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "CourseClass");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少班級 ID" });
  }

  const ability = event.context.ability;
  if (!ability) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  const body = await readBody(event);
  const userIds = body?.userIds;

  if (!userIds || !Array.isArray(userIds)) {
    throw createError({ statusCode: 400, message: "參數錯誤，缺少 userIds" });
  }

  await enrollmentService.adminAssignStudents(id, userIds, ability);

  return {
    success: true
  };
});
