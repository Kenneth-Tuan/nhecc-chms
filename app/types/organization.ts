/**
 * Organization-related type definitions (Zones, Groups, Courses)
 */

/** Zone status */
export type ZoneStatus = 'Active' | 'Inactive';

/** Group type */
export type GroupType = 'Pastoral' | 'Functional';

/** Group status */
export type GroupStatus = 'Active' | 'Inactive';

/** Course status */
export type CourseStatus = 'Active' | 'Inactive';

/** Course category */
export type CourseCategory = 'Gospel' | 'Discipleship' | 'Ministry' | 'Other';

/** Pastoral Zone entity */
export interface Zone {
  id: string;
  name: string;
  leaderId?: string;
  leaderName?: string;
  status: ZoneStatus;
  createdAt: string;
  updatedAt: string;
}

/** Group entity (pastoral or functional) */
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

/** Course entity */
export interface Course {
  id: string;
  name: string;
  code: string;
  category: CourseCategory;
  status: CourseStatus;
  createdAt: string;
}

/** Organization structure response (zones with their groups) */
export interface OrganizationStructure {
  zones: ZoneWithGroups[];
  functionalGroups: Group[];
}

/** Zone with nested groups */
export interface ZoneWithGroups extends Zone {
  groups: Group[];
}
