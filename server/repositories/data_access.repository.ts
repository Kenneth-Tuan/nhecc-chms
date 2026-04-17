/**
 * DataAccess 儲存庫
 * 操作 data_access/{userId} 單文件。
 */
import type { DataAccess, SetDataAccessPayload } from "~/types/data-access";
import { getAdminFirestore } from "../utils/firebase-admin";
import { FieldPath, FieldValue } from "firebase-admin/firestore";

const COLLECTION = "data_access";

function asStringArray(v: unknown): string[] {
  if (Array.isArray(v)) return v.filter((x): x is string => typeof x === "string");
  if (typeof v === "string" && v.trim()) return [v.trim()];
  return [];
}

function asTargetsMap(v: unknown): Record<string, string[]> {
  if (!v || typeof v !== "object" || Array.isArray(v)) return {};
  const out: Record<string, string[]> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    out[k] = asStringArray(val);
  }
  return out;
}

/**
 * 將 Firestore 回傳的 raw data 正規化為 nested DataAccess 結構。
 * 相容舊資料（頂層字面欄位 "admin.zone" 等）與新資料（nested admin / functions）。
 *
 * 重要：舊版 bug 曾用 set(merge) 寫入字面欄位 "admin.isGlobal"，而 update() 寫的是 nested admin.isGlobal。
 * 若仍用字面欄位覆寫 nested，PATCH 關掉 global 後讀取仍會顯示 true —— 因此 nested 有該 key 時優先採 nested。
 */
function normalizeDataAccess(raw: Record<string, any>): DataAccess {
  const adminObj =
    raw.admin && typeof raw.admin === "object" && raw.admin !== null
      ? raw.admin
      : {};
  const functionsObj =
    raw.functions &&
    typeof raw.functions === "object" &&
    raw.functions !== null
      ? raw.functions
      : {};

  const hasNestedAdmin =
    raw.admin && typeof raw.admin === "object" && raw.admin !== null;
  const hasNestedFunctions =
    raw.functions &&
    typeof raw.functions === "object" &&
    raw.functions !== null;

  const adminIsGlobal =
    hasNestedAdmin && "isGlobal" in adminObj
      ? Boolean(adminObj.isGlobal)
      : "admin.isGlobal" in raw
        ? Boolean(raw["admin.isGlobal"])
        : false;

  const adminZone =
    hasNestedAdmin && "zone" in adminObj
      ? asStringArray(adminObj.zone)
      : "admin.zone" in raw
        ? asStringArray(raw["admin.zone"])
        : [];

  const adminGroup =
    hasNestedAdmin && "group" in adminObj
      ? asStringArray(adminObj.group)
      : "admin.group" in raw
        ? asStringArray(raw["admin.group"])
        : [];

  const functionsIsGlobal =
    hasNestedFunctions && "isGlobal" in functionsObj
      ? Boolean(functionsObj.isGlobal)
      : "functions.isGlobal" in raw
        ? Boolean(raw["functions.isGlobal"])
        : false;

  let functionsTargets: Record<string, string[]> = {};
  if (
    hasNestedFunctions &&
    "targets" in functionsObj &&
    functionsObj.targets &&
    typeof functionsObj.targets === "object"
  ) {
    functionsTargets = asTargetsMap(functionsObj.targets);
  } else if ("functions.targets" in raw) {
    functionsTargets = asTargetsMap(raw["functions.targets"]);
  }

  for (const key of Object.keys(raw)) {
    if (!key.startsWith("functions.targets.")) continue;
    const targetType = key.slice("functions.targets.".length);
    if (!targetType) continue;
    if (!(targetType in functionsTargets)) {
      functionsTargets[targetType] = asStringArray(raw[key]);
    }
  }

  return {
    updatedAt: raw.updatedAt ?? "",
    updatedBy: raw.updatedBy ?? "",
    admin: {
      isGlobal: adminIsGlobal,
      zone: adminZone,
      group: adminGroup,
    },
    functions: {
      isGlobal: functionsIsGlobal,
      targets: functionsTargets,
    },
  };
}

