/**
 * POST /api/auth/line-token
 *
 * 透過 LINE 官方的 Verify ID token 端點驗證 LINE LIFF ID token
 * (https://developers.line.biz/en/reference/line-login/#verify-id-token)，
 * 隨後建立或獲取 Firebase 用戶並回傳自定義 Token (Custom token)。
 */
import { getAdminAuth } from "../../utils/firebase-admin";
import { resolveCanonicalUid } from "../../utils/auth.utils";

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
  let verifyRes: LineVerifyResponse;
  try {
    verifyRes = await $fetch<LineVerifyResponse>(
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
  } catch (err: any) {
    const errorDescription =
      err.data?.error_description || err.response?._data?.error_description;
    if (errorDescription === "IdToken expired.") {
      throw createError({
        statusCode: 401,
        message: "LINE ID Token has expired",
        data: { reason: "token_expired" },
      });
    }
    throw createError({
      statusCode: 400,
      message: "LINE ID Token verification failed",
    });
  }

  if (!verifyRes.sub) {
    throw createError({ statusCode: 401, message: "Invalid LINE ID token" });
  }

  const auth = getAdminAuth();
  const lineUserId = verifyRes.sub;
  // Firebase UID 必須符合 [a-zA-Z0-9-_.], 不允許冒號
  const firebaseUid = `line_${lineUserId}`;

  // 步驟 2：Canonical UID 查表
  // 若 LINE UID 已被綁定到某個 canonical 帳號，使用 canonical UID 發 token
  const { canonicalUid, isNewUser } = await resolveCanonicalUid(
    firebaseUid,
    "line",
    lineUserId,
  );

  // 建立 Firebase 自定義 Token (Custom token)
  const customToken = await auth.createCustomToken(canonicalUid);

  return {
    customToken,
    isNewUser,
    lineProfile: {
      userId: lineUserId,
      name: verifyRes.name || "",
      picture: verifyRes.picture || "",
      email: verifyRes.email || "",
    },
  };
});
