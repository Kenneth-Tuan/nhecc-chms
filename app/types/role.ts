/**
 * 角色與權限型別定義 (ST002)
 */

/** 資料範圍等級 (Y 軸) */
export type DataScope = "Global" | "Zone" | "Group" | "Self";

/** 權限鍵值 (X 軸) */
export type PermissionKey =
  // 儀表板
  | "dashboard:view"
  | "dashboard:export"
  // 會友管理
  | "member:view"
  | "member:create"
  | "member:edit"
  | "member:delete"
  | "member:export"
  // 組織架構
  | "org:view"
  | "org:manage"
  // 系統設定
  | "system:config"
  // 課程管理
  | "course:view"
  | "course:manage"
  | "course:grade";

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
