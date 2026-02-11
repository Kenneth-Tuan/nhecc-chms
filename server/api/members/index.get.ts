/**
 * GET /api/members
 * Returns paginated member list with scope filtering and data masking.
 */
import { getQuery } from 'h3';
import { memberFiltersSchema } from '~/schemas/member.schema';
import { MemberService } from '../../services/member.service';
import { getUserContext, requirePermission, validateWithSchema } from '../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const userContext = getUserContext(event);
  requirePermission(event, 'member:view');

  const query = getQuery(event);
  const filters = validateWithSchema(memberFiltersSchema, query);

  const result = await memberService.list(
    userContext,
    {
      search: filters.search,
      searchField: filters.searchField,
      status: filters.status,
      baptismStatus: filters.baptismStatus,
      zoneId: filters.zoneId,
      groupId: filters.groupId,
      unassigned: filters.unassigned as boolean | undefined,
    },
    filters.page,
    filters.pageSize,
    filters.sortBy,
    filters.sortOrder,
  );

  return result;
});
