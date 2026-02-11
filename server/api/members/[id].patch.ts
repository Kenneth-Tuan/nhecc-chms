/**
 * PATCH /api/members/:id
 * Updates an existing member.
 */
import { readBody } from 'h3';
import { updateMemberSchema } from '~/schemas/member.schema';
import { MemberService } from '../../services/member.service';
import { requirePermission, validateWithSchema } from '../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  requirePermission(event, 'member:edit');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少會友 ID' });
  }

  const body = await readBody(event);
  const payload = validateWithSchema(updateMemberSchema, body);

  const updated = await memberService.update(id, payload);

  return {
    success: true,
    data: updated,
    message: '會友資料更新成功',
  };
});
