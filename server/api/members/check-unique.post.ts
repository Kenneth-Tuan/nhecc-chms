/**
 * POST /api/members/check-unique
 * 檢查欄位值（手機/電子信箱）在會友中是否唯一。
 */
import { readBody } from "h3";
import { z } from "zod";
import { MemberRepository } from "../../repositories/member.repository";
import { validateWithSchema } from "../../utils/validation";

const memberRepo = new MemberRepository();

const checkUniqueSchema = z.object({
  field: z.enum(["mobile", "email"]),
  value: z.string().min(1),
  excludeUuid: z.string().optional(),
});

export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { field, value, excludeUuid } = validateWithSchema(
    checkUniqueSchema,
    body,
  );

  let isUnique = true;
  let message: string | undefined;

  if (field === "mobile") {
    const exists = await memberRepo.isMobileExists(value, excludeUuid);
    isUnique = !exists;
    if (!isUnique) {
      message = "此手機號碼已被使用";
    }
  } else if (field === "email") {
    const exists = await memberRepo.isEmailExists(value, excludeUuid);
    isUnique = !exists;
    if (!isUnique) {
      message = "此 Email 已被使用，請確認是否為不同會友";
    }
  }

  return {
    isUnique,
    message,
  };
});
