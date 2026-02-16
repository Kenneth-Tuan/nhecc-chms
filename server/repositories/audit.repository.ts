/**
 * Audit Log Repository (ST005)
 * Handles audit log persistence (in-memory for DEV mode).
 */
import type { AuditLog, CreateAuditLogPayload } from '~/types/audit';
import { generateId } from '../utils/helpers';

/** In-memory audit logs for DEV mode */
let devAuditLogs: AuditLog[] = [];

export class AuditLogRepository {
  /**
   * Create a new audit log entry.
   */
  async create(payload: CreateAuditLogPayload): Promise<AuditLog> {
    const now = new Date().toISOString();
    const newLog: AuditLog = {
      id: generateId(),
      action: payload.action,
      userId: payload.userId,
      userName: payload.userName,
      targetMemberId: payload.targetMemberId,
      targetMemberName: payload.targetMemberName,
      fieldName: payload.fieldName,
      timestamp: now,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      details: payload.details,
    };

    devAuditLogs.push(newLog);
    return newLog;
  }

  /**
   * Find all audit logs (with optional filters).
   */
  async findAll(filters?: {
    userId?: string;
    targetMemberId?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<AuditLog[]> {
    let results = [...devAuditLogs];

    if (filters) {
      if (filters.userId) {
        results = results.filter((log) => log.userId === filters.userId);
      }
      if (filters.targetMemberId) {
        results = results.filter((log) => log.targetMemberId === filters.targetMemberId);
      }
      if (filters.action) {
        results = results.filter((log) => log.action === filters.action);
      }
      if (filters.startDate) {
        results = results.filter((log) => log.timestamp >= filters.startDate!);
      }
      if (filters.endDate) {
        results = results.filter((log) => log.timestamp <= filters.endDate!);
      }
    }

    return results.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  /**
   * Find audit logs for a specific user.
   */
  async findByUserId(userId: string): Promise<AuditLog[]> {
    return devAuditLogs.filter((log) => log.userId === userId);
  }

  /**
   * Find audit logs for a specific member (who was accessed).
   */
  async findByTargetMemberId(targetMemberId: string): Promise<AuditLog[]> {
    return devAuditLogs.filter((log) => log.targetMemberId === targetMemberId);
  }

  /**
   * Count logs by user within a time window (for rate limiting).
   */
  async countByUserSince(
    userId: string,
    since: Date,
  ): Promise<number> {
    const sinceIso = since.toISOString();
    return devAuditLogs.filter(
      (log) => log.userId === userId && log.timestamp >= sinceIso,
    ).length;
  }

  /**
   * Reset audit logs (for testing).
   */
  reset(): void {
    devAuditLogs = [];
  }

  /**
   * Get total count.
   */
  async count(): Promise<number> {
    return devAuditLogs.length;
  }
}
