/**
 * GET /api/organization/member-counts
 * 以 Record<groupId, count> 格式回傳各小組的成員人數。
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getMemberCounts();
});
