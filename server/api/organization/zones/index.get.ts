/**
 * GET /api/organization/zones
 * Returns all zones with their nested pastoral groups.
 */
import { OrganizationService } from "../../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getZonesWithGroups();
});
