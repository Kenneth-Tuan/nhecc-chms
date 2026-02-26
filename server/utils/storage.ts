/**
 * 儲存服務工具 (ST004)
 * 處理大頭貼檔案管理與清理操作。
 * 開發模式 (DEV)：操作記憶體內模擬狀態。
 * 正式模式 (PROD)：使用 Firebase Storage (待實作)。
 */

/** 開發模式下的追蹤大頭貼檔案 */
const devAvatarStore = new Map<
  string,
  { url: string; memberUuid: string; createdAt: Date }
>();

/**
 * 註冊大頭貼檔案 URL 以供追蹤。
 */
export function trackAvatarFile(url: string, memberUuid: string): void {
  devAvatarStore.set(url, {
    url,
    memberUuid,
    createdAt: new Date(),
  });
}

/**
 * 根據 URL 刪除單一頭像檔案。
 * 開發模式：從記憶體追蹤器中移除。
 * 正式模式：調用 Firebase Storage 的 deleteObject。
 */
export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  if (!avatarUrl) return;

  // 開發模式：從追蹤器移除
  devAvatarStore.delete(avatarUrl);

  // 正式模式應為：
  // const storage = getStorage();
  // const fileRef = ref(storage, getPathFromUrl(avatarUrl));
  // await deleteObject(fileRef);
}

/**
 * 刪除特定會友的所有頭像檔案。
 */
export async function deleteAllAvatarsForMember(
  memberUuid: string,
): Promise<number> {
  let deletedCount = 0;

  for (const [url, entry] of devAvatarStore.entries()) {
    if (entry.memberUuid === memberUuid) {
      devAvatarStore.delete(url);
      deletedCount++;
    }
  }

  return deletedCount;
}

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
 * 清理未使用的頭像檔案。
 * 找出儲存空間中不符合任何會友當前頭像 URL 的檔案。
 */
export async function cleanupUnusedAvatars(
  activeAvatarUrls: string[],
  bufferDays = 7,
): Promise<{ deleted: number; skipped: number }> {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - bufferDays);

  let deleted = 0;
  let skipped = 0;

  for (const [url, entry] of devAvatarStore.entries()) {
    // 跳過仍在使用中的檔案
    if (activeAvatarUrls.includes(url)) {
      continue;
    }

    // 跳過安全緩衝期內的檔案
    if (entry.createdAt > cutoffDate) {
      skipped++;
      continue;
    }

    // 刪除未使用的檔案
    await deleteAvatarFile(url);
    deleted++;
  }

  return { deleted, skipped };
}

/**
 * 獲取儲存使用統計數據 (用於監控)。
 */
export function getAvatarStorageStats(): {
  totalFiles: number;
  uniqueMembers: number;
} {
  const memberIds = new Set<string>();
  for (const entry of devAvatarStore.values()) {
    memberIds.add(entry.memberUuid);
  }

  return {
    totalFiles: devAvatarStore.size,
    uniqueMembers: memberIds.size,
  };
}
