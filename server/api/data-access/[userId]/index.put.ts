/**
 * PUT /api/data-access/:userId
 * 整批覆寫該用戶的 data_access 文件。
 */
import { readBody } from "h3";
import type { SetDataAccessPayload } from "~/types/data-access";
import { DataAccessRepository } from "../../../repositories/data_access.repository";
import { getUserContext, requireAbility } from "../../../utils/validation";
import { AuthService } from "../../../services/auth.service";

const repo = new DataAccessRepository();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const ctx = getUserContext(event);
  requireAbility(event, "manage", "System");

  const userId = getRouterParam(event, "userId");
  if (!userId) {
    throw createError({ statusCode: 400, message: "缺少 userId" });
  }

  const body = (await readBody(event)) as SetDataAccessPayload;
  if (!body?.admin || !body?.functions) {
    throw createError({ statusCode: 400, message: "資料格式不正確" });
  }

  await repo.setAccess(userId, body, ctx.userId);
  authService.clearCache(userId);

  return { success: true };
});
