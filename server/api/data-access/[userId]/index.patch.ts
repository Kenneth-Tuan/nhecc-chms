/**
 * PATCH /api/data-access/:userId
 * 更新授權（支援 grant/revoke/setGlobal 操作）。
 */
import { readBody } from "h3";
import type { DataAccessPatchPayload } from "~/types/data-access";
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

  const body = (await readBody(event)) as DataAccessPatchPayload;
  if (!body || !body.action) {
    throw createError({ statusCode: 400, message: "缺少 action" });
  }

  const updatedBy = ctx.userId;

  switch (body.action) {
    case "grant":
      if (body.scope === "admin") {
        await repo.grantAdmin(userId, body.field, body.id, updatedBy);
      } else {
        await repo.grantFunction(userId, body.targetType, body.id, updatedBy);
      }
      break;

    case "revoke":
      if (body.scope === "admin") {
        await repo.revokeAdmin(userId, body.field, body.id, updatedBy);
      } else {
        await repo.revokeFunction(userId, body.targetType, body.id, updatedBy);
      }
      break;

    case "setGlobal":
      await repo.setGlobal(userId, body.scope, body.isGlobal, updatedBy);
      break;

    default:
      throw createError({ statusCode: 400, message: "不支援的操作" });
  }

  authService.clearCache(userId);

  return { success: true };
});
