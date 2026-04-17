/**
 * DELETE /api/data-access/:userId
 * 清除該用戶所有授權。
 */
import { DataAccessRepository } from "../../../repositories/data_access.repository";
import { getUserContext, requireAbility } from "../../../utils/validation";
import { AuthService } from "../../../services/auth.service";

const repo = new DataAccessRepository();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  getUserContext(event);
  requireAbility(event, "manage", "System");

  const userId = getRouterParam(event, "userId");
  if (!userId) {
    throw createError({ statusCode: 400, message: "缺少 userId" });
  }

  await repo.deleteAccess(userId);
  authService.clearCache(userId);

  return { success: true };
});
