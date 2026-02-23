/**
 * Authentication and User Context type definitions
 */

import type { RawRuleOf } from "@casl/ability";
import type { PackRule } from "@casl/ability/extra";
import type { DataScope, PermissionKey, SensitiveField } from "./role";
import type { AppAbility } from "~/utils/casl/ability";

/** Resolved user context after RBAC middleware */
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

/** Mock test user definition (kept for mock data compatibility) */
export interface MockTestUser {
  userId: string;
  fullName: string;
  roleIds: string[];
  zoneId?: string;
  groupId?: string;
  functionalGroupIds: string[];
}

/** Auth context response */
export interface AuthContextResponse {
  user: UserContext;
  rules: PackRule<RawRuleOf<AppAbility>>[];
}
