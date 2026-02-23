/**
 * POST /api/admin/cleanup-avatars
 * Triggers manual cleanup of unused avatar files.
 * Requires admin:system permission.
 */
import { MemberRepository } from '../../repositories/member.repository';
import { cleanupUnusedAvatars, getAvatarStorageStats } from '../../utils/storage';
import { requireAbility } from '../../utils/validation';

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  requireAbility(event, 'manage', 'System');

  // Get all active avatar URLs from members
  const allMembers = await memberRepo.findAll();
  const activeAvatarUrls = allMembers
    .map((m) => m.avatar)
    .filter((url): url is string => !!url);

  // Run cleanup
  const result = await cleanupUnusedAvatars(activeAvatarUrls);

  // Get current stats
  const stats = getAvatarStorageStats();

  return {
    success: true,
    message: '頭像清理任務已完成',
    result: {
      deletedFiles: result.deleted,
      skippedFiles: result.skipped,
      remainingFiles: stats.totalFiles,
      uniqueMembers: stats.uniqueMembers,
    },
  };
});
