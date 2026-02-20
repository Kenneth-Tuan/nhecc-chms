/**
 * GET /api/organization/member-counts
 * Returns member count per group as Record<groupId, count>.
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getMemberCounts();
});
