/**
 * 稽核日誌工具 (ST005)
 * 用於建立稽核日誌條目的輔助函數。
 */
import type { H3Event } from "h3";
import type { CreateAuditLogPayload, AuditAction } from "~/types/audit";
import { AuditLogRepository } from "../repositories/audit.repository";

const auditRepo = new AuditLogRepository();

/**
 * 建立稽核日誌條目 (非同步，不阻塞主流程)。
 * 根據 Q5.1 決策：非同步寫入 - 不影響主操作流程。
 */
export async function createAuditLog(
  payload: CreateAuditLogPayload,
): Promise<string> {
  try {
    const log = await auditRepo.create(payload);
    return log.id;
  } catch (error) {
    console.error("建立稽核日誌失敗:", error);
    // 不拋出錯誤 - 日誌寫入失敗不應中斷主操作
    return "";
  }
}

/**
 * 記錄成功的敏感資料解鎖操作。
 */
export async function logRevealSuccess(
  event: H3Event,
  targetMemberId: string,
  targetMemberName: string,
  fieldName: string,
): Promise<string> {
  const userContext = event.context.userContext;
  const ipAddress = getRequestIP(event, { xForwardedFor: true });
  const userAgent = getRequestHeader(event, "user-agent");

  return await createAuditLog({
    action: "REVEAL_SENSITIVE_DATA",
    userId: userContext.userId,
    userName: userContext.fullName,
    targetMemberId,
    targetMemberName,
    fieldName,
    ipAddress,
    userAgent,
  });
}

/**
 * 記錄失敗的解鎖嘗試 (Q1.3 決策：記錄失敗案例)。
 */
export async function logRevealFailure(
  event: H3Event,
  targetMemberId: string,
  targetMemberName: string,
  fieldName: string,
  reason: string,
): Promise<string> {
  const userContext = event.context.userContext;
  const ipAddress = getRequestIP(event, { xForwardedFor: true });
  const userAgent = getRequestHeader(event, "user-agent");

  return await createAuditLog({
    action: "REVEAL_ATTEMPT_FAILED",
    userId: userContext.userId,
    userName: userContext.fullName,
    targetMemberId,
    targetMemberName,
    fieldName,
    ipAddress,
    userAgent,
    details: { reason },
  });
}

/**
 * 建立通用的稽核日誌條目。
 */
export async function logAction(
  action: AuditAction,
  userId: string,
  userName: string,
  details?: Record<string, unknown>,
): Promise<string> {
  return await createAuditLog({
    action,
    userId,
    userName,
    details,
  });
}

/**
 * 獲取特定用戶在一定時間範圍內的稽核日誌數量 (用於速率限制)。
 */
export async function getRevealCountSince(
  userId: string,
  since: Date,
): Promise<number> {
  return await auditRepo.countByUserSince(userId, since);
}
