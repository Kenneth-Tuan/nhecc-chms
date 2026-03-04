/**
 * 組織架構儲存庫 (Organization Repository)
 * 資料來源：實體 Firestore 實作。
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
   * 查找所有牧區。
   */
  async findAllZones(): Promise<Zone[]> {
    const snapshot = await this.db.collection("zones").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Zone[];
  }

  /**
   * 根據 ID 查找牧區。
   */
  async findZoneById(id: string): Promise<Zone | undefined> {
    const doc = await this.db.collection("zones").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Zone;
  }

  /**
   * 新增牧區。
   */
  async createZone(
    data: Partial<Zone>,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const docRef = await this.db.collection("zones").add({
        ...data,
        status: data.status || "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, message: "牧區新增成功", id: docRef.id };
    } catch (error: any) {
      return { success: false, message: `牧區新增失敗: ${error.message}` };
    }
  }

  /**
   * 更新牧區。
   */
  async updateZone(
    id: string,
    data: Partial<Zone>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.db
        .collection("zones")
        .doc(id)
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        });
      return { success: true, message: "牧區更新成功" };
    } catch (error: any) {
      return { success: false, message: `牧區更新失敗: ${error.message}` };
    }
  }

  /**
   * 刪除牧區。
   */
  async deleteZone(id: string): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Check if there are groups in this zone before deleting
      const groupsSnapshot = await this.db
        .collection("groups")
        .where("zoneId", "==", id)
        .get();
      if (!groupsSnapshot.empty) {
        return { success: false, message: "該牧區下尚有小組，無法刪除" };
      }

      await this.db.collection("zones").doc(id).delete();
      return { success: true, message: "牧區刪除成功" };
    } catch (error: any) {
      return { success: false, message: `牧區刪除失敗: ${error.message}` };
    }
  }

  /**
   * 查找所有小組。
   */
  async findAllGroups(): Promise<Group[]> {
    const snapshot = await this.db.collection("groups").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Group[];
  }

  /**
   * 根據牧區 ID 查找小組。
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
   * 根據 ID 查找小組。
   */
  async findGroupById(id: string): Promise<Group | undefined> {
    const doc = await this.db.collection("groups").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Group;
  }

  /**
   * 新增小組。
   */
  async createGroup(
    data: Partial<Group>,
  ): Promise<{ success: boolean; message: string; id?: string }> {
    try {
      const docRef = await this.db.collection("groups").add({
        ...data,
        groupType: data.groupType || "Pastoral",
        status: data.status || "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return { success: true, message: "小組新增成功", id: docRef.id };
    } catch (error: any) {
      return { success: false, message: `小組新增失敗: ${error.message}` };
    }
  }

  /**
   * 更新小組。
   */
  async updateGroup(
    id: string,
    data: Partial<Group>,
  ): Promise<{ success: boolean; message: string }> {
    try {
      await this.db
        .collection("groups")
        .doc(id)
        .update({
          ...data,
          updatedAt: new Date().toISOString(),
        });
      return { success: true, message: "小組更新成功" };
    } catch (error: any) {
      return { success: false, message: `小組更新失敗: ${error.message}` };
    }
  }

  /**
   * 刪除小組。
   */
  async deleteGroup(
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // TODO: Check if there are members in this group before deleting
      const membersSnapshot = await this.db
        .collection("members")
        .where("groupId", "==", id)
        .get();
      if (!membersSnapshot.empty) {
        return { success: false, message: "該小組下尚有會友，無法刪除" };
      }

      await this.db.collection("groups").doc(id).delete();
      return { success: true, message: "小組刪除成功" };
    } catch (error: any) {
      return { success: false, message: `小組刪除失敗: ${error.message}` };
    }
  }

  /**
   * 獲取完整的組織架構（包含牧區及其嵌套的小組）。
   */
  async getStructure(): Promise<OrganizationStructure> {
    const zones = await this.findAllZones();
    const allGroups = await this.findAllGroups();

    const zonesWithGroups: ZoneWithGroups[] = zones.map((zone) => ({
      ...zone,
      groups: allGroups.filter(
        (g) => g.zoneId === zone.id && g.groupType === "Pastoral",
      ),
    }));

    const functionalGroups = allGroups.filter(
      (g) => g.groupType === "Functional",
    );

    return {
      zones: zonesWithGroups,
      functionalGroups,
    };
  }

  /**
   * 獲取每個小組的成員人數 (groupId -> count)。
   */
  async getMemberCounts(): Promise<Record<string, number>> {
    // 在 Firestore 中即時計算這項資料較耗能。
    // 通常會使用雲端函式 (Cloud Function) 更新計數，或使用聚合查詢。
    // 目前先暫時抓取所有活動會友並進行計算。
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
   * 獲取未分配（待處理）的會友 — 無牧區 ID、無小組 ID 且狀態為活動中。
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
      .where("groupId", "==", null)
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
   * 獲取隸屬於特定小組的會友。
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
   * 將會友分配至小組。
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
      message: `已將會友分配至 ${group.name}`,
    };
  }

  // ===== 課程相關方法 (Course methods) =====

  /**
   * 查找所有課程。
   */
  async findAllCourses(): Promise<Course[]> {
    const snapshot = await this.db.collection("courses").get();
    return snapshot.docs.map((doc) => ({
      ...doc.data(),
      id: doc.id,
    })) as Course[];
  }

  /**
   * 根據 ID 查找課程。
   */
  async findCourseById(id: string): Promise<Course | undefined> {
    const doc = await this.db.collection("courses").doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Course;
  }

  /**
   * 根據 ID 清單查找課程。
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
