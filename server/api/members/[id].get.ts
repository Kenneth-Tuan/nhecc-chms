/**
 * GET /api/members/:id
 * 獲取單一會友詳情，包含資料遮蔽處理。
 */
import { MemberService } from "../../services/member.service";
import { getUserContext, requireAbility } from "../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const userContext = getUserContext(event);
  requireAbility(event, "view", "Member");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少會友 ID" });
  }

  const detail = await memberService.getDetail(
    userContext,
    event.context.ability!,
    id,
  );
  return detail;
});
