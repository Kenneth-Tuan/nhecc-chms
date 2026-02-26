/**
 * 身份驗證中間件 (Auth Middleware)
 * 驗證 Firebase 會話 Cookie (Session cookie) 並將 userId 注入事件上下文 (Event context)。
 */
import { getAdminAuth } from "../utils/firebase-admin";

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event);
  if (!url.pathname.startsWith("/api/")) {
    return;
  }

  // 對於不需要會話 (Session) 的端點跳過身份驗證
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
