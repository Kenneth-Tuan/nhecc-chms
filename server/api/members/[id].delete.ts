/**
 * DELETE /api/members/:id
 * Soft deletes a member (sets status to Inactive) with deletion reason.
 */
import { readBody } from 'h3';
import { softDeleteSchema } from '~/schemas/member.schema';
import { MemberService } from '../../services/member.service';
import { requirePermission, validateWithSchema } from '../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  requirePermission(event, 'member:delete');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少會友 ID' });
  }

  const body = await readBody(event);
  const { reason, notes } = validateWithSchema(softDeleteSchema, body);

  await memberService.softDelete(id, { reason, notes });

  return {
    success: true,
    message: '會友已停用',
  };
});
