/**
 * GET /api/auth/me
 * 獲取當前登入用戶的完整會友詳情。
 */
import { MemberService } from "../../services/member.service";
import { AuthService } from "../../services/auth.service";
import { buildAbility } from "~/utils/casl/ability";

const memberService = new MemberService();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  // 1. 獲取用戶上下文以建立 Ability（用於資料遮蔽檢查，雖然本人通常可看全貌）
  const userContext = await authService.resolveContext(userId);
  const ability = buildAbility(userContext);

  // 2. 獲取詳情資料
  // 注意：MemberService.getDetail 內部也會檢查 Scope
  const member = await memberService.getDetail(userContext, ability, userId);

  return {
    success: true,
    data: member,
  };
});
