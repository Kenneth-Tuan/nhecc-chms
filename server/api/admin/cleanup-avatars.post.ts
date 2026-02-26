/**
 * POST /api/admin/cleanup-avatars
 * 手動觸發清理未使用的頭像檔案。
 * 需要 System 管理權限。
 */
import { MemberRepository } from "../../repositories/member.repository";
import {
  cleanupUnusedAvatars,
  getAvatarStorageStats,
} from "../../utils/storage";
import { requireAbility } from "../../utils/validation";

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "System");

  // 獲取所有會友當前使用中的頭像 URL
  const allMembers = await memberRepo.findAll();
  const activeAvatarUrls = allMembers
    .map((m) => m.avatar)
    .filter((url): url is string => !!url);

  // 執行清理任務
  const result = await cleanupUnusedAvatars(activeAvatarUrls);

  // 獲取當前統計數據
  const stats = getAvatarStorageStats();

  return {
    success: true,
    message: "頭像清理任務已完成",
    result: {
      deletedFiles: result.deleted,
      skippedFiles: result.skipped,
      remainingFiles: stats.totalFiles,
      uniqueMembers: stats.uniqueMembers,
    },
  };
});
