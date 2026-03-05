/**
 * 邀請儲存庫 (Invitation Repository)
 * 資料來源：Firestore `invitations` collection。
 */
import type { Invitation } from "~/types/invitation";
import { getAdminFirestore } from "../utils/firebase-admin";

const COLLECTION = "invitations";

export class InvitationRepository {
  private get db() {
    return getAdminFirestore();
  }

  private get collection() {
    return this.db.collection(COLLECTION);
  }

  /**
   * 根據 token 查找邀請。
   */
  async findByToken(token: string): Promise<Invitation | undefined> {
    const doc = await this.collection.doc(token).get();
    if (!doc.exists) return undefined;
    return { ...doc.data(), token: doc.id } as Invitation;
  }

  /**
   * 列出所有邀請。
   */
  async findAll(): Promise<Invitation[]> {
    const snapshot = await this.collection.orderBy("createdAt", "desc").get();
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      token: doc.id,
    })) as Invitation[];
  }

  /**
   * 建立邀請，以 token 為 doc ID。
   */
  async create(
    data: Omit<Invitation, "token"> & { token: string },
  ): Promise<Invitation> {
    const { token, ...rest } = data;
    await this.collection.doc(token).set(rest);
    return { ...rest, token } as Invitation;
  }

  /**
   * 標記邀請為已使用。
   */
  async markAsUsed(token: string, uid: string): Promise<void> {
    await this.collection.doc(token).update({
      used: true,
      usedBy: uid,
    });
  }

  /**
   * 刪除邀請。
   */
  async delete(token: string): Promise<boolean> {
    const doc = await this.collection.doc(token).get();
    if (!doc.exists) return false;
    await this.collection.doc(token).delete();
    return true;
  }
}
