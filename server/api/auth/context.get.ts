/**
 * GET /api/auth/context
 * Returns the current user's resolved context including permissions.
 */
import { AuthService } from '../../services/auth.service';
import { getCookie } from 'h3';

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const userId =
    getCookie(event, 'mock-user-id') || authService.getDefaultUserId();

  const response = await authService.getAuthContextResponse(userId);
  return response;
});
