/**
 * POST /api/organization/unassign-member
 * 將會友移出小組或退回待分發。
 */
import { OrganizationService } from "../../services/organization.service";
import { getUserContext, requireAbility } from "../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "Organization");
  const ctx = getUserContext(event);
  const body = await readBody(event);
  const { memberId, clearZone } = body;
  
  return orgService.unassignMember(memberId, !!clearZone, ctx);
});
