/**
 * GET /api/organization/pending-members
 * Returns members with no zoneId and no groupId (pending pool).
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getPendingMembers();
});
