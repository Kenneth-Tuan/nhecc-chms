/**
 * POST /api/members/:id/reveal
 * Reveals sensitive fields for a member.
 * Body: { fields: ["mobile", "email", ...] }
 */
import { readBody } from 'h3';
import { MemberService } from '../../../services/member.service';
import { getUserContext, requireAbility } from '../../../utils/validation';

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const userContext = getUserContext(event);
  requireAbility(event, 'view', 'Member');

  const id = getRouterParam(event, 'id');
  if (!id) {
    throw createError({ statusCode: 400, message: '缺少會友 ID' });
  }

  const body = await readBody(event);
  const fields = body?.fields;

  if (!Array.isArray(fields) || fields.length === 0) {
    throw createError({
      statusCode: 400,
      message: '請提供要解鎖的欄位',
    });
  }

  const result = await memberService.revealFields(
    userContext,
    event.context.ability!,
    id,
    fields,
  );

  return {
    success: true,
    data: result,
  };
});
