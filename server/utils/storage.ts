/**
 * Storage Utilities (ST004)
 * Handles avatar file management and cleanup operations.
 * DEV mode: operates on in-memory mock state.
 * PROD mode: uses Firebase Storage (to be implemented).
 */

/** Tracked avatar files in DEV mode */
const devAvatarStore = new Map<string, { url: string; memberUuid: string; createdAt: Date }>();

/**
 * Register an avatar file URL for tracking.
 */
export function trackAvatarFile(
  url: string,
  memberUuid: string,
): void {
  devAvatarStore.set(url, {
    url,
    memberUuid,
    createdAt: new Date(),
  });
}

/**
 * Delete a single avatar file by URL.
 * In DEV mode this removes from the in-memory tracker.
 * In PROD this would call Firebase Storage deleteObject.
 */
export async function deleteAvatarFile(avatarUrl: string): Promise<void> {
  if (!avatarUrl) return;

  // DEV mode: remove from tracker
  devAvatarStore.delete(avatarUrl);

  // PROD mode would be:
  // const storage = getStorage();
  // const fileRef = ref(storage, getPathFromUrl(avatarUrl));
  // await deleteObject(fileRef);
}

/**
 * Delete all avatar files for a specific member.
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
 * Extract the storage path from a Firebase Storage download URL.
 */
export function getPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;
    // Firebase Storage URL format: /v0/b/{bucket}/o/{encoded_path}
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
 * Cleanup unused avatar files.
 * Finds files in storage that don't match any member's current avatar URL.
 * Respects a safety buffer period (default 7 days).
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
    // Skip files that are still in use
    if (activeAvatarUrls.includes(url)) {
      continue;
    }

    // Skip files within the safety buffer
    if (entry.createdAt > cutoffDate) {
      skipped++;
      continue;
    }

    // Delete unused file
    await deleteAvatarFile(url);
    deleted++;
  }

  return { deleted, skipped };
}

/**
 * Get storage usage stats (for monitoring).
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
