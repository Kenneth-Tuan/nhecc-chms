/**
 * Audit Log Utilities (ST005)
 * Helper functions for creating audit log entries.
 */
import type { H3Event } from 'h3';
import type { CreateAuditLogPayload, AuditAction } from '~/types/audit';
import { AuditLogRepository } from '../repositories/audit.repository';

const auditRepo = new AuditLogRepository();

/**
 * Create an audit log entry (async, non-blocking).
 * According to Q5.1 decision: Async Write - don't block the main flow.
 */
export async function createAuditLog(
  payload: CreateAuditLogPayload,
): Promise<string> {
  try {
    const log = await auditRepo.create(payload);
    return log.id;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - log failures should not block the main operation
    return '';
  }
}

/**
 * Create an audit log for successful reveal operation.
 */
export async function logRevealSuccess(
  event: H3Event,
  targetMemberId: string,
  targetMemberName: string,
  fieldName: string,
): Promise<string> {
  const userContext = event.context.userContext;
  const ipAddress = getRequestIP(event, { xForwardedFor: true });
  const userAgent = getRequestHeader(event, 'user-agent');

  return await createAuditLog({
    action: 'REVEAL_SENSITIVE_DATA',
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
 * Create an audit log for failed reveal attempt (Q1.3 decision: record failures).
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
  const userAgent = getRequestHeader(event, 'user-agent');

  return await createAuditLog({
    action: 'REVEAL_ATTEMPT_FAILED',
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
 * Create a generic audit log entry.
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
 * Get audit logs count for a user within a time window (for rate limiting).
 */
export async function getRevealCountSince(
  userId: string,
  since: Date,
): Promise<number> {
  return await auditRepo.countByUserSince(userId, since);
}
