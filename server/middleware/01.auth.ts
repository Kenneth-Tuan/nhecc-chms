/**
 * Auth Middleware
 * Validates Firebase session cookie and sets userId on event context.
 */
import { getAdminAuth } from "../utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/")) {
    return;
  }

  // Skip auth for endpoints that don't require session
  const publicPaths = [
    "/api/auth/session",
    "/api/auth/logout",
    "/api/auth/line-token",
    "/api/auth/register",
  ];
  if (publicPaths.includes(url.pathname)) {
    return;
  }

  const sessionCookie = getCookie(event, "session");
  if (!sessionCookie) {
    return;
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    event.context.userId = decoded.uid;
  } catch {
    deleteCookie(event, "session");
  }
});
