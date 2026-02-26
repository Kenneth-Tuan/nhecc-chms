/**
 * RBAC 權限解析器 (ST002)
 * 實作多角色解析的聯集 (Union) 策略。
 */
import type {
  Role,
  DataScope,
  PermissionKey,
  SensitiveField,
} from "~/types/role";
import type { UserContext } from "~/types/auth";
import type { Member } from "~/types/member";
import {
  ALL_PERMISSION_KEYS,
  ALL_SENSITIVE_FIELDS,
  SCOPE_HIERARCHY,
  createEmptyPermissions,
  createEmptyRevealAuthority,
} from "./permissions";

/**
 * 根據會友資料與角色集解析使用者上下文。
 * 使用聯集策略：採用最廣泛的資料範圍，任意角色擁有的權限皆會被授予。
 */
export function resolveUserContext(member: Member, roles: Role[]): UserContext {
  // 解析資料範圍 (Y 軸)：採用最廣泛者
  const scope = resolveBroadestScope(roles);

  // 解析功能權限 (X 軸)：所有角色的權限聯集
  const permissions = resolveUnionPermissions(roles);

  // 解析敏感資料解鎖權限 (Z 軸)：所有角色的權限聯集
  const revealAuthority = resolveUnionRevealAuthority(roles);

  // 組合管理的小組 ID 清單
  const groupIds = member.groupId ? [member.groupId] : [];
  const functionalGroupIds = member.functionalGroupIds || [];
  const managedGroupIds = [...new Set([...groupIds, ...functionalGroupIds])];

  return {
    userId: member.uuid,
    fullName: member.fullName,
    scope,
    zoneId: member.zoneId,
    groupIds,
    functionalGroupIds,
    managedGroupIds,
    permissions,
    revealAuthority,
  };
}

/**
 * 從所有角色中獲取最廣泛的資料範圍。
 * 全域 (Global) > 牧區 (Zone) > 小組 (Group) > 本人 (Self)
 */
function resolveBroadestScope(roles: Role[]): DataScope {
  let maxIndex = 0;

  for (const role of roles) {
    const index = SCOPE_HIERARCHY.indexOf(
      role.scope as (typeof SCOPE_HIERARCHY)[number],
    );
    if (index > maxIndex) {
      maxIndex = index;
    }
  }

  return SCOPE_HIERARCHY[maxIndex] as DataScope;
}

/**
 * 功能權限聯集：若任何一個角色擁有該權限，則授予該權限。
 */
function resolveUnionPermissions(
  roles: Role[],
): Record<PermissionKey, boolean> {
  const result = createEmptyPermissions();

  for (const role of roles) {
    for (const key of ALL_PERMISSION_KEYS) {
      if (role.permissions[key]) {
        result[key] = true;
      }
    }
  }

  return result;
}

/**
 * 解鎖權限聯集：若任何一個角色擁有該解鎖權限，則授予該權限。
 */
function resolveUnionRevealAuthority(
  roles: Role[],
): Record<SensitiveField, boolean> {
  const result = createEmptyRevealAuthority();

  for (const role of roles) {
    for (const field of ALL_SENSITIVE_FIELDS) {
      if (role.revealAuthority[field]) {
        result[field] = true;
      }
    }
  }

  return result;
}
