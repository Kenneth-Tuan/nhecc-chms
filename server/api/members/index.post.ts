/**
 * POST /api/members
 * 建立新會友。
 */
import { readBody } from "h3";
import { createMemberSchema } from "~/schemas/member.schema";
import { MemberService } from "../../services/member.service";
import { requireAbility, validateWithSchema } from "../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "create", "Member");

  const body = await readBody(event);
  const payload = validateWithSchema(createMemberSchema, body);

  const member = await memberService.create(payload);

  return {
    success: true,
    data: member,
    message: "會友建立成功",
  };
});
