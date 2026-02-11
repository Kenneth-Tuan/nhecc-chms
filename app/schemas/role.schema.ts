/**
 * Role Zod Schemas (ST002)
 */
import { z } from 'zod';

/** All valid permission keys */
const permissionKeys = [
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
] as const;

/** All sensitive fields */
const sensitiveFields = [
  'mobile',
  'email',
  'lineId',
  'address',
  'emergencyContactPhone',
] as const;

/** Data scope values */
const dataScopeValues = ['Global', 'Zone', 'Group', 'Self'] as const;

/** Permission record schema */
const permissionsRecordSchema = z.record(
  z.enum(permissionKeys),
  z.boolean(),
);

/** Reveal authority record schema */
const revealAuthorityRecordSchema = z.record(
  z.enum(sensitiveFields),
  z.boolean(),
);

/** Create role validation schema */
export const createRoleSchema = z.object({
  name: z
    .string()
    .min(1, '角色名稱為必填')
    .max(50, '角色名稱不可超過 50 字'),
  description: z
    .string()
    .max(200, '描述不可超過 200 字')
    .default(''),
  permissions: permissionsRecordSchema,
  scope: z.enum(dataScopeValues, {
    required_error: '請選擇資料範圍',
  }),
  revealAuthority: revealAuthorityRecordSchema,
});

/** Update role validation schema */
export const updateRoleSchema = createRoleSchema.partial();

/** Role list filters schema */
export const roleFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/** Type inference */
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleFiltersInput = z.infer<typeof roleFiltersSchema>;
