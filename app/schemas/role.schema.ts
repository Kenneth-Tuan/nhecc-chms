/**
 * 角色 Zod 驗證架構 (ST002)
 */
import { z } from "zod";

/** 所有有效的權限鍵值 */
const permissionKeys = [
  "dashboard:view",
  "dashboard:export",
  "member:view",
  "member:create",
  "member:edit",
  "member:delete",
  "member:export",
  "org:view",
  "org:manage",
  "system:config",
  // 課程模板管理
  "courseTemplate:view",
  "courseTemplate:manage",
  "courseTemplate:delete",
  // 課程班級管理
  "courseClass:view_setup",
  "courseClass:view_inprogress",
  "courseClass:view_completed",
  "courseClass:manage",
  "courseClass:delete",
  "courseClass:grade",
] as const;

/** 所有敏感欄位 */
const sensitiveFields = [
  "mobile",
  "email",
  "lineId",
  "address",
  "emergencyContactPhone",
] as const;

/** 資料範圍數值 */
const dataScopeValues = ["Global", "Zone", "Group", "Self"] as const;

/** 權限記錄架構 - 增加容錯處理以利權限遷移 (Migration) */
const permissionsRecordSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
  
  const record = val as Record<string, any>;
  const result: Record<string, boolean> = {};
  
  // 僅保留現行定義中的權限鍵值，並將 undefined/null 轉換為 false
  // 這樣即便前端傳入舊的 keys (course:manage 等) 或遺漏新的 keys 也不會噴錯
  permissionKeys.forEach(key => {
    result[key] = !!record[key];
  });
  
  return result;
}, z.record(z.enum(permissionKeys), z.boolean()));

/** 解鎖權限記錄架構 - 增加容錯處理 */
const revealAuthorityRecordSchema = z.preprocess((val) => {
  if (!val || typeof val !== 'object') return val;
  
  const record = val as Record<string, any>;
  const result: Record<string, boolean> = {};
  
  sensitiveFields.forEach(field => {
    result[field] = !!record[field];
  });
  
  return result;
}, z.record(z.enum(sensitiveFields), z.boolean()));

/** 建立角色驗證架構 */
export const createRoleSchema = z.object({
  name: z.string().min(1, "角色名稱為必填").max(50, "角色名稱不可超過 50 字"),
  description: z.string().max(200, "描述不可超過 200 字").default(""),
  permissions: permissionsRecordSchema,
  scope: z.enum(dataScopeValues),
  revealAuthority: revealAuthorityRecordSchema,
});

/** 更新角色驗證架構 */
export const updateRoleSchema = createRoleSchema.partial();

/** 角色清單過濾條件架構 */
export const roleFiltersSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

/** 型別推導 */
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type RoleFiltersInput = z.infer<typeof roleFiltersSchema>;
