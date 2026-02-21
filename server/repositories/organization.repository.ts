/**
 * Organization Repository
 * Abstracts data source for zones, groups, courses, and member assignment.
 */
import type {
  Zone,
  Group,
  Course,
  OrganizationStructure,
  ZoneWithGroups,
} from "~/types/organization";
import type { Member } from "~/types/member";
import { mockZones, mockGroups, mockCourses } from "../mockData";
import { mockRoles } from "../mockData";
import { devMembers as mockMembers } from "./member.repository";

export class OrganizationRepository {
  /**
   * Find all zones.
   */
  async findAllZones(): Promise<Zone[]> {
    return [...mockZones];
  }

  /**
   * Find a zone by ID.
   */
  async findZoneById(id: string): Promise<Zone | undefined> {
    return mockZones.find((z) => z.id === id);
  }

  /**
   * Find all groups.
   */
  async findAllGroups(): Promise<Group[]> {
    return [...mockGroups];
  }

  /**
   * Find groups by zone ID.
   */
  async findGroupsByZoneId(zoneId: string): Promise<Group[]> {
    return mockGroups.filter((g) => g.zoneId === zoneId);
  }

  /**
   * Find a group by ID.
   */
  async findGroupById(id: string): Promise<Group | undefined> {
    return mockGroups.find((g) => g.id === id);
  }

  /**
   * Get the full organization structure (zones with nested groups).
   */
  async getStructure(): Promise<OrganizationStructure> {
    const zones = await this.findAllZones();
    const allGroups = await this.findAllGroups();

    const zonesWithGroups: ZoneWithGroups[] = zones.map((zone) => ({
      ...zone,
      groups: allGroups.filter(
        (g) => g.zoneId === zone.id && g.type === "Pastoral",
      ),
    }));

    const functionalGroups = allGroups.filter((g) => g.type === "Functional");

    return {
      zones: zonesWithGroups,
      functionalGroups,
    };
  }

  /**
   * Get member counts per group (groupId -> count).
   */
  async getMemberCounts(): Promise<Record<string, number>> {
    const counts: Record<string, number> = {};
    for (const member of mockMembers) {
      if (member.groupId && member.status === "Active") {
        counts[member.groupId] = (counts[member.groupId] || 0) + 1;
      }
    }
    return counts;
  }

  /**
   * Get unassigned (pending) members — no zoneId, no groupId, active status.
   */
  async findPendingMembers(): Promise<
    Pick<
      Member,
      "uuid" | "fullName" | "gender" | "baptismStatus" | "status" | "createdAt"
    >[]
  > {
    return mockMembers
      .filter((m) => !m.zoneId && !m.groupId && m.status === "Active")
      .map((m) => ({
        uuid: m.uuid,
        fullName: m.fullName,
        gender: m.gender,
        baptismStatus: m.baptismStatus,
        status: m.status,
        createdAt: m.createdAt,
      }));
  }

  /**
   * Get members belonging to a specific group.
   */
  async findMembersByGroupId(groupId: string): Promise<
    {
      uuid: string;
      fullName: string;
      gender: string;
      mobile: string;
      roleLabel: string;
      baptismStatus: boolean;
      status: string;
      createdAt: string;
    }[]
  > {
    return mockMembers
      .filter((m) => m.groupId === groupId)
      .map((m) => {
        const primaryRoleId = m.roleIds?.[0] || "general";
        const role = mockRoles.find((r) => r.id === primaryRoleId);
        return {
          uuid: m.uuid,
          fullName: m.fullName,
          gender: m.gender,
          mobile: m.mobile
            ? m.mobile.replace(/(\d{4})(\d{3})(\d{3})/, "$1-$2-$3")
            : "",
          roleLabel: role?.name || "會友",
          baptismStatus: m.baptismStatus,
          status: m.status,
          createdAt: m.createdAt,
        };
      });
  }

  /**
   * Assign a member to a group (mutates in-memory mock data).
   */
  async assignMemberToGroup(
    memberId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    const member = mockMembers.find((m) => m.uuid === memberId);
    if (!member) {
      return { success: false, message: "找不到該會友" };
    }

    const group = mockGroups.find((g) => g.id === groupId);
    if (!group) {
      return { success: false, message: "找不到該小組" };
    }

    if (group.status !== "Active") {
      return { success: false, message: "該小組已停用" };
    }

    member.zoneId = group.zoneId;
    member.groupId = groupId;
    member.updatedAt = new Date().toISOString();

    return {
      success: true,
      message: `已將 ${member.fullName} 分配至 ${group.name}`,
    };
  }

  // ===== Course methods =====

  /**
   * Find all courses.
   */
  async findAllCourses(): Promise<Course[]> {
    return [...mockCourses];
  }

  /**
   * Find a course by ID.
   */
  async findCourseById(id: string): Promise<Course | undefined> {
    return mockCourses.find((c) => c.id === id);
  }

  /**
   * Find courses by IDs.
   */
  async findCoursesByIds(ids: string[]): Promise<Course[]> {
    return mockCourses.filter((c) => ids.includes(c.id));
  }
}
