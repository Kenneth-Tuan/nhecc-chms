/**
 * GET /api/organization/group-members?groupId=xxx
 * 回傳隸屬於特定小組的成員。
 */
import { getQuery } from "h3";
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const groupId = query.groupId as string;
  return orgService.getGroupMembers(groupId);
});
