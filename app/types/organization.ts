/**
 * 組織相關型別定義（牧區、小組、課程）
 */

/** 牧區狀態 */
export type ZoneStatus = "Active" | "Inactive";

/** 小組類型 */
export type GroupType = "Pastoral" | "Functional";

/** 小組狀態 */
export type GroupStatus = "Active" | "Inactive";

/** 課程狀態 */
export type CourseStatus = "Active" | "Inactive";

/** 課程類別 */
export type CourseCategory = "Gospel" | "Discipleship" | "Ministry" | "Other";

/** 牧區 (Zone) 實體介面 */
export interface Zone {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  status: ZoneStatus;
  createdAt: string;
  updatedAt: string;
}

/** 小組 (Group) 實體介面（包含牧區或功能性小組） */
export interface Group {
  id: string;
  name: string;
  type: GroupType;
  zoneId?: string;
  leaderId?: string;
  leaderName?: string;
  status: GroupStatus;
  createdAt: string;
  updatedAt: string;
}

/** 課程 (Course) 實體介面 */
export interface Course {
  id: string;
  name: string;
  code: string;
  category: CourseCategory;
  status: CourseStatus;
  createdAt: string;
}

/** 組織架構回應介面（包含各牧區小組及功能性小組） */
export interface OrganizationStructure {
  zones: ZoneWithGroups[];
  functionalGroups: Group[];
}

/** 牧區及其嵌套的小組清單 */
export interface ZoneWithGroups extends Zone {
  groups: Group[];
}
