/**
 * DELETE /api/members/:id
 * 軟刪除會友資料（將狀態設為 Inactive），並記錄刪除原因。
 */
import { readBody } from "h3";
import { softDeleteSchema } from "~/schemas/member.schema";
import { MemberService } from "../../services/member.service";
import { requireAbility, validateWithSchema } from "../../utils/validation";

const memberService = new MemberService();

export default defineEventHandler(async (event) => {
  requireAbility(event, "delete", "Member");

  const id = getRouterParam(event, "id");
  if (!id) {
    throw createError({ statusCode: 400, message: "缺少會友 ID" });
  }

  const body = await readBody(event);
  const { reason, notes } = validateWithSchema(softDeleteSchema, body);

  await memberService.softDelete(id, { reason, notes });

  return {
    success: true,
    message: "會友已停用",
  };
});
