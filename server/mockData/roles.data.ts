/**
 * Mock Role Data (ST002)
 * System roles with XYZ permissions
 */
import type { Role, PermissionKey, SensitiveField } from '~/types/role';

/** Helper: create a full permission record */
function createPermissions(
  granted: PermissionKey[],
): Record<PermissionKey, boolean> {
  const allKeys: PermissionKey[] = [
    'dashboard:view',
    'dashboard:export',
    'member:view',
    'member:create',
    'member:edit',
    'member:delete',
    'member:export',
    'org:view',
    'org:manage',
    'system:config',
    'course:view',
    'course:manage',
    'course:grade',
  ];
  const record = {} as Record<PermissionKey, boolean>;
  for (const key of allKeys) {
    record[key] = granted.includes(key);
  }
  return record;
}

/** Helper: create a full reveal authority record */
function createRevealAuthority(
  granted: SensitiveField[],
): Record<SensitiveField, boolean> {
  const allFields: SensitiveField[] = [
    'mobile',
    'email',
    'lineId',
    'address',
    'emergencyContactPhone',
  ];
  const record = {} as Record<SensitiveField, boolean>;
  for (const field of allFields) {
    record[field] = granted.includes(field);
  }
  return record;
}

export const mockRoles: Role[] = [
  {
    id: 'super_admin',
    name: '超級管理員',
    description: '擁有系統所有權限，不可刪除或修改',
    isSystem: true,
    permissions: createPermissions([
      'dashboard:view',
      'dashboard:export',
      'member:view',
      'member:create',
      'member:edit',
      'member:delete',
      'member:export',
      'org:view',
      'org:manage',
      'system:config',
      'course:view',
      'course:manage',
      'course:grade',
    ]),
    scope: 'Global',
    revealAuthority: createRevealAuthority([
      'mobile',
      'email',
      'lineId',
      'address',
      'emergencyContactPhone',
    ]),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'zone_leader',
    name: '牧區長',
    description: '管理所屬牧區的資料與組織',
    isSystem: true,
    permissions: createPermissions([
      'dashboard:view',
      'dashboard:export',
      'member:view',
      'member:create',
      'member:edit',
      'member:export',
      'org:view',
      'org:manage',
      'course:view',
    ]),
    scope: 'Zone',
    revealAuthority: createRevealAuthority([
      'mobile',
      'email',
      'lineId',
      'address',
      'emergencyContactPhone',
    ]),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'group_leader',
    name: '小組長',
    description: '管理所屬小組的成員資料',
    isSystem: true,
    permissions: createPermissions([
      'dashboard:view',
      'member:view',
      'member:edit',
      'org:view',
      'course:view',
    ]),
    scope: 'Group',
    revealAuthority: createRevealAuthority([
      'mobile',
      'email',
      'emergencyContactPhone',
    ]),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'teacher',
    name: '課程老師',
    description: '管理課程與評分，可查看學員基本資料',
    isSystem: true,
    permissions: createPermissions([
      'member:view',
      'course:view',
      'course:manage',
      'course:grade',
    ]),
    scope: 'Group',
    revealAuthority: createRevealAuthority(['mobile', 'email']),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
  {
    id: 'general',
    name: '一般會友',
    description: '僅能檢視與編輯本人資料',
    isSystem: true,
    permissions: createPermissions(['member:view', 'member:edit']),
    scope: 'Self',
    revealAuthority: createRevealAuthority([]),
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    createdBy: 'system',
  },
];
