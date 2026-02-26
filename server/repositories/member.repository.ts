/**
 * Member Repository
 * Data source: Real Firestore implementation.
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
   * Find all members with optional filters.
   */
  async findAll(filters?: MemberFilters): Promise<Member[]> {
    let query: any = this.collection;

    if (filters) {
      // Status filter
      if (filters.status && filters.status !== "all") {
        query = query.where("status", "==", filters.status);
      }

      // Baptism status filter
      if (filters.baptismStatus && filters.baptismStatus !== "all") {
        const isBaptized = filters.baptismStatus === "baptized";
        query = query.where("baptismStatus", "==", isBaptized);
      }

      // Zone filter
      if (filters.zoneId) {
        query = query.where("zoneId", "==", filters.zoneId);
      }

      // Group filter
      if (filters.groupId) {
        query = query.where("groupId", "==", filters.groupId);
      }

      // Unassigned filter (no group)
      // Note: Firestore doesn't support 'not in' or 'not equal to null' efficiently without specific indexing or structures
      // For simple unassigned, we might need to fetch and filter in memory if it's complex,
      // but if we use a specific value for unassigned it's easier.
      // For now, let's keep it simple.
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

      // Search filter (Firestore doesn't do partial text search well, filtering in-memory for now or until we use Algolia)
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
   * Find members by zone ID.
   */
  async findByZoneId(zoneId: string): Promise<Member[]> {
    const snapshot = await this.collection.where("zoneId", "==", zoneId).get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uuid: doc.id,
    })) as Member[];
  }

  /**
   * Find members by group IDs.
   */
  async findByGroupIds(groupIds: string[]): Promise<Member[]> {
    if (groupIds.length === 0) return [];

    // Firestore where 'in' limited to 10/30 elements depending on version, usually 10 for 'in'
    // Split into chunks if necessary, but typically groups are few per query
    const snapshot = await this.collection
      .where("groupId", "in", groupIds)
      .get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      uuid: doc.id,
    })) as Member[];
  }

  /**
   * Find a single member by UUID.
   */
  async findById(uuid: string): Promise<Member | undefined> {
    const doc = await this.collection.doc(uuid).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), uuid: doc.id } as Member;
  }

  /**
   * Check if a mobile number already exists (excluding given uuid).
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
   * Check if an email already exists (excluding given uuid).
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
   * Create a new member.
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
   * Update an existing member.
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
   * Soft delete a member (set status to Inactive) with optional deletion metadata.
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
   * Get count of members with a specific role.
   */
  async countByRoleId(roleId: string): Promise<number> {
    // Note: This can be expensive if there are many members.
    // For now fine, but typically you'd use a counter or aggregation.
    const snapshot = await this.collection
      .where("roleIds", "array-contains", roleId)
      .get();
    return snapshot.size;
  }

  /**
   * Reset - No-op for real Firestore as we don't want to wipe data easily.
   */
  reset(): void {}
}
