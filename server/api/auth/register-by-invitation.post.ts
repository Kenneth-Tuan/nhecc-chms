/**
 * POST /api/auth/register-by-invitation
 * 公開 API：受邀用戶完成註冊。用戶自行提供個人資料。
 */
import { InvitationService } from "../../services/invitation.service";

const invitationService = new InvitationService();

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    token: string;
    fullName: string;
    email: string;
    mobile: string;
    password: string;
  }>(event);

  if (!body.token || !body.fullName || !body.email || !body.password) {
    throw createError({
      statusCode: 400,
      message: "token, fullName, email, password 為必填",
    });
  }

  if (body.password.length < 6) {
    throw createError({
      statusCode: 400,
      message: "密碼長度至少 6 個字元",
    });
  }

  const result = await invitationService.finalizeRegistration(
    body.token,
    body.fullName,
    body.email,
    body.mobile || "",
    body.password,
  );

  return {
    success: true,
    data: {
      uid: result.uid,
      customToken: result.customToken,
    },
    message: "註冊成功",
  };
});
