/**
 * Authentication and User Context type definitions
 */

import type { DataScope, PermissionKey, SensitiveField } from './role';

/** Resolved user context after RBAC middleware */
export interface UserContext {
  userId: string;
  fullName: string;
  scope: DataScope;
  zoneId?: string;
  groupIds: string[];
  functionalGroupIds: string[];
  managedGroupIds: string[]; // union of groupIds + functionalGroupIds
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
  mode: 'DEV' | 'PROD';
  availableTestUsers?: MockTestUser[];
}
