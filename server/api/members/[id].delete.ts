/**
 * DELETE /api/members/:id
 * Soft deletes a member (sets status to Inactive).
 */
import { MemberService } from '../../services/member.service';
import { requirePermission } from '../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  requirePermission(event, 'member:delete');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少會友 ID' });
  }

  await memberService.softDelete(id);

  return {
    success: true,
    message: '會友已停用',
  };
});
