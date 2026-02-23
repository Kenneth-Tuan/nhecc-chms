/**
 * GET /api/auth/context
 * Returns the current user's resolved context including permissions.
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
