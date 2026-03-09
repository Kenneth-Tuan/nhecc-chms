import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    oldPassword: z.string().min(1, "請輸入舊密碼"),
    newPassword: z.string().min(6, "密碼長度至少 6 碼"),
    confirmPassword: z.string().min(6, "請再次輸入密碼"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "兩次輸入的密碼不一致",
    path: ["confirmPassword"],
  });

export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
