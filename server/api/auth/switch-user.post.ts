/**
 * POST /api/auth/switch-user
 * Switches the current test user (DEV mode only).
 * Sets a cookie with the mock user ID.
 */
import { readBody, setCookie } from 'h3';
import { AuthService } from '../../services/auth.service';

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const userId = body?.userId;

  if (!userId || typeof userId !== 'string') {
    throw createError({
      statusCode: 400,
      message: '請提供 userId',
    });
  }

  // Validate the user exists in test users
  const testUsers = authService.getTestUsers();
  const testUser = testUsers.find((u) => u.userId === userId);

  if (!testUser) {
    throw createError({
      statusCode: 404,
      message: `找不到測試用戶: ${userId}`,
    });
  }

  // Set cookie
  setCookie(event, 'mock-user-id', userId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: false, // Allow frontend access for dev tools
  });

  // Clear cached context for old and new user
  authService.clearCache();

  // Return the new user context
  const context = await authService.getAuthContextResponse(userId);
  return {
    success: true,
    message: `已切換至: ${testUser.fullName}`,
    ...context,
  };
});
