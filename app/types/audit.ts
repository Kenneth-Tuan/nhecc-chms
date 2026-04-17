/**
 * 稽核日誌型別定義 (ST005)
 */

/** 稽核操作類型列舉 */
export type AuditAction =
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

