/**
 * DELETE /api/invitations/[token]
 * 撤銷邀請連結。
 */
import { InvitationService } from "../../services/invitation.service";
import { requireAbility } from "../../utils/validation";

const invitationService = new InvitationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "create", "Member");

  const token = getRouterParam(event, "token");
  if (!token) {
    throw createError({
      statusCode: 400,
      message: "token 為必填",
    });
  }

  await invitationService.revoke(token);
  return { success: true, message: "邀請已撤銷" };
});
