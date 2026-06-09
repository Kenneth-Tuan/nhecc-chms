/**
 * DELETE /api/courses/classes/:classId/students/:userId
 * 管理員將學生從指定實體班級移除，並刪除對應的報名紀錄
 */
import { CourseEnrollmentService } from "../../../../../services/courseEnrollment.service";
import { requireAbility } from "../../../../../utils/validation";

const enrollmentService = new CourseEnrollmentService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "CourseClass");

  const classId = getRouterParam(event, "id");
  const userId = getRouterParam(event, "userId");

  if (!classId) {
    throw createError({ statusCode: 400, message: "缺少班級 ID" });
  }
  if (!userId) {
    throw createError({ statusCode: 400, message: "缺少學員 ID" });
  }

  const ability = event.context.ability;
  if (!ability) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  await enrollmentService.removeStudentFromClass(classId, userId, ability);

  return {
    success: true,
  };
});
