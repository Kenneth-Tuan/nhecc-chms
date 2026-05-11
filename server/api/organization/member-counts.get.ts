/**
 * GET /api/organization/member-counts
 * 以 Record<groupId, count> 格式回傳各小組的成員人數。
 */
import { OrganizationService } from "../../services/organization.service";
import { getUserContext, requireAbility } from "../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "view", "Organization");
  const ctx = getUserContext(event);
  return orgService.getMemberCounts(ctx);
});
