/**
 * POST /api/auth/session
 * 驗證 ID token 並建立 Firebase 會期 Cookie (Session cookie)。
 *
 * 當 Google 等第三方帳號已綁定到既有 canonical 帳號時，
 * 會自動解析 canonical UID，並透過 canonical_uid cookie 供 middleware 映射。
 */
import { getAdminAuth } from "../../utils/firebase-admin";
import { MemberRepository } from "../../repositories/member.repository";
import { resolveCanonicalUid } from "../../utils/auth.utils";

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;
const FIVE_DAYS_SEC = 5 * 24 * 60 * 60;

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken: string }>(event);

  if (!idToken) {
    throw createError({ statusCode: 400, message: "idToken is required" });
  }

  const auth = getAdminAuth();
  const decodedToken = await auth.verifyIdToken(idToken);
  const firebaseUid = decodedToken.uid;

  // 判斷 provider 類型
  const signInProvider = decodedToken.firebase?.sign_in_provider || "password";

  let canonicalUid = firebaseUid;
  let isNewUser = false;

  if (signInProvider === "google.com") {
    // Google 登入：查 member doc + linkedProviders 解析 canonical UID
    const result = await resolveCanonicalUid(
      firebaseUid,
      "google",
      firebaseUid,
    );
    canonicalUid = result.canonicalUid;
    isNewUser = result.isNewUser;
  } else {
    // Email/Password、LINE（custom token）等：直接查 member
    const existingMember = await memberRepo.findById(firebaseUid);
    isNewUser = !existingMember;
  }

  // 建立 session cookie（基於原始 idToken）
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

  // 如果 canonical UID 與 Firebase UID 不同（已綁定帳號），
  // 額外設定 canonical_uid cookie 供 middleware 映射
  if (canonicalUid !== firebaseUid) {
    setCookie(event, "canonical_uid", canonicalUid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: FIVE_DAYS_SEC,
      sameSite: "lax",
    });
  } else {
    // 非綁定帳號登入時，清除可能殘留的 canonical_uid cookie
    deleteCookie(event, "canonical_uid");
  }

  return { uid: canonicalUid, isNewUser };
});
