/**
 * RBAC 權限解析器 (ST002)
 * 實作多角色解析的聯集 (Union) 策略。
 */
import type {
  Role,
  PermissionKey,
} from "~/types/role";
import type { UserContext } from "~/types/auth";
import type { Member } from "~/types/member";
import type { DataAccess } from "~/types/data-access";
import {
  ALL_PERMISSION_KEYS,
  createEmptyPermissions,
} from "./permissions";

/**
 * 根據會友資料、角色集與 data_access 文件解析使用者上下文。
 * 使用聯集策略：任意角色擁有的權限皆會被授予。
 * 資料範圍由 data_access 文件決定。
 */
export function resolveUserContext(
  member: Member,
  roles: Role[],
  dataAccess: DataAccess | null,
): UserContext {
  const permissions = resolveUnionPermissions(roles);

  const emptyAdmin = { isGlobal: false, zone: [] as string[], group: [] as string[] };
  const emptyFunctions = { isGlobal: false, targets: {} as Record<string, string[]> };

  return {
    userId: member.uuid,
    fullName: member.fullName,
    email: member.email,
    avatar: member.avatar,
    zoneId: member.zoneId || undefined,
    groupId: member.groupId || undefined,
    accessScope: {
      admin: dataAccess?.admin ?? emptyAdmin,
      functions: dataAccess?.functions ?? emptyFunctions,
    },
    permissions,
    linkedProviders: {
      google:
        !!member.linkedProviders?.google ||
        member.registrationProvider === "google",
      line:
        !!member.linkedProviders?.line ||
        member.registrationProvider === "line",
      email:
        !!member.linkedProviders?.email ||
        member.registrationProvider === "email",
    },
    requiresPasswordChange: !!member.requiresPasswordChange,
  };
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
