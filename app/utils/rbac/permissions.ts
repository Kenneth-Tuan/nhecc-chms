/**
 * RBAC Permission Constants & Groups
 * Shared between client and server.
 */
import type {
  PermissionKey,
  SensitiveField,
  PermissionGroup,
  DataScope,
} from "~/types/role";

/** All permission keys */
export const ALL_PERMISSION_KEYS: PermissionKey[] = [
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
];

/** Permission labels (Chinese) */
export const PERMISSION_LABELS: Record<PermissionKey, string> = {
  "dashboard:view": "檢視儀表板",
  "dashboard:export": "匯出儀表板資料",
  "member:view": "檢視會友資料",
  "member:create": "建立會友",
  "member:edit": "編輯會友",
  "member:delete": "刪除會友",
  "member:export": "匯出會友資料",
  "org:view": "檢視組織架構",
  "org:manage": "管理組織架構",
  "system:config": "系統設定",
  "courseTemplate:view": "檢視課程模板",
  "courseTemplate:manage": "管理課程模板",
  "courseTemplate:delete": "刪除課程模板",
  "courseClass:view_setup": "瀏覽準備中班級",
  "courseClass:view_inprogress": "瀏覽進行中班級",
  "courseClass:view_completed": "瀏覽已結束班級",
  "courseClass:manage": "管理班級(開班/編輯)",
  "courseClass:delete": "刪除班級",
  "courseClass:grade": "班級評分",
};

/** Permission groups for UI display */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: "儀表板 & 數據",
    icon: "pi pi-chart-bar",
    permissions: [
      { key: "dashboard:view", label: "檢視儀表板" },
      { key: "dashboard:export", label: "匯出儀表板資料" },
    ],
  },
  {
    label: "人員管理",
    icon: "pi pi-users",
    permissions: [
      { key: "member:view", label: "檢視會友資料" },
      { key: "member:create", label: "建立會友" },
      { key: "member:edit", label: "編輯會友" },
      { key: "member:delete", label: "刪除會友" },
      { key: "member:export", label: "匯出會友資料" },
    ],
  },
  {
    label: "組織架構",
    icon: "pi pi-sitemap",
    permissions: [
      { key: "org:view", label: "檢視組織架構" },
      { key: "org:manage", label: "管理組織架構" },
    ],
  },
  {
    label: "系統設定",
    icon: "pi pi-cog",
    permissions: [{ key: "system:config", label: "系統設定" }],
  },
  {
    label: "課程 & 班級管理",
    icon: "pi pi-book",
    permissions: [
      { key: "courseTemplate:view", label: "檢視課程模板" },
      { key: "courseTemplate:manage", label: "管理課程模板" },
      { key: "courseTemplate:delete", label: "刪除課程模板" },
      { key: "courseClass:view_setup", label: "瀏覽準備中班級" },
      { key: "courseClass:view_inprogress", label: "瀏覽進行中班級" },
      { key: "courseClass:view_completed", label: "瀏覽已結束班級" },
      { key: "courseClass:manage", label: "管理班級(開班/編輯)" },
      { key: "courseClass:delete", label: "刪除班級" },
      { key: "courseClass:grade", label: "班級評分" },
    ],
  },
];

/** All sensitive fields */
export const ALL_SENSITIVE_FIELDS: SensitiveField[] = [
  "mobile",
  "email",
  "lineId",
  "address",
  "emergencyContactPhone",
];

/** Sensitive field labels */
export const SENSITIVE_FIELD_LABELS: Record<SensitiveField, string> = {
  mobile: "手機號碼",
  email: "Email",
  lineId: "Line ID",
  address: "通訊地址",
  emergencyContactPhone: "緊急聯絡人電話",
};

/** Data scope hierarchy (higher index = broader scope) */
export const SCOPE_HIERARCHY = ["Self", "Group", "Zone", "Global"] as const;

/** Data scope options for UI display */
export const SCOPE_OPTIONS: {
  label: string;
  value: DataScope;
  description: string;
}[] = [
  {
    label: "全教會 (Global)",
    value: "Global",
    description: "可存取全教會資料",
  },
  { label: "牧區 (Zone)", value: "Zone", description: "僅限所屬牧區" },
  {
    label: "小組/事工團隊/課程 (Group)",
    value: "Group",
    description: "僅限所屬小組/事工團隊/課程",
  },
  { label: "個人 (Self)", value: "Self", description: "僅限本人資料" },
];

/** Create empty permissions record (all false) */
export function createEmptyPermissions(): Record<PermissionKey, boolean> {
  const record = {} as Record<PermissionKey, boolean>;
  for (const key of ALL_PERMISSION_KEYS) {
    record[key] = false;
  }
  return record;
}

/** Create empty reveal authority record (all false) */
export function createEmptyRevealAuthority(): Record<SensitiveField, boolean> {
  const record = {} as Record<SensitiveField, boolean>;
  for (const field of ALL_SENSITIVE_FIELDS) {
    record[field] = false;
  }
  return record;
}
