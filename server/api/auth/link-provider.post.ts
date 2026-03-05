/**
 * POST /api/auth/link-provider
 *
 * 將第三方 Provider（Google / LINE）綁定到當前登入的 canonical 帳號。
 * 需附帶有效的 session cookie。
 */
import { getAdminAuth } from "../../utils/firebase-admin";
import { MemberRepository } from "../../repositories/member.repository";
import { AuthService } from "../../services/auth.service";

interface LinkProviderBody {
  provider: "google" | "line";
  /** Google: Firebase ID token；LINE: LINE LIFF ID token */
  providerToken: string;
}

const memberRepo = new MemberRepository();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const canonicalUid = event.context.userId as string;
  if (!canonicalUid) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  const { provider, providerToken } = await readBody<LinkProviderBody>(event);

  if (!provider || !providerToken) {
    throw createError({
      statusCode: 400,
      message: "provider and providerToken are required",
    });
  }

  let providerUid: string;

  if (provider === "google") {
    // 驗證 Google ID Token
    const auth = getAdminAuth();
    let decoded: any;
    try {
      decoded = await auth.verifyIdToken(providerToken);
    } catch {
      throw createError({ statusCode: 400, message: "無效的 Google token" });
    }
    providerUid = decoded.uid; // Google UID

    // 防止重複綁定：確認此 Google UID 未被其他 member 使用
    // 1. 查 linkedProviders 欄位
    const existingLinked = await memberRepo.findByLinkedProvider(
      "google",
      providerUid,
    );
    if (existingLinked && existingLinked.uuid !== canonicalUid) {
      throw createError({
        statusCode: 409,
        message: "此 Google 帳號已被其他帳號連結",
      });
    }
    // 2. 查 document ID（canonical UID 就是此 provider UID 的情況）
    const existingCanonical = await memberRepo.findById(providerUid);
    if (existingCanonical && existingCanonical.uuid !== canonicalUid) {
      throw createError({
        statusCode: 409,
        message: "此 Google 帳號已被其他帳號連結",
      });
    }

    await memberRepo.updateLinkedProviders(canonicalUid, {
      google: providerUid,
    });
  } else if (provider === "line") {
    // 驗證 LINE ID Token
    const config = useRuntimeConfig();
    const channelId = config.lineChannelId as string;

    let lineRes: any;
    try {
      lineRes = await $fetch("https://api.line.me/oauth2/v2.1/verify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          id_token: providerToken,
          client_id: channelId,
        }).toString(),
      });
    } catch (err: any) {
      const desc =
        err.data?.error_description || err.response?._data?.error_description;
      if (desc === "IdToken expired.") {
        throw createError({
          statusCode: 401,
          message: "LINE token 已過期",
          data: { reason: "token_expired" },
        });
      }
      throw createError({ statusCode: 400, message: "LINE token 驗證失敗" });
    }

    providerUid = lineRes.sub; // LINE userId

    // 防止重複綁定
    // 1. 查 linkedProviders 欄位
    const existingLinked = await memberRepo.findByLinkedProvider(
      "line",
      providerUid,
    );
    if (existingLinked && existingLinked.uuid !== canonicalUid) {
      throw createError({
        statusCode: 409,
        message: "此 LINE 帳號已被其他帳號連結",
      });
    }
    // 2. 查 document ID（canonical UID 就是此 provider UID 的情況）
    const existingCanonical = await memberRepo.findById(providerUid);
    if (existingCanonical && existingCanonical.uuid !== canonicalUid) {
      throw createError({
        statusCode: 409,
        message: "此 LINE 帳號已被其他帳號連結",
      });
    }

    await memberRepo.updateLinkedProviders(canonicalUid, { line: providerUid });
  } else {
    throw createError({ statusCode: 400, message: "不支援的 provider" });
  }

  // 清除 context cache，確保下次 loadContext 拿到最新的 linkedProviders
  authService.clearCache(canonicalUid);

  return { success: true };
});
