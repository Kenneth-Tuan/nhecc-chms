/**
 * GET /api/organization/pending-members
 * 回傳尚未分配牧區與小組的會友（待分配池）。
 */
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async () => {
  return orgService.getPendingMembers();
});
