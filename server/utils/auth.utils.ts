/**
 * Auth Utils
 * Canonical UID 查表邏輯，供所有登入/綁定 API 共用。
 */
import { MemberRepository } from "../repositories/member.repository";

export interface ResolveCanonicalResult {
  canonicalUid: string;
  isNewUser: boolean;
}

const memberRepo = new MemberRepository();

/**
 * 解析 Canonical UID
 *
 * 流程：
 * 1. 直接用 firebaseUid 查 member（適用大部分情況）
 * 2. 查不到時，用 linkedProviders.{provider} 查表（帳號已綁定的情況）
 * 3. 兩者都找不到 → isNewUser = true
 *
 * @param firebaseUid - Firebase UID（LINE 為 line_xxx，Google 為 Google UID）
 * @param provider - Provider 類型
 * @param providerUid - Provider 原始 UID（LINE userId 或 Google UID）
 */
export async function resolveCanonicalUid(
  firebaseUid: string,
  provider: "google" | "line",
  providerUid: string,
): Promise<ResolveCanonicalResult> {
  // Step 1: 直接查（自己就是 canonical，或初次登入的新用戶）
  const directMatch = await memberRepo.findById(firebaseUid);
  if (directMatch) {
    return { canonicalUid: firebaseUid, isNewUser: false };
  }

  // Step 2: 查 linkedProviders 欄位（此 provider 已被綁定到另一個 canonical UID）
  const linkedMatch = await memberRepo.findByLinkedProvider(
    provider,
    providerUid,
  );
  if (linkedMatch) {
    return { canonicalUid: linkedMatch.uuid, isNewUser: false };
  }

  // Step 3: 新用戶
  return { canonicalUid: firebaseUid, isNewUser: true };
}
