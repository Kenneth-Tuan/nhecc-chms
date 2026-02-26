/**
 * PATCH /api/members/:id
 * 更新現有會友資料。
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

  // 檢查權限：若用戶具備全域編輯權限，或是在編輯自身資料（由 CASL Self scope 處理）則允許
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