export class DataAccessRepository {
  private get db() {
    return getAdminFirestore();
  }

  private get collection() {
    return this.db.collection(COLLECTION);
  }

  async findByUserId(userId: string): Promise<DataAccess | null> {
    const doc = await this.collection.doc(userId).get();
    if (!doc.exists) return null;
    return normalizeDataAccess(doc.data()!);
  }

  async setAccess(
    userId: string,
    data: SetDataAccessPayload,
    updatedBy: string,
  ): Promise<void> {
    await this.collection.doc(userId).set({
      ...data,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
  }

  async grantAdmin(
    userId: string,
    field: "zone" | "group",
    id: string,
    updatedBy: string,
  ): Promise<void> {
    await this.ensureDoc(userId, updatedBy);
    await this.collection.doc(userId).update({
      [`admin.${field}`]: FieldValue.arrayUnion(id),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
  }

  async revokeAdmin(
    userId: string,
    field: "zone" | "group",
    id: string,
    updatedBy: string,
  ): Promise<void> {
    await this.collection.doc(userId).update({
      [`admin.${field}`]: FieldValue.arrayRemove(id),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
  }

  async grantFunction(
    userId: string,
    targetType: string,
    id: string,
    updatedBy: string,
  ): Promise<void> {
    await this.ensureDoc(userId, updatedBy);
    await this.collection.doc(userId).update({
      [`functions.targets.${targetType}`]: FieldValue.arrayUnion(id),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
  }

  async revokeFunction(
    userId: string,
    targetType: string,
    id: string,
    updatedBy: string,
  ): Promise<void> {
    await this.collection.doc(userId).update({
      [`functions.targets.${targetType}`]: FieldValue.arrayRemove(id),
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
  }

  async setGlobal(
    userId: string,
    scope: "admin" | "functions",
    isGlobal: boolean,
    updatedBy: string,
  ): Promise<void> {
    await this.ensureDoc(userId, updatedBy);
    const docRef = this.collection.doc(userId);
    await docRef.update({
      [`${scope}.isGlobal`]: isGlobal,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy,
    });
    // 舊版曾寫入「字面欄位名」admin.isGlobal（單一 segment），與 nested admin.isGlobal 並存會讓讀取混亂；寫入後刪除字面欄位。
    const strayLiteralName =
      scope === "admin" ? "admin.isGlobal" : "functions.isGlobal";
    try {
      await docRef.update(
        new FieldPath(strayLiteralName),
        FieldValue.delete(),
      );
    } catch {
      // 無此欄位或不可刪 — 忽略
    }
  }

  async findUsersByAdminZone(zoneId: string): Promise<string[]> {
    const snapshot = await this.collection
      .where("admin.zone", "array-contains", zoneId)
      .get();
    return snapshot.docs.map((doc) => doc.id);
  }

  async findUsersByAdminGroup(groupId: string): Promise<string[]> {
    const snapshot = await this.collection
      .where("admin.group", "array-contains", groupId)
      .get();
    return snapshot.docs.map((doc) => doc.id);
  }

  async findUsersByFunctionTarget(
    targetType: string,
    targetId: string,
  ): Promise<string[]> {
    const snapshot = await this.collection
      .where(`functions.targets.${targetType}`, "array-contains", targetId)
      .get();
    return snapshot.docs.map((doc) => doc.id);
  }

  async deleteAccess(userId: string): Promise<void> {
    await this.collection.doc(userId).delete();
  }

  /**
   * 確保文件存在（update 不能操作不存在的文件）。
   * 若不存在則建立空白結構。
   */
  private async ensureDoc(userId: string, updatedBy: string): Promise<void> {
    const docRef = this.collection.doc(userId);
    const doc = await docRef.get();
    if (!doc.exists) {
      await docRef.set({
        admin: { isGlobal: false, zone: [], group: [] },
        functions: { isGlobal: false, targets: {} },
        updatedAt: FieldValue.serverTimestamp(),
        updatedBy,
      });
    }
  }
}
