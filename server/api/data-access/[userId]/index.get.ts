/**
 * GET /api/data-access/:userId
 * 取得該用戶的完整 data_access 文件。
 */
import { DataAccessRepository } from "../../../repositories/data_access.repository";
import { getUserContext, requireAbility } from "../../../utils/validation";
import { createEmptyDataAccess } from "~/types/data-access";

const repo = new DataAccessRepository();

export default defineEventHandler(async (event) => {
  getUserContext(event);
  requireAbility(event, "manage", "System");

  const userId = getRouterParam(event, "userId");
  if (!userId) {
    throw createError({ statusCode: 400, message: "缺少 userId" });
  }

  const data = await repo.findByUserId(userId);

  return {
    success: true,
    data: data ?? { ...createEmptyDataAccess(), updatedAt: null, updatedBy: null },
  };
});
