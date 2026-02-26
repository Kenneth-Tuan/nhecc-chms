/**
 * POST /api/auth/register
 * 建立與 Firebase UID 關聯的新會友 (Member) 記錄。
 */
import { MemberRepository } from "../../repositories/member.repository";
import { getAdminAuth } from "../../utils/firebase-admin";

interface RegisterBody {
  uid: string;
  fullName: string;
  phone: string;
  email: string;
  avatar?: string;
}

const memberRepo = new MemberRepository();

export default defineEventHandler(async (event) => {
  const body = await readBody<RegisterBody>(event);

  if (!body.uid || !body.fullName || !body.email) {
    throw createError({
      statusCode: 400,
      message: "uid, fullName, and email are required",
    });
  }

  const existing = await memberRepo.findById(body.uid);
  if (existing) {
    return { success: true, member: existing, alreadyExists: true };
  }

  const auth = getAdminAuth();
  const fbUser = await auth.getUser(body.uid);
  const isGoogleUser = fbUser.providerData.some(
    (p) => p.providerId === "google.com",
  );
  const isLineUser = body.uid.startsWith("line_");

  // API 攔截：確保電子信箱在適用情況下與 Google 提供者一致
  if (isGoogleUser && fbUser.email && body.email !== fbUser.email) {
    throw createError({
      statusCode: 400,
      message: "無法變更 Google 註冊的電子信箱",
    });
  }

  // API 攔截：確保 LINE 註冊時 lineId 與 UID 一致
  const finalLineId = isLineUser ? body.uid.replace("line_", "") : undefined;

  const member = await memberRepo.create({
    uuid: body.uid,
    fullName: body.fullName,
    gender: "Male",
    dob: "",
    email: body.email,
    mobile: body.phone || "",
    lineId: finalLineId,
    emergencyContactName: "",
    emergencyContactRelationship: "",
    emergencyContactPhone: "",
    baptismStatus: false,
    roleIds: ["general"],
    functionalGroupIds: [],
    avatar: body.avatar,
  });

  return { success: true, member, alreadyExists: false };
});
