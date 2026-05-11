/**
 * GET /api/organization/pending-members
 * 回傳尚未分配牧區與小組的會友（待分配池）。
 */
import { OrganizationService } from "../../services/organization.service";
import { getUserContext, requireAbility } from "../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "view", "Organization");
  const ctx = getUserContext(event);
  return orgService.getPendingMembers(ctx);
});
