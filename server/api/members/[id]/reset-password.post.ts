/**
 * POST /api/members/:id/reset-password
 * 重設指定會友的密碼為預設密碼 "123456"，並強制下次登入時修改。
 */
import { MemberService } from "../../../services/member.service";
import { requireAbility } from "../../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const uuid = event.context.params?.id;
  if (!uuid) {
    throw createError({ statusCode: 400, message: "缺少會友 UUID" });
  }

  // Check if they have permission to update THIS member
  requireAbility(event, "update", { __type: "Member", uuid } as any);

  const userContext = event.context.user;
  const ability = event.context.ability;

  if (!ability) {
    throw createError({ statusCode: 403, message: "無法驗證權限" });
  }

  await memberService.resetPassword(userContext, ability, uuid);

  return { success: true, message: "密碼已重設為 123456" };
});
