/**
 * RBAC Middleware
 * Resolves user permissions and injects UserContext + CASL Ability into event.
 */
import { AuthService } from '../services/auth.service';
import { buildAbility } from '~/utils/casl/ability';

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  // Skip for non-API routes
  const url = getRequestURL(event);
  if (!url.pathname.startsWith('/api/')) {
    return;
  }

  // Skip for auth endpoints
  if (
    url.pathname === '/api/auth/switch-user' ||
    url.pathname === '/api/auth/context'
  ) {
    // For auth/context, resolve context but don't require it
    if (url.pathname === '/api/auth/context' && event.context.userId) {
      try {
        const context = await authService.resolveContext(
          event.context.userId,
        );
        event.context.userContext = context;
        event.context.ability = buildAbility(context);
      } catch {
        // Ignore errors for auth context
      }
    }
    return;
  }

  const userId = event.context.userId;
  if (!userId) {
    return;
  }

  try {
    const userContext = await authService.resolveContext(userId);
    event.context.userContext = userContext;
    event.context.ability = buildAbility(userContext);
  } catch (error) {
    console.error('RBAC resolution failed:', error);
    // Don't block the request - let individual endpoints handle auth
  }
});
