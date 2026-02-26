/**
 * 會友儲存庫 (Member Repository)
 * 資料來源：實體 Firestore 實作。
 */
import type {
  Member,
  MemberFilters,
  CreateMemberPayload,
  UpdateMemberPayload,
  DeletionReason,
} from "~/types/member";
import { getAdminFirestore } from "../utils/firebase-admin";

const COLLECTION = "members";

export class MemberRepository {
  private get db() {
    return getAdminFirestore();
  }

  private get collection() {
    return this.db.collection(COLLECTION);
  }

  /**
   * 根據可選過濾條件查找所有會友。
   */
  async findAll(filters?: MemberFilters): Promise<Member[]> {
    let query: any = this.collection;

    if (filters) {
      // 狀態過濾
      if (filters.status && filters.status !== "all") {
        query = query.where("status", "==", filters.status);
      }

      // 受洗狀態過濾
      if (filters.baptismStatus && filters.baptismStatus !== "all") {
        const isBaptized = filters.baptismStatus === "baptized";
        query = query.where("baptismStatus", "==", isBaptized);
      }

      // 牧區過濾
      if (filters.zoneId) {
        query = query.where("zoneId", "==", filters.zoneId);
      }

      // 小組過濾
      if (filters.groupId) {
        query = query.where("groupId", "==", filters.groupId);
      }

      // 未分配過濾（無小組）
      // 註：Firestore 不支持高效的 'not in' 或 'not equal to null'，除非有特定的索引或結構。
      // 目前為了簡單起見，我們先在記憶體中過濾。
    }

    const snapshot = await query.get();
    let results = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uuid: doc.id,
    })) as Member[];

    if (filters) {
      if (filters.unassigned) {
        results = results.filter((m) => !m.groupId);
      }

      // 搜尋過濾（Firestore 對模糊搜尋支持較弱，暫時在記憶體中處理，直到改用 Algolia 等方案）
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchField = filters.searchField || "fullName";

        if (searchField === "fullName") {
          results = results.filter((m) =>
            m.fullName.toLowerCase().includes(searchTerm),
          );
        } else if (searchField === "mobile") {
          results = results.filter((m) => m.mobile === filters.search);
        }
      }
    }

    return results;
  }

  /**
   * 根據牧區 ID 查找會友。
   */
  async findByZoneId(zoneId: string): Promise<Member[]> {
    const snapshot = await this.collection.where("zoneId", "==", zoneId).get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uuid: doc.id,
    })) as Member[];
  }

  /**
   * 根據小組 ID 清單查找會友。
   */
  async findByGroupIds(groupIds: string[]): Promise<Member[]> {
    if (groupIds.length === 0) return [];

    // Firestore 的 'in' 查詢限制為 30 個元素（此版本通常為 10 個）
    // 如有必要需分批查詢，但在一般情況下，一次查詢中的小組數量不多。
    const snapshot = await this.collection
      .where("groupId", "in", groupIds)
      .get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uuid: doc.id,
    })) as Member[];
  }

  /**
   * 根據 UUID 查找單一會友。
   */
  async findById(uuid: string): Promise<Member | undefined> {
    const doc = await this.collection.doc(uuid).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), uuid: doc.id } as Member;
  }

  /**
   * 檢查手機號碼是否已存在（排除指定的 UUID）。
   */
  async isMobileExists(mobile: string, excludeUuid?: string): Promise<boolean> {
    const query = this.collection.where("mobile", "==", mobile);
    const snapshot = await query.get();
    if (snapshot.empty) return false;
    if (excludeUuid) {
      return snapshot.docs.some((doc) => doc.id !== excludeUuid);
    }
    return true;
  }

  /**
   * 檢查電子信箱是否已存在（排除指定的 UUID）。
   */
  async isEmailExists(email: string, excludeUuid?: string): Promise<boolean> {
    const query = this.collection.where("email", "==", email);
    const snapshot = await query.get();
    if (snapshot.empty) return false;
    if (excludeUuid) {
      return snapshot.docs.some((doc) => doc.id !== excludeUuid);
    }
    return true;
  }

  /**
   * 建立新會友。
   */
  async create(
    payload: CreateMemberPayload & { uuid?: string },
  ): Promise<Member> {
    const now = new Date().toISOString();
    const docId = payload.uuid;

    const memberData: any = {
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system",
      fullName: payload.fullName,
      gender: payload.gender,
      dob: payload.dob || null,
      email: payload.email,
      mobile: payload.mobile || "",
      address: payload.address || "",
      lineId: payload.lineId || "",
      emergencyContactName: payload.emergencyContactName || "",
      emergencyContactRelationship: payload.emergencyContactRelationship || "",
      emergencyContactPhone: payload.emergencyContactPhone || "",
      baptismStatus: payload.baptismStatus || false,
      baptismDate: payload.baptismDate || null,
      status: payload.status || "Active",
      zoneId: payload.zoneId || null,
      groupId: payload.groupId || null,
      pastCourses: payload.pastCourses || [],
      roleIds: payload.roleIds || ["general"],
      functionalGroupIds: payload.functionalGroupIds || [],
      avatar: payload.avatar || null,
    };

    if (docId) {
      await this.collection.doc(docId).set(memberData);
      return { ...memberData, uuid: docId };
    } else {
      const docRef = await this.collection.add(memberData);
      return { ...memberData, uuid: docRef.id };
    }
  }

  /**
   * 更新現有會友資料。
   */
  async update(
    uuid: string,
    payload: UpdateMemberPayload,
  ): Promise<Member | undefined> {
    const docRef = this.collection.doc(uuid);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const updateData = {
      ...payload,
      updatedAt: new Date().toISOString(),
      updatedBy: "system",
    };

    await docRef.update(updateData);
    const updated = await docRef.get();
    return { ...updated.data(), uuid: updated.id } as Member;
  }

  /**
   * 軟刪除會友（將狀態設為 Inactive），可選填刪除中繼資料。
   */
  async softDelete(
    uuid: string,
    deletion?: { reason: string; notes?: string },
  ): Promise<boolean> {
    const docRef = this.collection.doc(uuid);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    const updateData: any = {
      status: "Inactive",
      updatedAt: new Date().toISOString(),
    };

    if (deletion?.reason) updateData.deletionReason = deletion.reason;
    if (deletion?.notes) updateData.deletionNotes = deletion.notes;

    await docRef.update(updateData);
    return true;
  }

  /**
   * 獲取具有特定角色的會友人數。
   */
  async countByRoleId(roleId: string): Promise<number> {
    // 註：如果會友人數眾多，此操作可能較耗能。
    // 目前尚可，但通常應使用計數器或聚合方式處理。
    const snapshot = await this.collection
      .where("roleIds", "array-contains", roleId)
      .get();
    return snapshot.size;
  }

  /**
   * 重置 - 對實體 Firestore 無操作 (No-op)，避免誤刪資料。
   */
  reset(): void {}
}
