/**
 * PATCH /api/members/:id
 * Updates an existing member.
 */
import { readBody } from "h3";
import { updateMemberSchema } from "~/schemas/member.schema";
import { MemberService } from "../../services/member.service";
import { requireAbility, validateWithSchema } from "../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少會友 ID" });
  }

  // Check permission: allow if user has global edit perm OR is editing self (handled by CASL Self scope)
  requireAbility(event, "update", { __type: "Member", uuid: id } as any);

  const body = await readBody(event);
  const payload = validateWithSchema(updateMemberSchema, body);

  const updated = await memberService.update(id, payload);

  return {
    success: true,
    data: updated,
    message: "會友資料更新成功",
  };
});
