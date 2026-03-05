/**
 * POST /api/invitations
 * 建立邀請連結。僅需指定角色。
 */
import type { CreateInvitationPayload } from "~/types/invitation";
import { InvitationService } from "../../services/invitation.service";
import { requireAbility } from "../../utils/validation";

const invitationService = new InvitationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "create", "Member");

  const body = await readBody<CreateInvitationPayload>(event);

  const userId = event.context.userId as string;
  if (!userId) {
    throw createError({ statusCode: 401, message: "未認證" });
  }

  const invitation = await invitationService.create(body, userId);

  return {
    success: true,
    data: invitation,
    message: "邀請連結已建立",
  };
});
