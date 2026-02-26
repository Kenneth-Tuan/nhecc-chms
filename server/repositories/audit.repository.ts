/**
 * 稽核日誌儲存庫 (Audit Log Repository - ST005)
 * 處理稽核日誌的持久化（開發模式下存於記憶體）。
 */
import type { AuditLog, CreateAuditLogPayload } from "~/types/audit";
import { generateId } from "../utils/helpers";

/** 開發模式下的本地記憶體日誌 */
let devAuditLogs: AuditLog[] = [];

export class AuditLogRepository {
  /**
   * 建立新的稽核日誌條目。
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
   * 查找所有稽核日誌（包含可選過濾條件）。
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
        results = results.filter(
          (log) => log.targetMemberId === filters.targetMemberId,
        );
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

    return results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }

  /**
   * 查找特定用戶產生的稽核日誌。
   */
  async findByUserId(userId: string): Promise<AuditLog[]> {
    return devAuditLogs.filter((log) => log.userId === userId);
  }

  /**
   * 查找與特定會友（被操作對象）相關的稽核日誌。
   */
  async findByTargetMemberId(targetMemberId: string): Promise<AuditLog[]> {
    return devAuditLogs.filter((log) => log.targetMemberId === targetMemberId);
  }

  /**
   * 計算特定時間窗口內，特定用戶產生的日誌數量（用於速率限制）。
   */
  async countByUserSince(userId: string, since: Date): Promise<number> {
    const sinceIso = since.toISOString();
    return devAuditLogs.filter(
      (log) => log.userId === userId && log.timestamp >= sinceIso,
    ).length;
  }

  /**
   * 重置稽核日誌（用於測試）。
   */
  reset(): void {
    devAuditLogs = [];
  }

  /**
   * 獲取日誌總數。
   */
  async count(): Promise<number> {
    return devAuditLogs.length;
  }
}
