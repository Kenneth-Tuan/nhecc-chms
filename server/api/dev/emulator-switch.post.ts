/**
 * POST /api/dev/emulator-switch
 * 發放指定 UID 的 Firebase Custom Token，供前端 signInWithCustomToken 後走既有 session 流程。
 * 僅在 Auth/Firestore Emulator 啟用時可用；且 UID 必須已存在於 Auth Emulator（通常由 seed 建立）。
 */
import { createError, readBody } from "h3";
import { getAdminAuth } from "../../utils/firebase-admin";
import { isFirebaseEmulatorBackend } from "../../utils/firebase-emulator";
import { mockMembers } from "../../mockData/members.data";

export default defineEventHandler(async (event) => {
  if (!isFirebaseEmulatorBackend()) {
    throw createError({ statusCode: 404, message: "Not Found" });
  }

  const body = await readBody<{ uid?: string; email?: string }>(event);
  let targetUid = body.uid?.trim();

  if (!targetUid && body.email?.trim()) {
    const needle = body.email.trim().toLowerCase();
    const member = mockMembers.find(
      (m) => m.email.toLowerCase() === needle,
    );
    targetUid = member?.uuid;
  }

  if (!targetUid) {
    throw createError({
      statusCode: 400,
      message: "請提供 uid 或 email",
    });
  }

  const adminAuth = getAdminAuth();

  try {
    await adminAuth.getUser(targetUid);
  } catch {
    throw createError({
      statusCode: 404,
      message:
        "Auth Emulator 內找不到此帳號。請先執行 npm run seed:emulator（僅會建立 mock 測試帳）。",
    });
  }

  const customToken = await adminAuth.createCustomToken(targetUid);
  return { customToken, uid: targetUid };
});
