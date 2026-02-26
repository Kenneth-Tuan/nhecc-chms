/**
 * 身份驗證與用戶上下文型別定義
 */

import type { RawRuleOf } from "@casl/ability";
import type { PackRule } from "@casl/ability/extra";
import type { DataScope, PermissionKey, SensitiveField } from "./role";
import type { AppAbility } from "~/utils/casl/ability";

/** 經過 RBAC 中間件解析後的用戶上下文 */
export interface UserContext {
  userId: string;
  fullName: string;
  scope: DataScope;
  zoneId?: string;
  groupIds: string[];
  functionalGroupIds: string[];
  managedGroupIds: string[];
  permissions: Record<PermissionKey, boolean>;
  revealAuthority: Record<SensitiveField, boolean>;
}

/** 模擬測試用戶定義（保留以維持模擬資料相容性） */
export interface MockTestUser {
  userId: string;
  fullName: string;
  roleIds: string[];
  zoneId?: string;
  groupId?: string;
  functionalGroupIds: string[];
}

/** 驗證上下文回應介面 */
export interface AuthContextResponse {
  user: UserContext;
  rules: PackRule<RawRuleOf<AppAbility>>[];
}
