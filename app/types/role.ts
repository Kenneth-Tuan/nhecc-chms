/**
 * Role and Permission type definitions (ST002)
 */

/** Data scope levels (Y-axis) */
export type DataScope = 'Global' | 'Zone' | 'Group' | 'Self';

/** Permission keys (X-axis) */
export type PermissionKey =
  // Dashboard
  | 'dashboard:view'
  | 'dashboard:export'
  // Member
  | 'member:view'
  | 'member:create'
  | 'member:edit'
  | 'member:delete'
  | 'member:export'
  // Organization
  | 'org:view'
  | 'org:manage'
  // System
  | 'system:config'
  // Course
  | 'course:view'
  | 'course:manage'
  | 'course:grade';

/** Sensitive fields for Z-axis reveal authority */
export type SensitiveField =
  | 'mobile'
  | 'email'
  | 'lineId'
  | 'address'
  | 'emergencyContactPhone';

/** Role entity */
export interface Role {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<PermissionKey, boolean>;
  scope: DataScope;
  revealAuthority: Record<SensitiveField, boolean>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/** Create role payload */
export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: Record<PermissionKey, boolean>;
  scope: DataScope;
  revealAuthority: Record<SensitiveField, boolean>;
}

/** Update role payload */
export type UpdateRolePayload = Partial<CreateRolePayload>;

/** Permission group for UI display */
export interface PermissionGroup {
  label: string;
  icon: string;
  permissions: {
    key: PermissionKey;
    label: string;
  }[];
}
