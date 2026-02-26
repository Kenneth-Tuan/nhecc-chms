/**
 * GET /api/auth/context
 * 回傳當前用戶的解析後上下文 (Resolved context)，包含相關權限規則。
 */
import { AuthService } from "../../services/auth.service";

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  const response = await authService.getAuthContextResponse(userId);
  return response;
});
