/**
 * POST /api/auth/register
 * Creates a new Member record linked to a Firebase UID.
 */
import { MemberRepository } from "../../repositories/member.repository";

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

  const member = await memberRepo.create({
    uuid: body.uid,
    fullName: body.fullName,
    gender: "Male",
    dob: "",
    email: body.email,
    mobile: body.phone || "",
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
