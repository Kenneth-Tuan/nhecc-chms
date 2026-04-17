/**
 * DAC Engine — 資料存取控制引擎
 * 快取整份 data_access 文件，提供 scope 解析工具。
 */
import type { DataAccess } from "~/types/data-access";
import { DataAccessRepository } from "../repositories/data_access.repository";

const repo = new DataAccessRepository();

const dacCache = new Map<string, { data: DataAccess | null; expiresAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * 取得某用戶的 DataAccess 文件（帶快取）。
 * Cache miss → 單次 doc.get()。
 */
export async function getDataAccess(userId: string): Promise<DataAccess | null> {
  const cached = dacCache.get(userId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  const data = await repo.findByUserId(userId);
  dacCache.set(userId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

/**
 * 取得 admin scope 的可存取 IDs。
 */
export function getAdminScope(da: DataAccess) {
  return {
    isGlobal: da.admin.isGlobal,
    zone: da.admin.zone,
    group: da.admin.group,
  };
}

/**
 * 取得 functions scope 的 flatten targetIds。
 */
export function getFunctionsTargetIds(da: DataAccess) {
  const targetIds = Object.values(da.functions.targets).flat();
  return {
    isGlobal: da.functions.isGlobal,
    targetIds,
  };
}

/**
 * 清除指定用戶的 DAC 快取。
 */
export function clearDacCache(userId?: string): void {
  if (userId) {
    dacCache.delete(userId);
  } else {
    dacCache.clear();
  }
}
