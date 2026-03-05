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
    "/api/auth/register-by-invitation",
  ];
  if (publicPaths.includes(url.pathname)) {
    return;
  }

  // 邀請 token 查詢為公開 API（GET /api/invitations/[token]）
  if (
    event.method === "GET" &&
    /^\/api\/invitations\/[^/]+$/.test(url.pathname)
  ) {
    return;
  }

  const sessionCookie = getCookie(event, "session");
  if (!sessionCookie) {
    return;
  }

  try {
    const auth = getAdminAuth();
    const decoded = await auth.verifySessionCookie(sessionCookie, true);

    // 如果有 canonical_uid cookie（代表此帳號是透過綁定的第三方 Provider 登入），
    // 則使用 canonical UID；否則使用 session 中的 UID
    const canonicalUid = getCookie(event, "canonical_uid");
    event.context.userId = canonicalUid || decoded.uid;
  } catch {
    deleteCookie(event, "session");
    deleteCookie(event, "canonical_uid");
  }
});
