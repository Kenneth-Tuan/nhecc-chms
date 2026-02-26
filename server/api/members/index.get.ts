/**
 * GET /api/members
 * 回傳分頁的會友清單，包含資料範圍過濾及資料遮蔽處理。
 */
import { getQuery } from "h3";
import { memberFiltersSchema } from "~/schemas/member.schema";
import { MemberService } from "../../services/member.service";
import {
  getUserContext,
  requireAbility,
  validateWithSchema,
} from "../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const userContext = getUserContext(event);
  requireAbility(event, "view", "Member");

  const query = getQuery(event);
  const filters = validateWithSchema(memberFiltersSchema, query);

  const result = await memberService.list(
    userContext,
    event.context.ability!,
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
