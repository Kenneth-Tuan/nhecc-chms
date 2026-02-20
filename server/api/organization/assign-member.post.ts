/**
 * POST /api/organization/assign-member
 * Assigns a member to a zone and group.
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { memberId, groupId } = body;
  return orgService.assignMember(memberId, groupId);
});
