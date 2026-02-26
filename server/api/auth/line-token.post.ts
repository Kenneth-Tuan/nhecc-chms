/**
 * POST /api/auth/line-token
 *
 * 透過 LINE 官方的 Verify ID token 端點驗證 LINE LIFF ID token
 * (https://developers.line.biz/en/reference/line-login/#verify-id-token)，
 * 隨後建立或獲取 Firebase 用戶並回傳自定義 Token (Custom token)。
 */
import { getAdminAuth } from "../../utils/firebase-admin";
import { MemberRepository } from "../../repositories/member.repository";

interface LineVerifyResponse {
  iss: string;
  sub: string;
  aud: string;
  exp: number;
  iat: number;
  name?: string;
  picture?: string;
  email?: string;
}

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  const { idToken } = await readBody<{ idToken: string }>(event);

  if (!idToken) {
    throw createError({ statusCode: 400, message: "idToken is required" });
  }

  const config = useRuntimeConfig();
  const channelId = config.lineChannelId as string;

  if (!channelId) {
    throw createError({
      statusCode: 500,
      message: "LINE Channel ID not configured",
    });
  }

  // 步驟 1：透過 LINE Login v2.1 API 驗證 ID token
  const verifyRes = await $fetch<LineVerifyResponse>(
    "https://api.line.me/oauth2/v2.1/verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        id_token: idToken,
        client_id: channelId,
      }).toString(),
    },
  );

  if (!verifyRes.sub) {
    throw createError({ statusCode: 401, message: "Invalid LINE ID token" });
  }

  const auth = getAdminAuth();
  // Firebase UID 必須符合 [a-zA-Z0-9-_.], 不允許冒號
  const firebaseUid = `line_${verifyRes.sub}`;

  // 檢查會友記錄以判斷是否為應用程式的新用戶。
  // Firebase 用戶會在用戶端呼叫 signInWithCustomToken 時自動建立，在此不需要呼叫 admin.createUser()。
  const existingMember = await memberRepo.findById(firebaseUid);
  const isNewUser = !existingMember;

  // 建立 Firebase 自定義 Token (Custom token)
  const customToken = await auth.createCustomToken(firebaseUid);

  return {
    customToken,
    isNewUser,
    lineProfile: {
      userId: verifyRes.sub,
      name: verifyRes.name || "",
      picture: verifyRes.picture || "",
    },
  };
});
