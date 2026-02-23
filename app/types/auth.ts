/**
 * Authentication and User Context type definitions
 */

import type { PackRule, RawRuleOf } from '@casl/ability/extra';
import type { DataScope, PermissionKey, SensitiveField } from './role';
import type { AppAbility } from '~/utils/casl/ability';

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

/** Mock test user definition (DEV mode) */
export interface MockTestUser {
  userId: string;
  fullName: string;
  roleIds: string[];
  zoneId?: string;
  groupId?: string;
  functionalGroupIds: string[];
}

/** Auth switch user request */
export interface SwitchUserRequest {
  userId: string;
}

/** Auth context response */
export interface AuthContextResponse {
  user: UserContext;
  rules: PackRule<RawRuleOf<AppAbility>>[];
  mode: 'DEV' | 'PROD';
  availableTestUsers?: MockTestUser[];
}
