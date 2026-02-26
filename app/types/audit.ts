/**
 * 稽核日誌型別定義 (ST005)
 */

/** 稽核操作類型列舉 */
export type AuditAction =
  | "REVEAL_SENSITIVE_DATA"
  | "REVEAL_ATTEMPT_FAILED"
  | "member:create"
  | "member:update"
  | "member:delete";

/** 稽核日誌條目介面 */
export interface AuditLog {
  id: string;
  action: AuditAction;
  userId: string;
  userName: string;
  targetMemberId?: string;
  targetMemberName?: string;
  fieldName?: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

/** 稽核日誌建立請求資料 */
export interface CreateAuditLogPayload {
  action: AuditAction;
  userId: string;
  userName: string;
  targetMemberId?: string;
  targetMemberName?: string;
  fieldName?: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, unknown>;
}

/** API 回應中的解鎖操作結果介面 */
export interface RevealResult {
  revealedFields: Record<string, { value: string; auditLogId: string }>;
  failedFields: Record<string, { error: string; message: string }>;
}
