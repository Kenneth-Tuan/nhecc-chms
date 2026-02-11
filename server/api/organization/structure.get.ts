/**
 * GET /api/organization/structure
 * Returns the organization structure (zones with groups + functional groups).
 */
import { OrganizationService } from '../../services/organization.service';

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  const structure = await orgService.getStructure();
  return structure;
});
