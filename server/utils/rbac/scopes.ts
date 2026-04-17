/**
 * Data Scope 統一過濾工具（雙 scope 模式）
 * 支援 admin / functions 兩種 scope 情境。
 */
import type { UserContext } from "~/types/auth";
import { createError } from "h3";

export type ScopeType = "admin" | "functions";

export interface ScopeFieldMapping {
  zoneId?: string;
  groupId?: string;
  userId?: string;
  functionalGroupIds?: string;
}

const DEFAULT_FIELD_MAPPING: Required<ScopeFieldMapping> = {
  zoneId: "zoneId",
  groupId: "groupId",
  userId: "uuid",
  functionalGroupIds: "functionalGroupIds",
};

/**
 * 將 Scope 限制注入 filters 物件（用於列表查詢前的條件改寫）。
 * scopeType 預設為 admin。
 */
export function applyScopeConstraints<T extends Record<string, any>>(
  ctx: UserContext,
  filters: T,
  scopeType: ScopeType = "admin",
  mapping?: ScopeFieldMapping,
): T {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };
  const scoped = { ...filters };

  if (scopeType === "admin") {
    const admin = ctx.accessScope.admin;
    if (admin.isGlobal) return scoped;

    if (admin.zone.length > 0) {
      (scoped as any)[m.zoneId] = admin.zone.length === 1 ? admin.zone[0] : admin.zone;
    } else if (admin.group.length > 0) {
      (scoped as any)[m.groupId] = admin.group.length === 1 ? admin.group[0] : admin.group;
    }
  } else {
    const fn = ctx.accessScope.functions;
    if (fn.isGlobal) return scoped;

    const targetIds = Object.values(fn.targets).flat();
    if (targetIds.length > 0) {
      (scoped as any)[m.functionalGroupIds] = targetIds;
    }
  }

  return scoped;
}

/**
 * 檢查用戶是否具有存取該 Entity 的 Scope 權限（用於單筆存取檢查）。
 * 若不符合，直接 throw 403 錯誤。
 * scopeType 預設為 admin。
 */
export function assertScopeAccess(
  ctx: UserContext,
  entity: Record<string, any>,
  scopeType: ScopeType = "admin",
  mapping?: ScopeFieldMapping,
): void {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };

  if (scopeType === "admin") {
    const admin = ctx.accessScope.admin;
    if (admin.isGlobal) return;

    if (admin.zone.length > 0 && admin.zone.includes(entity[m.zoneId])) return;

    if (admin.group.length > 0) {
      const entityGroupId = entity[m.groupId];
      if (entityGroupId && admin.group.includes(entityGroupId)) return;

      const entityFgIds = entity[m.functionalGroupIds];
      if (
        Array.isArray(entityFgIds) &&
        entityFgIds.some((fgId: string) => admin.group.includes(fgId))
      ) {
        return;
      }
    }
  } else {
    const fn = ctx.accessScope.functions;
    if (fn.isGlobal) return;

    const targetIds = Object.values(fn.targets).flat();
    if (targetIds.length > 0) {
      const entityFgIds = entity[m.functionalGroupIds];
      if (
        Array.isArray(entityFgIds) &&
        entityFgIds.some((fgId: string) => targetIds.includes(fgId))
      ) {
        return;
      }
    }
  }

  if (entity[m.userId] === ctx.userId) return;

  throw createError({
    statusCode: 403,
    message: "無權存取此資料",
  });
}

/**
 * 在記憶體中過濾已撈出的陣列，只保留符合 Scope 的項目。
 * scopeType 預設為 admin。
 */
export function filterByScope<T extends Record<string, any>>(
  ctx: UserContext,
  items: T[],
  scopeType: ScopeType = "admin",
  mapping?: ScopeFieldMapping,
): T[] {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };

  if (scopeType === "admin") {
    const admin = ctx.accessScope.admin;
    if (admin.isGlobal) return items;

    if (admin.zone.length > 0) {
      return items.filter((item) => admin.zone.includes(item[m.zoneId]));
    }

    if (admin.group.length > 0) {
      return items.filter((item) => {
        if (item[m.groupId] && admin.group.includes(item[m.groupId])) return true;
        const fgIds = item[m.functionalGroupIds];
        if (Array.isArray(fgIds) && fgIds.some((id: string) => admin.group.includes(id))) return true;
        return false;
      });
    }

    return items.filter((item) => item[m.userId] === ctx.userId);
  }

  // functions scope
  const fn = ctx.accessScope.functions;
  if (fn.isGlobal) return items;

  const targetIds = Object.values(fn.targets).flat();
  if (targetIds.length > 0) {
    return items.filter((item) => {
      const fgIds = item[m.functionalGroupIds];
      if (Array.isArray(fgIds) && fgIds.some((id: string) => targetIds.includes(id))) return true;
      return false;
    });
  }

  return items.filter((item) => item[m.userId] === ctx.userId);
}
