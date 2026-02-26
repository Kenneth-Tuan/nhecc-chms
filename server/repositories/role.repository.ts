/**
 * Role Repository
 * Data source: Real Firestore implementation.
 */
import type { Role } from "~/types/role";
import type { CreateRolePayload, UpdateRolePayload } from "~/types/role";
import { getAdminFirestore } from "../utils/firebase-admin";

const COLLECTION = "roles";

export class RoleRepository {
  private get db() {
    return getAdminFirestore();
  }

  private get collection() {
    return this.db.collection(COLLECTION);
  }

  /**
   * Find all roles.
   */
  async findAll(search?: string): Promise<Role[]> {
    let query: any = this.collection;
    const snapshot = await query.get();
    let results = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    })) as Role[];

    if (search) {
      const term = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term),
      );
    }

    return results;
  }

  /**
   * Find a single role by ID.
   */
  async findById(id: string): Promise<Role | undefined> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Role;
  }

  /**
   * Find multiple roles by IDs.
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];

    // Firestore where 'in' limited to 10 elements
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }

    const results: Role[] = [];
    for (const chunk of chunks) {
      const snapshot = await this.collection
        .where("__name__", "in", chunk)
        .get();
      snapshot.docs.forEach((doc: any) => {
        results.push({ ...doc.data(), id: doc.id } as Role);
      });
    }

    return results;
  }

  /**
   * Create a new role.
   */
  async create(payload: CreateRolePayload): Promise<Role> {
    const now = new Date().toISOString();
    const roleData: any = {
      name: payload.name,
      description: payload.description,
      isSystem: false,
      permissions: payload.permissions,
      scope: payload.scope,
      revealAuthority: payload.revealAuthority,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
    };

    const docRef = await this.collection.add(roleData);
    return { ...roleData, id: docRef.id };
  }

  /**
   * Update an existing role.
   */
  async update(
    id: string,
    payload: UpdateRolePayload,
  ): Promise<Role | undefined> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const currentData = doc.data() as Role;

    // Prevent modifying system roles' permissions via general update
    if (currentData.isSystem) {
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };
      if (payload.name !== undefined) updateData.name = payload.name;
      if (payload.description !== undefined)
        updateData.description = payload.description;

      await docRef.update(updateData);
      const updated = await docRef.get();
      return { ...updated.data(), id: updated.id } as Role;
    }

    const updateData = {
      ...payload,
      updatedAt: new Date().toISOString(),
    };

    await docRef.update(updateData);
    const updated = await docRef.get();
    return { ...updated.data(), id: updated.id } as Role;
  }

  /**
   * Delete a role.
   */
  async delete(id: string): Promise<boolean> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return false;

    if ((doc.data() as Role).isSystem) {
      return false;
    }

    await docRef.delete();
    return true;
  }

  /**
   * Reset - No-op
   */
  reset(): void {}
}
