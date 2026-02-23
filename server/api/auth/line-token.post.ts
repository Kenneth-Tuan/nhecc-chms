/**
 * POST /api/auth/line-token
 *
 * Verifies a LINE LIFF ID token via LINE's official Verify ID token endpoint
 * (https://developers.line.biz/en/reference/line-login/#verify-id-token),
 * then creates or retrieves a Firebase user and returns a custom token.
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
    throw createError({ statusCode: 500, message: "LINE Channel ID not configured" });
  }

  // Step 1: Verify ID token via LINE Login v2.1 API
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
  // Firebase UID must match [a-zA-Z0-9-_.], colons are not allowed
  const firebaseUid = `line_${verifyRes.sub}`;

  // Check Member record to determine if this is a new user for our app.
  // Firebase user is created automatically on the client when signInWithCustomToken
  // is called — no need to call admin.createUser() here.
  const existingMember = await memberRepo.findById(firebaseUid);
  const isNewUser = !existingMember;

  // Create Firebase custom token
  const customToken = await auth.createCustomToken(firebaseUid);

  return {
    customToken,
    isNewUser,
    lineProfile: {
      name: verifyRes.name || "",
      picture: verifyRes.picture || "",
    },
  };
});
