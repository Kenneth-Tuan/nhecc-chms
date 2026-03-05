/**
 * 註冊表單 Schema 與 UI Field Defs
 *
 * Zod schema 直接從 member.schema.ts 的 baseMemberSchema 組合，不重複定義欄位。
 * 只有「表單專屬」欄位（password, confirmPassword, phone→mobile 映射、Date UI 欄位）在此處理。
 */
import { z } from "zod";
import { baseMemberSchema } from "~/schemas/member.schema";

const { fullName, gender, mobile, email } = baseMemberSchema.shape;

// ── Step 1: 帳號資訊 ─────────────────────────────────────────────────────────
const step1Base = z.object({
  fullName,
  phone: mobile, // 前端叫 phone，提交時映射成 mobile
  email,
});

export const getStep1Schema = (isSocial: boolean = false) => {
  if (isSocial) return step1Base;

  return step1Base
    .extend({
      password: z.string().min(6, "密碼長度至少 6 碼"),
      confirmPassword: z.string().min(6, "請再次輸入密碼"),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "兩次輸入的密碼不一致",
      path: ["confirmPassword"],
    });
};

export const step1Schema = getStep1Schema(false);

// ── Step 2: 個人資料 ──────────────────────────────────────────────────────────
// 欄位命名與 member.ts 不同（UI 專用），在 register.vue 的 onStep2Submit 中手動映射
export const step2Schema = z.object({
  gender,
  birthDate: z.date().nullable(), // UI Date object → 後端 dob string
  isBaptized: z.boolean().default(false), // UI → 後端 baptismStatus
  baptismDate: z.date().nullable().optional(), // UI Date object → 後端 baptismDate string
  pastoralZone: z.string().nullable().optional(), // UI → 後端 zoneId
  homeGroup: z.string().nullable().optional(), // UI → 後端 groupId
  previousCourses: z.array(z.string()).default([]), // UI → 後端 pastCourses
  avatar: z.string().nullable().optional(),
});

// ── 型別推導 ──────────────────────────────────────────────────────────────────
export type RegisterFormValues = z.infer<typeof step1Schema> &
  z.infer<typeof step2Schema>;
export type UserProfileValues = z.infer<typeof step2Schema>;
