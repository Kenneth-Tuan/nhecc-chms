/**
 * 角色儲存庫 (Role Repository)
 * 資料來源：實體 Firestore 實作。
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
   * 查找所有角色。
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
   * 根據 ID 查找單一角色。
   */
  async findById(id: string): Promise<Role | undefined> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), id: doc.id } as Role;
  }

  /**
   * 根據 ID 清單查找多個角色。
   */
  async findByIds(ids: string[]): Promise<Role[]> {
    if (ids.length === 0) return [];

    // Firestore 的 'in' 查詢限制為 10 個元素
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
   * 建立新角色。
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
   * 更新現有角色。
   */
  async update(
    id: string,
    payload: UpdateRolePayload,
  ): Promise<Role | undefined> {
    const docRef = this.collection.doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return undefined;

    const currentData = doc.data() as Role;

    // 防止透過一般更新管道修改系統角色的權限
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
   * 刪除角色。
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
   * 重置 - 無操作 (No-op)
   */
  reset(): void {}
}
