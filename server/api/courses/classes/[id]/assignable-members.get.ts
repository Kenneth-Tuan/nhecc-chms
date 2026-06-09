/**
 * GET /api/courses/classes/:id/assignable-members
 * 獲取此班級的可指派會員列表
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

  const data = await enrollmentService.getAssignableMembers(id, ability);

  return {
    data
  };
});
