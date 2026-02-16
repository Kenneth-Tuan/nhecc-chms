/**
 * Member Zod Schemas (ST001)
 * Used for both frontend form validation and backend API validation.
 */
import { z } from 'zod';

/** Taiwan mobile phone format: 09XXXXXXXX */
const mobileSchema = z
  .string()
  .regex(/^09\d{8}$/, '手機號碼格式不正確，請輸入 09 開頭的 10 碼手機號碼')
  .transform((val) => val.replace(/-/g, ''));

/** Gender enum */
const genderSchema = z.enum(['Male', 'Female'], {
  required_error: '請選擇性別',
});

/** Member status enum */
const memberStatusSchema = z.enum(['Active', 'Inactive', 'Suspended']);

/** Date string that must not be in the future */
const pastDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式不正確')
  .refine(
    (val) => new Date(val) <= new Date(),
    '日期不可為未來日期',
  );

/** Base member object schema (without refinements) */
const baseMemberSchema = z.object({
  fullName: z
    .string()
    .min(1, '姓名為必填')
    .max(50, '姓名不可超過 50 字'),
  gender: genderSchema,
  dob: pastDateSchema,
  email: z.string().email('Email 格式不正確'),
  mobile: mobileSchema,
  address: z.string().max(200, '地址不可超過 200 字').optional(),
  lineId: z.string().max(50, 'Line ID 不可超過 50 字').optional(),
  emergencyContactName: z.string().min(1, '緊急聯絡人姓名為必填'),
  emergencyContactRelationship: z.string().min(1, '與會友關係為必填'),
  emergencyContactPhone: mobileSchema,
  baptismStatus: z.boolean().default(false),
  baptismDate: z.string().optional(),
  status: memberStatusSchema.default('Active'),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  pastCourses: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
  functionalGroupIds: z.array(z.string()).default([]),
  avatar: z.string().url('頭像必須為有效 URL').optional(),
});

/** Create member validation schema (with zone-group refinement) */
export const createMemberSchema = baseMemberSchema.refine(
  (data) => {
    // If groupId is set, zoneId must also be set
    if (data.groupId && !data.zoneId) {
      return false;
    }
    return true;
  },
  {
    message: '選擇小組時必須先選擇牧區',
    path: ['groupId'],
  },
);

/** Update member validation schema (all fields optional, no refinements) */
export const updateMemberSchema = baseMemberSchema.partial();

/** Member list filters schema */
export const memberFiltersSchema = z.object({
  search: z.string().optional(),
  searchField: z.enum(['fullName', 'mobile']).default('fullName'),
  status: z.enum(['Active', 'Inactive', 'Suspended', 'all']).default('Active'),
  baptismStatus: z.enum(['all', 'baptized', 'notBaptized']).default('all'),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  unassigned: z
    .string()
    .transform((val) => val === 'true')
    .or(z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'dob', 'fullName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

/** Deletion reason enum */
const deletionReasonSchema = z.enum([
  'left_church',
  'transferred',
  'duplicate',
  'data_error',
  'other',
]);

/** Soft delete request schema */
export const softDeleteSchema = z.object({
  reason: deletionReasonSchema,
  notes: z.string().max(500, '備註不可超過 500 字').optional(),
});

/** Type inference */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type MemberFiltersInput = z.infer<typeof memberFiltersSchema>;
export type SoftDeleteInput = z.infer<typeof softDeleteSchema>;
