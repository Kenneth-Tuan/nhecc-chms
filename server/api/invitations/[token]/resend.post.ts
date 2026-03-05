/**
 * POST /api/invitations/[token]/resend
 * 重新發送邀請（產生新 token + 重設 24h 有效期）。
 */
import { InvitationService } from "../../../services/invitation.service";
import { requireAbility } from "../../../utils/validation";

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

  const userId = event.context.userId as string;
  if (!userId) {
    throw createError({ statusCode: 401, message: "未認證" });
  }
  const newInvitation = await invitationService.resend(token, userId);

  return {
    success: true,
    data: newInvitation,
    message: "邀請連結已重新產生",
  };
});
