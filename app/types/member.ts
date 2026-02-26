/**
 * 會友相關型別定義 (ST001)
 */

/** 性別列舉 */
export type Gender = "Male" | "Female";

/** 會員狀態 */
export type MemberStatus = "Active" | "Inactive" | "Suspended";

/** 課程完成狀態 */
export type CourseCompletionStatus = "Completed" | "Failed" | "InProgress";

/** 會友課程記錄 */
export interface MemberCourseRecord {
  courseId: string;
  courseName: string;
  completionDate?: string;
  status: CourseCompletionStatus;
}

/** 軟刪除原因代碼 */
export type DeletionReason =
  | "left_church"
  | "transferred"
  | "duplicate"
  | "data_error"
  | "other";

/** 完整的會友實體（存儲於資料庫中） */
export interface Member {
  // 系統欄位
  uuid: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  // 基本資訊
  fullName: string;
  gender: Gender;
  dob: string; // ISO 日期字串

  // 聯絡資訊（敏感資料）
  email: string;
  mobile: string;
  address?: string;
  lineId?: string;

  // 緊急聯絡人（敏感資料）
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  // 教會資訊
  baptismStatus: boolean;
  baptismDate?: string;
  status: MemberStatus;
  zoneId?: string | null;
  groupId?: string | null;
  pastCourses: string[];

  // 權限控制 (ST002)
  roleIds: string[];
  functionalGroupIds: string[];

  // 大頭貼
  avatar?: string;

  // 軟刪除中繼資料 (ST004)
  deletionReason?: DeletionReason;
  deletionNotes?: string;
}

/** 附在 API 回應中的敏感欄位中繼資料 */
export interface SensitiveFieldMeta {
  canReveal: boolean;
}

/** 會友清單項目（用於 DataTable） */
export interface MemberListItem {
  uuid: string;
  fullName: string;
  gender: Gender;
  dob: string;
  age: number;
  mobile: string;
  mobileMeta: SensitiveFieldMeta;
  email: string;
  emailMeta: SensitiveFieldMeta;
  roleIds: string[];
  roleNames: string[];
  zoneId?: string | null;
  zoneName?: string;
  groupId?: string | null;
  groupName?: string;
  status: MemberStatus;
  avatar?: string;
  baptismStatus: boolean;
}

/** 會友詳情（用於快速檢視彈窗） */
export interface MemberDetail extends Member {
  age: number;
  zoneName?: string;
  groupName?: string;
  roleNames: string[];
  courseRecords: MemberCourseRecord[];

  // 敏感欄位中繼資料
  mobileMeta: SensitiveFieldMeta;
  emailMeta: SensitiveFieldMeta;
  lineIdMeta: SensitiveFieldMeta;
  addressMeta: SensitiveFieldMeta;
  emergencyContactPhoneMeta: SensitiveFieldMeta;
}

/** 會友清單 API 過濾條件 */
export interface MemberFilters {
  search?: string;
  searchField?: "fullName" | "mobile";
  status?: MemberStatus | "all";
  baptismStatus?: "all" | "baptized" | "notBaptized";
  zoneId?: string | null;
  groupId?: string | null;
  unassigned?: boolean; // 未分配小組的會友
}

/** 軟刪除請求資料 */
export interface SoftDeletePayload {
  reason: DeletionReason;
  notes?: string;
}

/** 建立會友請求資料 */
export interface CreateMemberPayload {
  fullName: string;
  gender: Gender;
  dob: string;
  email: string;
  mobile: string;
  address?: string;
  lineId?: string;
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;
  baptismStatus: boolean;
  baptismDate?: string;
  status?: MemberStatus;
  zoneId?: string | null;
  groupId?: string | null;
  pastCourses?: string[];
  roleIds?: string[];
  functionalGroupIds?: string[];
  avatar?: string;
}

/** 更新會友請求資料（所有欄位皆為可選，包含刪除中繼資料） */
export type UpdateMemberPayload = Partial<CreateMemberPayload> & {
  deletionReason?: DeletionReason;
  deletionNotes?: string;
};
