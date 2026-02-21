/**
 * Member-related type definitions (ST001)
 */

/** Gender enum */
export type Gender = "Male" | "Female";

/** Membership status */
export type MemberStatus = "Active" | "Inactive" | "Suspended";

/** Course completion status */
export type CourseCompletionStatus = "Completed" | "Failed" | "InProgress";

/** Member course record */
export interface MemberCourseRecord {
  courseId: string;
  courseName: string;
  completionDate?: string;
  status: CourseCompletionStatus;
}

/** Deletion reason codes for soft delete */
export type DeletionReason =
  | "left_church"
  | "transferred"
  | "duplicate"
  | "data_error"
  | "other";

/** Full Member entity (stored in database) */
export interface Member {
  // System fields
  uuid: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;

  // Basic info
  fullName: string;
  gender: Gender;
  dob: string; // ISO date string

  // Contact info (sensitive)
  email: string;
  mobile: string;
  address?: string;
  lineId?: string;

  // Emergency contact (sensitive)
  emergencyContactName: string;
  emergencyContactRelationship: string;
  emergencyContactPhone: string;

  // Church info
  baptismStatus: boolean;
  baptismDate?: string;
  status: MemberStatus;
  zoneId?: string | null;
  groupId?: string | null;
  pastCourses: string[];

  // RBAC (ST002)
  roleIds: string[];
  functionalGroupIds: string[];

  // Avatar
  avatar?: string;

  // Soft delete metadata (ST004)
  deletionReason?: DeletionReason;
  deletionNotes?: string;
}

/** Sensitive field metadata attached to API responses */
export interface SensitiveFieldMeta {
  canReveal: boolean;
}

/** Member list item (used in DataTable) */
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

/** Member detail (used in Quick View Modal) */
export interface MemberDetail extends Member {
  age: number;
  zoneName?: string;
  groupName?: string;
  roleNames: string[];
  courseRecords: MemberCourseRecord[];

  // Sensitive field metadata
  mobileMeta: SensitiveFieldMeta;
  emailMeta: SensitiveFieldMeta;
  lineIdMeta: SensitiveFieldMeta;
  addressMeta: SensitiveFieldMeta;
  emergencyContactPhoneMeta: SensitiveFieldMeta;
}

/** Filters for member list API */
export interface MemberFilters {
  search?: string;
  searchField?: "fullName" | "mobile";
  status?: MemberStatus | "all";
  baptismStatus?: "all" | "baptized" | "notBaptized";
  zoneId?: string | null;
  groupId?: string | null;
  unassigned?: boolean; // members without group
}

/** Soft delete payload */
export interface SoftDeletePayload {
  reason: DeletionReason;
  notes?: string;
}

/** Create member payload */
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

/** Update member payload (all fields optional, includes deletion metadata) */
export type UpdateMemberPayload = Partial<CreateMemberPayload> & {
  deletionReason?: DeletionReason;
  deletionNotes?: string;
};
