/**
 * Audit Log Type Definitions (ST005)
 */

/** Audit action types */
export type AuditAction =
  | 'REVEAL_SENSITIVE_DATA'
  | 'REVEAL_ATTEMPT_FAILED'
  | 'member:create'
  | 'member:update'
  | 'member:delete';

/** Audit log entry */
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

/** Audit log create payload */
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

/** Reveal operation result for API response */
export interface RevealResult {
  revealedFields: Record<string, { value: string; auditLogId: string }>;
  failedFields: Record<string, { error: string; message: string }>;
}
