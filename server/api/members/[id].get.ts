/**
 * GET /api/members/:id
 * Returns a single member detail with data masking.
 */
import { MemberService } from '../../services/member.service';
import { getUserContext, requirePermission } from '../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const userContext = getUserContext(event);
  requirePermission(event, 'member:view');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少會友 ID' });
  }

  const detail = await memberService.getDetail(userContext, id);
  return detail;
});
