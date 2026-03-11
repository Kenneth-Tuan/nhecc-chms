/**
 * POST /api/profile/password-changed
 * 解除目前用戶的強制修改密碼狀態。
 */
import { MemberRepository } from "../../repositories/member.repository";
import { AuthService } from "../../services/auth.service";

const memberRepo = new MemberRepository();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  await memberRepo.update(userId, { requiresPasswordChange: false });
  authService.clearCache(userId);

  return { success: true };
});
