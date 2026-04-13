/**
 * GET /api/courses/classes
 * 獲取班級列表，支援過濾 (ST015)
 */
import { getQuery } from "h3";
import { CourseClassService } from "../../../services/courseClass.service";
import { requireAbility } from "../../../utils/validation";

const classService = new CourseClassService();

export default defineEventHandler(async (event) => {
  // 檢查權限
  requireAbility(event, "view", "CourseClass");

  const query = getQuery(event);
  const ability = event.context.ability;

  const filters = {
    teacherId: query.teacherId as string,
    categoryId: query.categoryId as string,
    status: query.status as any,
    search: query.search as string,
  };

  if (!ability) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  const classes = await classService.list(filters, ability);

  return {
    data: classes,
  };
});
