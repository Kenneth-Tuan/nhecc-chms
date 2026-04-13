/**
 * Data Scope 統一過濾工具
 * 提供 applyScopeConstraints / assertScopeAccess / filterByScope 三個通用函式，
 * 讓所有 Service 可以透過一行呼叫完成 Data Scope 檢查。
 */
import type { UserContext } from "~/types/auth";
import { createError } from "h3";

/**
 * 欄位映射介面：允許不同 Entity 使用不同的欄位名稱。
 * 例如 Member 用 `zoneId`，某些 Entity 可能用 `ownerZoneId`。
 */
export interface ScopeFieldMapping {
  /** 對應 Entity 中的 zoneId 欄位名稱 */
  zoneId?: string;
  /** 對應 Entity 中的 groupId 欄位名稱 */
  groupId?: string;
  /** 對應 Entity 中的 userId/uuid 欄位名稱 */
  userId?: string;
  /** 對應 Entity 中的 functionalGroupIds 欄位名稱 */
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
 *
 * @example
 * ```ts
 * const scopedFilters = applyScopeConstraints(userContext, filters)
 * const members = await memberRepo.findAll(scopedFilters)
 * ```
 */
export function applyScopeConstraints<T extends Record<string, any>>(
  ctx: UserContext,
  filters: T,
  mapping?: ScopeFieldMapping,
): T {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };
  const scoped = { ...filters };

  switch (ctx.scope) {
    case "Global":
      // 無須額外過濾
      break;
    case "Zone":
      if (ctx.zoneId) {
        (scoped as any)[m.zoneId] = ctx.zoneId;
      }
      break;
    case "Group":
      if (ctx.managedGroupIds.length > 0) {
        (scoped as any)[m.groupId] = ctx.managedGroupIds[0];
      }
      break;
    case "Self":
      // Self scope 需要在 Service 層做特殊處理（僅回傳用戶本人資料）
      // 這裡不注入 filter，由 Service 自行處理
      break;
  }

  return scoped;
}

/**
 * 檢查用戶是否具有存取該 Entity 的 Scope 權限（用於單筆存取檢查）。
 * 若不符合，直接 throw 403 錯誤。
 *
 * @example
 * ```ts
 * const member = await memberRepo.findById(uuid)
 * assertScopeAccess(userContext, member) // 不符合時直接 throw
 * ```
 */
export function assertScopeAccess(
  ctx: UserContext,
  entity: Record<string, any>,
  mapping?: ScopeFieldMapping,
): void {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };

  switch (ctx.scope) {
    case "Global":
      return;

    case "Zone":
      if (entity[m.zoneId] !== ctx.zoneId) {
        throw createError({
          statusCode: 403,
          message: "無權存取此資料（牧區範圍限制）",
        });
      }
      return;

    case "Group": {
      const entityGroupId = entity[m.groupId];
      const entityFunctionalGroupIds = entity[m.functionalGroupIds];

      // 檢查主小組
      if (entityGroupId && ctx.managedGroupIds.includes(entityGroupId)) {
        return;
      }

      // 檢查功能性小組
      if (
        Array.isArray(entityFunctionalGroupIds) &&
        entityFunctionalGroupIds.some((fgId: string) =>
          ctx.managedGroupIds.includes(fgId),
        )
      ) {
        return;
      }

      throw createError({
        statusCode: 403,
        message: "無權存取此資料（小組範圍限制）",
      });
    }

    case "Self":
      if (entity[m.userId] !== ctx.userId) {
        throw createError({
          statusCode: 403,
          message: "無權存取此資料（僅限本人）",
        });
      }
      return;
  }
}

/**
 * 在記憶體中過濾已撈出的陣列，只保留符合 Scope 的項目。
 * 適用於無法在 query 層級過濾的場景（如 Firestore 限制或跨 collection join）。
 *
 * @example
 * ```ts
 * const allMembers = await memberRepo.findAll()
 * const scopedMembers = filterByScope(userContext, allMembers)
 * ```
 */
export function filterByScope<T extends Record<string, any>>(
  ctx: UserContext,
  items: T[],
  mapping?: ScopeFieldMapping,
): T[] {
  const m = { ...DEFAULT_FIELD_MAPPING, ...mapping };

  switch (ctx.scope) {
    case "Global":
      return items;

    case "Zone":
      if (!ctx.zoneId) return items;
      return items.filter((item) => item[m.zoneId] === ctx.zoneId);

    case "Group":
      if (ctx.managedGroupIds.length === 0) return [];
      return items.filter((item) => {
        // 主小組匹配
        if (item[m.groupId] && ctx.managedGroupIds.includes(item[m.groupId])) {
          return true;
        }
        // 功能性小組匹配
        const fgIds = item[m.functionalGroupIds];
        if (
          Array.isArray(fgIds) &&
          fgIds.some((id: string) => ctx.managedGroupIds.includes(id))
        ) {
          return true;
        }
        return false;
      });

    case "Self":
      return items.filter((item) => item[m.userId] === ctx.userId);

    default:
      return items;
  }
}
