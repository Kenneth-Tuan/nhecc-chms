/**
 * POST /api/organization/assign-member
 * 將會友分配至特定的牧區與小組。
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { memberId, groupId } = body;
  return orgService.assignMember(memberId, groupId);
});
