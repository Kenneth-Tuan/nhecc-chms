/**
 * GET /api/organization/structure
 * 回傳組織架構（包含牧區及小組 + 功能性小組）。
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const structure = await orgService.getStructure(event.context.userContext);
  return structure;
});
