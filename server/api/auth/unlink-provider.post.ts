/**
 * POST /api/auth/unlink-provider
 *
 * 解除第三方 Provider 的綁定。
 * 防止鎖帳邏輯：至少需保留一個有效的登入方式。
 * 需附帶有效的 session cookie。
 */
import { MemberRepository } from "../../repositories/member.repository";

interface UnlinkProviderBody {
  provider: "google" | "line";
}

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  const canonicalUid = event.context.userId as string;
  if (!canonicalUid) {
    throw createError({ statusCode: 401, message: "未登入" });
  }

  const { provider } = await readBody<UnlinkProviderBody>(event);
  if (!provider) {
    throw createError({ statusCode: 400, message: "provider is required" });
  }

  const member = await memberRepo.findById(canonicalUid);
  if (!member) {
    throw createError({ statusCode: 404, message: "找不到帳號" });
  }

  // 防止鎖帳：計算解綁後剩餘的有效登入方式數量
  const isLineAccount = canonicalUid.startsWith("line_");
  const hasEmail = !isLineAccount; // Email 帳號自帶 email/password 登入
  const hasLine = !!member.linkedProviders?.line || isLineAccount;
  const hasGoogle = !!member.linkedProviders?.google;

  const methodCount = [hasEmail, hasLine, hasGoogle].filter(Boolean).length;
  if (methodCount <= 1) {
    throw createError({
      statusCode: 400,
      message: "無法解除連結，帳號至少需保留一個登入方式",
    });
  }

  await memberRepo.updateLinkedProviders(canonicalUid, { [provider]: null });

  return { success: true };
});
