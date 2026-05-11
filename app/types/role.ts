/**
 * 角色與權限型別定義 (ST002)
 */

/** 資料範圍等級 (Y 軸) */
export type DataScope = "Global" | "Zone" | "Group" | "Self";

/**
 * 功能權限鍵值 — 單一列舉來源（X 軸）。
 *
 * 只維護此 `as const` 陣列；`PermissionKey` 由此推導，並與
 * `app/utils/rbac/permissions.ts`、`app/schemas/role.schema.ts`、
 * CASL `buildAbility` 等處對齊，避免多份字串列表漂移。
 */
export const PERMISSION_KEYS = [
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
  "courseTemplate:view",
  "courseTemplate:manage",
  "courseTemplate:delete",
  "courseClass:view_setup",
  "courseClass:view_inprogress",
  "courseClass:view_completed",
  "courseClass:manage",
  "courseClass:delete",
  "courseClass:grade",
] as const;

/**
 * 權限鍵型別 (X 軸)。
 *
 * 刻意由 `PERMISSION_KEYS` 推導而非手寫 union，使「合法鍵」與執行期列舉
 * 永遠一致；角色 `permissions`、Firestore 文件、Zod 驗證皆應只使用此型別。
 */
export type PermissionKey = (typeof PERMISSION_KEYS)[number];

/** Z 軸敏感資料解鎖權限的欄位列舉 */
export type SensitiveField =
  | "mobile"
  | "email"
  | "lineId"
  | "address"
  | "emergencyContactPhone";

/** 角色實體介面 */
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

/** 建立角色請求資料 */
export interface CreateRolePayload {
  name: string;
  description: string;
  permissions: Record<PermissionKey, boolean>;
  scope: DataScope;
  revealAuthority: Record<SensitiveField, boolean>;
}

/** 更新角色請求資料 */
export type UpdateRolePayload = Partial<CreateRolePayload>;

/** 用於 UI 顯示的權限群組介面 */
export interface PermissionGroup {
  label: string;
  icon: string;
  permissions: {
    key: PermissionKey;
    label: string;
  }[];
}
