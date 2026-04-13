import { defineEventHandler, getQuery } from "h3";
import { OrganizationService } from "../../services/organization.service";

const orgService = new OrganizationService();

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const type = query.type as "zone" | "group";
  const groupId = query.groupId as string | undefined;
  const zoneId = query.zoneId as string | undefined;
  
  // get user context for scope filtering
  const userContext = event.context.userContext;

  const candidates = await orgService.getLeaderCandidates(
    type,
    userContext,
    { zoneId, groupId }
  );

  return candidates;
});
