/**
 * Organization Repository
 * Data source: Real Firestore implementation.
 */
import type {
  Zone,
  Group,
  Course,
  OrganizationStructure,
  ZoneWithGroups,
} from "~/types/organization";
import type { Member } from "~/types/member";
import { getAdminFirestore } from "../utils/firebase-admin";

export class OrganizationRepository {
  private get db() {
    return getAdminFirestore();
  }

  /**
   * Find all zones.
   */
  async findAllZones(): Promise<Zone[]> {
    const snapshot = await this.db.collection("zones").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Zone[];
  }

  /**
   * Find a zone by ID.
   */
  async findZoneById(id: string): Promise<Zone | undefined> {
    const doc = await this.db.collection("zones").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Zone;
  }

  /**
   * Find all groups.
   */
  async findAllGroups(): Promise<Group[]> {
    const snapshot = await this.db.collection("groups").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Group[];
  }

  /**
   * Find groups by zone ID.
   */
  async findGroupsByZoneId(zoneId: string): Promise<Group[]> {
    const snapshot = await this.db
      .collection("groups")
      .where("zoneId", "==", zoneId)
      .get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Group[];
  }

  /**
   * Find a group by ID.
   */
  async findGroupById(id: string): Promise<Group | undefined> {
    const doc = await this.db.collection("groups").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Group;
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
    // This is expensive to do on the fly in Firestore.
    // Usually we'd use a cloud function to update counts or an aggregation query.
    // For now, we fetch active members and count.
    const snapshot = await this.db
      .collection("members")
      .where("status", "==", "Active")
      .get();
    const counts: Record<string, number> = {};
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      if (data.groupId) {
        counts[data.groupId] = (counts[data.groupId] || 0) + 1;
      }
    });
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
    const snapshot = await this.db
      .collection("members")
      .where("status", "==", "Active")
      .where("zoneId", "==", null)
      .get();

    return snapshot.docs.map((doc: any) => {
      const m = doc.data();
      return {
        uuid: doc.id,
        fullName: m.fullName,
        gender: m.gender,
        baptismStatus: m.baptismStatus,
        status: m.status,
        createdAt: m.createdAt,
      };
    });
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
    const memberSnapshot = await this.db
      .collection("members")
      .where("groupId", "==", groupId)
      .get();
    const rolesSnapshot = await this.db.collection("roles").get();
    const roles = rolesSnapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    }));

    return memberSnapshot.docs.map((doc: any) => {
      const m = doc.data();
      const primaryRoleId = m.roleIds?.[0] || "general";
      const role = roles.find((r: any) => r.id === primaryRoleId);
      return {
        uuid: doc.id,
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
   * Assign a member to a group.
   */
  async assignMemberToGroup(
    memberId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    const memberRef = this.db.collection("members").doc(memberId);
    const memberDoc = await memberRef.get();
    if (!memberDoc.exists) {
      return { success: false, message: "找不到該會友" };
    }
    const member = memberDoc.data()!;

    const groupDoc = await this.db.collection("groups").doc(groupId).get();
    if (!groupDoc.exists) {
      return { success: false, message: "找不到該小組" };
    }
    const group = groupDoc.data()!;

    if (group.status !== "Active") {
      return { success: false, message: "該小組已停用" };
    }

    await memberRef.update({
      zoneId: group.zoneId,
      groupId: groupId,
      updatedAt: new Date().toISOString(),
    });

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
    const snapshot = await this.db.collection("courses").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Course[];
  }

  /**
   * Find a course by ID.
   */
  async findCourseById(id: string): Promise<Course | undefined> {
    const doc = await this.db.collection("courses").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Course;
  }

  /**
   * Find courses by IDs.
   */
  async findCoursesByIds(ids: string[]): Promise<Course[]> {
    if (ids.length === 0) return [];
    const snapshot = await this.db
      .collection("courses")
      .where("__name__", "in", ids)
      .get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Course[];
  }
}
