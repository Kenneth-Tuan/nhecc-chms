/**
 * GET /api/invitations/[token]
 * 公開 API：根據 token 取得邀請預填資料。
 */
import { InvitationService } from "../../services/invitation.service";

const invitationService = new InvitationService();

export default defineEventHandler(async (event) => {
  const token = getRouterParam(event, "token");

  if (!token) {
    throw createError({
      statusCode: 400,
      message: "token 為必填",
    });
  }

  const publicInfo = await invitationService.getPublicInfo(token);
  return { success: true, data: publicInfo };
});
