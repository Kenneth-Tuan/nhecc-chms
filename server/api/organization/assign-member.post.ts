/**
 * POST /api/organization/assign-member
 * 將會友分配至特定的牧區與小組。
 */
import { OrganizationService } from "../../services/organization.service";
import { getUserContext, requireAbility } from "../../utils/validation";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "manage", "Organization");
  const ctx = getUserContext(event);
  const body = await readBody(event);
  const { memberId, groupId } = body;
  return orgService.assignMember(memberId, groupId, ctx);
});
