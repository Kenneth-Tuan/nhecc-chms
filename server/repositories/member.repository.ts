/**
 * Member Repository
 * Abstracts data source: DEV uses mock data, PROD uses Firebase.
 */
import type {
  Member,
  MemberFilters,
  CreateMemberPayload,
  UpdateMemberPayload,
  DeletionReason,
} from "~/types/member";
import { mockMembers } from "../mockData";
import { generateId } from "../utils/helpers";

/** In-memory store for DEV mode (allows mutations) */
export let devMembers: Member[] = [...mockMembers];

export class MemberRepository {
  /**
   * Find all members with optional filters.
   */
  async findAll(filters?: MemberFilters): Promise<Member[]> {
    let results = [...devMembers];

    if (filters) {
      // Status filter
      if (filters.status && filters.status !== "all") {
        results = results.filter((m) => m.status === filters.status);
      }

      // Baptism status filter
      if (filters.baptismStatus && filters.baptismStatus !== "all") {
        if (filters.baptismStatus === "baptized") {
          results = results.filter((m) => m.baptismStatus === true);
        } else if (filters.baptismStatus === "notBaptized") {
          results = results.filter((m) => m.baptismStatus === false);
        }
      }

      // Zone filter
      if (filters.zoneId) {
        results = results.filter((m) => m.zoneId === filters.zoneId);
      }

      // Group filter
      if (filters.groupId) {
        results = results.filter((m) => m.groupId === filters.groupId);
      }

      // Unassigned filter (no group)
      if (filters.unassigned) {
        results = results.filter((m) => !m.groupId);
      }

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchField = filters.searchField || "fullName";

        if (searchField === "fullName") {
          results = results.filter((m) =>
            m.fullName.toLowerCase().includes(searchTerm),
          );
        } else if (searchField === "mobile") {
          // Exact match for mobile
          results = results.filter((m) => m.mobile === filters.search);
        }
      }
    }

    return results;
  }

  /**
   * Find members by zone ID.
   */
  async findByZoneId(zoneId: string): Promise<Member[]> {
    return devMembers.filter((m) => m.zoneId === zoneId);
  }

  /**
   * Find members by group IDs.
   */
  async findByGroupIds(groupIds: string[]): Promise<Member[]> {
    return devMembers.filter(
      (m) =>
        (m.groupId && groupIds.includes(m.groupId)) ||
        m.functionalGroupIds.some((fgId) => groupIds.includes(fgId)),
    );
  }

  /**
   * Find a single member by UUID.
   */
  async findById(uuid: string): Promise<Member | undefined> {
    return devMembers.find((m) => m.uuid === uuid);
  }

  /**
   * Check if a mobile number already exists (excluding given uuid).
   */
  async isMobileExists(mobile: string, excludeUuid?: string): Promise<boolean> {
    return devMembers.some(
      (m) => m.mobile === mobile && m.uuid !== excludeUuid,
    );
  }

  /**
   * Check if an email already exists (excluding given uuid).
   */
  async isEmailExists(email: string, excludeUuid?: string): Promise<boolean> {
    return devMembers.some((m) => m.email === email && m.uuid !== excludeUuid);
  }

  /**
   * Create a new member.
   */
  async create(payload: CreateMemberPayload): Promise<Member> {
    const now = new Date().toISOString();
    const newMember: Member = {
      uuid: generateId(),
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system",
      fullName: payload.fullName,
      gender: payload.gender,
      dob: payload.dob,
      email: payload.email,
      mobile: payload.mobile,
      address: payload.address,
      lineId: payload.lineId,
      emergencyContactName: payload.emergencyContactName,
      emergencyContactRelationship: payload.emergencyContactRelationship,
      emergencyContactPhone: payload.emergencyContactPhone,
      baptismStatus: payload.baptismStatus,
      baptismDate: payload.baptismDate,
      status: payload.status || "Active",
      zoneId: payload.zoneId,
      groupId: payload.groupId,
      pastCourses: payload.pastCourses || [],
      roleIds: payload.roleIds || ["general"],
      functionalGroupIds: payload.functionalGroupIds || [],
      avatar: payload.avatar,
    };

    devMembers.push(newMember);
    return newMember;
  }

  /**
   * Update an existing member.
   */
  async update(
    uuid: string,
    payload: UpdateMemberPayload,
  ): Promise<Member | undefined> {
    const index = devMembers.findIndex((m) => m.uuid === uuid);
    if (index === -1) return undefined;

    const updated: Member = {
      ...devMembers[index],
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };

    devMembers[index] = updated;
    return updated;
  }

  /**
   * Soft delete a member (set status to Inactive) with optional deletion metadata.
   */
  async softDelete(
    uuid: string,
    deletion?: { reason: string; notes?: string },
  ): Promise<boolean> {
    const index = devMembers.findIndex((m) => m.uuid === uuid);
    if (index === -1) return false;

    devMembers[index] = {
      ...devMembers[index],
      status: "Inactive",
      updatedAt: new Date().toISOString(),
      ...(deletion?.reason && {
        deletionReason: deletion.reason as DeletionReason,
      }),
      ...(deletion?.notes && { deletionNotes: deletion.notes }),
    };
    return true;
  }

  /**
   * Get count of members with a specific role.
   */
  async countByRoleId(roleId: string): Promise<number> {
    return devMembers.filter((m) => m.roleIds.includes(roleId)).length;
  }

  /**
   * Reset to initial mock data (for testing).
   */
  reset(): void {
    devMembers = [...mockMembers];
  }
}
