/**
 * 會友 Zod 驗證架構 (ST001)
 * 用於前端表單驗證及後端 API 驗證。
 */
import { z } from "zod";

/** 台灣手機格式：09XXXXXXXX */
const mobileSchema = z
  .string()
  .regex(/^09\d{8}$/, "手機號碼格式不正確，請輸入 09 開頭的 10 碼手機號碼")
  .transform((val) => val.replace(/-/g, ""));

/** 性別列舉 */
const genderSchema = z.enum(["Male", "Female"], {
  message: "請選擇性別",
});

/** 會友狀態列舉 */
const memberStatusSchema = z.enum(["Active", "Inactive", "Suspended"]);

/** 日期字串，且不可晚於今天 */
const pastDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "日期格式不正確")
  .refine((val) => new Date(val) <= new Date(), "日期不可為未來日期");

/** 基礎會友物件架構（未含進階邏輯驗證） */
const baseMemberSchema = z.object({
  fullName: z.string().min(1, "姓名為必填").max(50, "姓名不可超過 50 字"),
  gender: genderSchema,
  dob: pastDateSchema,
  email: z.string().email("Email 格式不正確"),
  mobile: mobileSchema,
  address: z.string().max(200, "地址不可超過 200 字").optional(),
  lineId: z.string().max(50, "Line ID 不可超過 50 字").optional(),
  emergencyContactName: z.string().min(1, "緊急聯絡人姓名為必填"),
  emergencyContactRelationship: z.string().min(1, "與會友關係為必填"),
  emergencyContactPhone: mobileSchema,
  baptismStatus: z.boolean().default(false),
  baptismDate: z.string().optional(),
  status: memberStatusSchema.default("Active"),
  zoneId: z.string().nullable().optional(),
  groupId: z.string().nullable().optional(),
  pastCourses: z.array(z.string()).default([]),
  roleIds: z.array(z.string()).default([]),
  functionalGroupIds: z.array(z.string()).default([]),
  avatar: z.string().url("頭像必須為有效 URL").optional(),
});

/** 建立新會友的驗證架構（包含牧區-小組關係驗證） */
export const createMemberSchema = baseMemberSchema.refine(
  (data) => {
    // 若設定了小組，則必須同時設定牧區
    if (data.groupId && !data.zoneId) {
      return false;
    }
    return true;
  },
  {
    message: "選擇小組時必須先選擇牧區",
    path: ["groupId"],
  },
);

/** 更新會友的驗證架構（所有欄位皆為可選，不含進階邏輯驗證） */
export const updateMemberSchema = baseMemberSchema.partial();

/** 個人資料更新架構（僅限本人可改欄位，排除系統管理欄位） */
export const updateProfileSchema = baseMemberSchema
  .omit({
    status: true,
    zoneId: true,
    groupId: true,
    roleIds: true,
    functionalGroupIds: true,
  })
  .partial();

/** 會友清單過濾條件架構 */
export const memberFiltersSchema = z.object({
  search: z.string().optional(),
  searchField: z.enum(["fullName", "mobile"]).default("fullName"),
  status: z.enum(["Active", "Inactive", "Suspended", "all"]).default("Active"),
  baptismStatus: z.enum(["all", "baptized", "notBaptized"]).default("all"),
  zoneId: z.string().optional(),
  groupId: z.string().optional(),
  unassigned: z
    .string()
    .transform((val) => val === "true")
    .or(z.boolean())
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.enum(["createdAt", "dob", "fullName"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

/** 刪除原因列舉 */
const deletionReasonSchema = z.enum([
  "left_church",
  "transferred",
  "duplicate",
  "data_error",
  "other",
]);

/** 軟刪除請求架構 */
export const softDeleteSchema = z.object({
  reason: deletionReasonSchema,
  notes: z.string().max(500, "備註不可超過 500 字").optional(),
});

/** 型別推導 */
export type CreateMemberInput = z.infer<typeof createMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type MemberFiltersInput = z.infer<typeof memberFiltersSchema>;
export type SoftDeleteInput = z.infer<typeof softDeleteSchema>;
