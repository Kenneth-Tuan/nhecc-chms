/**
 * 儲存服務工具 (ST004)
 * 處理大頭貼檔案管理與清理操作，透過 Firebase Storage 進行。
 */
import { getStorage } from "firebase-admin/storage";
import crypto from "crypto";

/**
 * 從 Firebase Storage 下載連結中提取儲存路徑。
 */
export function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Firebase Storage URL 格式：/v0/b/{bucket}/o/{encoded_path}
    const match = path.match(/\/o\/(.+)/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return path;
  } catch {
    return url;
  }
}

/**
 * 根據 URL 刪除單一頭像檔案。
 */
export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  if (!avatarUrl) return;

  try {
    const filePath = getPathFromUrl(avatarUrl);
    if (!filePath || filePath === avatarUrl) return;

    const storage = getStorage();
    const bucket = storage.bucket();
    const file = bucket.file(filePath);
    await file.delete({ ignoreNotFound: true });
  } catch (error) {
    console.error("刪除頭像檔案失敗:", error);
  }
}

/**
 * 上傳新的頭像檔案並回傳公共 URL
 */
export async function uploadAvatarFile(
  fileBuffer: Buffer,
  mimeType: string,
  memberUuid: string,
  filename: string,
): Promise<string> {
  const storage = getStorage();
  const bucket = storage.bucket();

  const timestamp = Date.now();
  const safeFilename = filename.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const filePath = `members/${memberUuid}/avatars/${timestamp}_${safeFilename}`;

  const file = bucket.file(filePath);
  const token = crypto.randomUUID();

  await file.save(fileBuffer, {
    metadata: {
      contentType: mimeType,
      metadata: {
        firebaseStorageDownloadTokens: token,
      },
    },
  });

  const bucketName = bucket.name;
  const encodedPath = encodeURIComponent(filePath);
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodedPath}?alt=media&token=${token}`;
}

/**
 * 刪除特定會友的所有頭像檔案。
 */
export async function deleteAllAvatarsForMember(
  memberUuid: string,
): Promise<number> {
  let deletedCount = 0;

  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    const prefix = `members/${memberUuid}/avatars/`;

    const [files] = await bucket.getFiles({ prefix });

    for (const file of files) {
      await file.delete({ ignoreNotFound: true });
      deletedCount++;
    }
  } catch (error) {
    console.error(`刪除會友 ${memberUuid} 所有的頭像檔案失敗:`, error);
  }

  return deletedCount;
}

/**
 * 清理未使用的頭像檔案。
 * 找出儲存空間中不符合任何會友當前頭像 URL 的檔案。
 */
export async function cleanupUnusedAvatars(
  activeAvatarUrls: string[],
  bufferDays = 7,
): Promise<{ deleted: number; skipped: number }> {
  let deleted = 0;
  let skipped = 0;

  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: "members/" });

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - bufferDays);

    for (const file of files) {
      if (!file.name.includes("/avatars/")) continue;

      const [metadata] = await file.getMetadata();
      const createdAt = new Date(metadata.timeCreated || 0);

      const isUsed = activeAvatarUrls.some((url) => {
        const path = getPathFromUrl(url);
        return path === file.name;
      });

      if (isUsed) {
        continue;
      }

      if (createdAt > cutoffDate) {
        skipped++;
        continue;
      }

      await file.delete({ ignoreNotFound: true });
      deleted++;
    }
  } catch (error) {
    console.error("清理閒置頭像失敗:", error);
  }

  return { deleted, skipped };
}

/**
 * 獲取儲存使用統計數據 (用於監控)。
 */
export async function getAvatarStorageStats(): Promise<{
  totalFiles: number;
  uniqueMembers: number;
}> {
  try {
    const storage = getStorage();
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({ prefix: "members/" });

    let totalFiles = 0;
    const memberIds = new Set<string>();

    for (const file of files) {
      if (!file.name.includes("/avatars/")) continue;
      totalFiles++;

      const parts = file.name.split("/");
      if (parts.length >= 3) {
        memberIds.add(parts[1]);
      }
    }

    return {
      totalFiles,
      uniqueMembers: memberIds.size,
    };
  } catch (error) {
    console.error("取得儲存統計數據失敗:", error);
    return {
      totalFiles: 0,
      uniqueMembers: 0,
    };
  }
}
