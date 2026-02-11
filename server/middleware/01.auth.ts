/**
 * Auth Middleware
 * DEV: Reads mock user from cookie
 * PROD: Validates Firebase session token (future)
 */
import { getCookie } from 'h3';
import { AuthService } from '../services/auth.service';

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  // Skip auth for non-API routes
  const url = getRequestURL(event);
  if (!url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip auth for the switch-user endpoint itself
  if (url.pathname === '/api/auth/switch-user') {
    return;
  }

  // DEV mode: read from cookie
  const mockUserId =
    getCookie(event, 'mock-user-id') || authService.getDefaultUserId();

  try {
    event.context.userId = mockUserId;
  } catch {
    // If user not found, use default
    event.context.userId = authService.getDefaultUserId();
  }
});
