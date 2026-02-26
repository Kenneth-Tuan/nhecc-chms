/**
 * PATCH /api/auth/me
 * 本人修改個人基本資料。
 */
import { readBody } from "h3";
import { updateProfileSchema } from "~/schemas/member.schema";
import { MemberService } from "../../services/member.service";
import { AuthService } from "../../services/auth.service";
import { validateWithSchema } from "../../utils/validation";

const memberService = new MemberService();
const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  if (!userId) {
    throw createError({ statusCode: 401, message: "未登入，無法更新個人資料" });
  }

  const body = await readBody(event);

  // 1. 驗證本人的資料負載，僅保留允許本人修改的欄位
  const payload = validateWithSchema(updateProfileSchema, body);

  // 2. 由於是本人修改，不需額外的 Scope/RBAC 更新權限檢查，但需確保只改自己
  const updated = await memberService.update(userId, payload);

  // 3. 清理與此用戶相關的上下文快取，下次請求時會重新獲取更新後的資料
  authService.clearCache(userId);

  return {
    success: true,
    data: updated,
    message: "個人資料更新成功",
  };
});
