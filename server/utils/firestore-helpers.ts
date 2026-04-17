/**
 * Firestore 通用查詢工具
 */
import type { CollectionReference, Query } from "firebase-admin/firestore";

/**
 * 分批查詢 Firestore，規避 `in` / `array-contains-any` 上限（最多 30 個值）。
 * 將 values 依 chunkSize 切割，每批產生一次查詢後合併結果。
 */
export async function queryInChunks<T>(
  collectionRef: CollectionReference,
  field: string,
  values: string[],
  operator: "in" | "array-contains-any" = "in",
  chunkSize = 30,
): Promise<T[]> {
  if (values.length === 0) return [];

  const results: T[] = [];

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    const snapshot = await (collectionRef as Query)
      .where(field, operator, chunk)
      .get();

    for (const doc of snapshot.docs) {
      results.push({ ...doc.data(), id: doc.id } as T);
    }
  }

  return results;
}
