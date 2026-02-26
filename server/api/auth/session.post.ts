/**
 * POST /api/auth/session
 * 驗證 ID token 並建立 Firebase 會期 Cookie (Session cookie)。
 */
import { getAdminAuth } from "../../utils/firebase-admin";
import { MemberRepository } from "../../repositories/member.repository";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const FIVE_DAYS_SEC = 5 * 24 * 60 * 60;

export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken: string }>(event);

  if (!idToken) {
    throw createError({ statusCode: 400, message: "idToken is required" });
  }

  const auth = getAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: FIVE_DAYS_MS,
  });

  setCookie(event, "session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: FIVE_DAYS_SEC,
    sameSite: "lax",
  });

  const memberRepo = new MemberRepository();
  const existingMember = await memberRepo.findById(decodedToken.uid);
  const isNewUser = !existingMember;

  return { uid: decodedToken.uid, isNewUser };
});
