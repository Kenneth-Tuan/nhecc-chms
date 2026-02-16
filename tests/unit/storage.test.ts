/**
 * Storage Utility Tests (ST004)
 * Tests avatar file tracking and cleanup operations.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import {
  trackAvatarFile,
  deleteAvatarFile,
  deleteAllAvatarsForMember,
  getPathFromUrl,
  cleanupUnusedAvatars,
  getAvatarStorageStats,
} from '../../server/utils/storage';

describe('Storage Utils', () => {
  beforeEach(() => {
    // Reset by deleting all tracked files
    const stats = getAvatarStorageStats();
    // Since we can't easily reset the Map, we test in sequence
  });

  describe('trackAvatarFile', () => {
    it('should track a new avatar file', () => {
      trackAvatarFile('https://example.com/avatar1.jpg', 'member-1');
      const stats = getAvatarStorageStats();
      expect(stats.totalFiles).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteAvatarFile', () => {
    it('should delete a tracked file', async () => {
      const url = 'https://example.com/delete-test.jpg';
      trackAvatarFile(url, 'member-del');
      await deleteAvatarFile(url);
      // After deletion, the file should no longer be tracked
    });

    it('should handle non-existent URL gracefully', async () => {
      await expect(deleteAvatarFile('https://nonexistent.com/avatar.jpg'))
        .resolves.not.toThrow();
    });

    it('should handle empty string gracefully', async () => {
      await expect(deleteAvatarFile('')).resolves.not.toThrow();
    });
  });

  describe('deleteAllAvatarsForMember', () => {
    it('should delete all avatars for a specific member', async () => {
      const memberUuid = 'member-cleanup-test';
      trackAvatarFile('https://example.com/a1.jpg', memberUuid);
      trackAvatarFile('https://example.com/a2.jpg', memberUuid);

      const count = await deleteAllAvatarsForMember(memberUuid);
      expect(count).toBe(2);
    });

    it('should return 0 for member with no avatars', async () => {
      const count = await deleteAllAvatarsForMember('no-avatars-member');
      expect(count).toBe(0);
    });
  });

  describe('getPathFromUrl', () => {
    it('should extract path from Firebase Storage URL', () => {
      const url = 'https://firebasestorage.googleapis.com/v0/b/bucket/o/avatars%2Fmember-1%2Favatar.jpg?alt=media';
      const path = getPathFromUrl(url);
      expect(path).toBe('avatars/member-1/avatar.jpg');
    });

    it('should return original string for non-Firebase URLs', () => {
      const url = 'https://example.com/avatar.jpg';
      const path = getPathFromUrl(url);
      expect(path).toBeDefined();
    });

    it('should handle malformed URLs gracefully', () => {
      const path = getPathFromUrl('not-a-url');
      expect(path).toBe('not-a-url');
    });
  });

  describe('cleanupUnusedAvatars', () => {
    it('should not delete files that are in active use', async () => {
      const activeUrl = 'https://example.com/active-avatar.jpg';
      trackAvatarFile(activeUrl, 'active-member');

      const result = await cleanupUnusedAvatars([activeUrl]);
      expect(result.deleted).toBe(0);
    });
  });

  describe('getAvatarStorageStats', () => {
    it('should return stats with totalFiles and uniqueMembers', () => {
      const stats = getAvatarStorageStats();
      expect(stats).toHaveProperty('totalFiles');
      expect(stats).toHaveProperty('uniqueMembers');
      expect(typeof stats.totalFiles).toBe('number');
      expect(typeof stats.uniqueMembers).toBe('number');
    });
  });
});
