/**
 * GET /api/organization/zones
 * 回傳所有牧區及其嵌套的小組。
 */
import { OrganizationService } from "../../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getZonesWithGroups();
});
