import { z } from "zod";
import type { FieldSchema } from "~/types/form";

// 1. Zod Schemas
export const baseUserSchema = z.object({
  fullName: z.string().min(2, "請輸入真實姓名"),
  phone: z
    .string()
    .min(10, "手機格式錯誤")
    .regex(/^09\d{8}$/, "請輸入有效的手機號碼 (09xxxxxxxx)"),
  email: z.string().email("Email 格式錯誤"),
  gender: z.enum(["MALE", "FEMALE"]).default("MALE"),
  birthDate: z.date().nullable(),
  maritalStatus: z.string().nullable().optional(),
  lineId: z.string().optional(),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  isBaptized: z.boolean().default(false),
  baptismDate: z.date().nullable().optional(),
  pastoralZone: z.string().nullable().optional(),
  homeGroup: z.string().nullable().optional(),
  previousCourses: z.array(z.string()).default([]),
  avatar: z.string().nullable().optional(),
});

// Step 1: Account Schema (Register Basic)
export const step1Schema = baseUserSchema
  .pick({
    fullName: true,
    phone: true,
    email: true,
  })
  .extend({
    password: z.string().min(6, "密碼長度至少 6 碼"),
    confirmPassword: z.string().min(6, "請再次輸入密碼"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "兩次輸入的密碼不一致",
    path: ["confirmPassword"],
  });

// Step 2: Profile Schema (Additional Info)
// For the registration second step where we only show these fields
export const step2Schema = baseUserSchema.pick({
  gender: true,
  birthDate: true,
  maritalStatus: true,
  lineId: true,
  address: true,
  emergencyContactName: true,
  emergencyContactPhone: true,
  isBaptized: true,
  baptismDate: true,
  pastoralZone: true,
  homeGroup: true,
  previousCourses: true,
  avatar: true,
});

// Full Register Schema
export const registerSchema = step1Schema.merge(baseUserSchema);
export type RegisterFormValues = z.infer<typeof registerSchema>;
export type UserProfileValues = z.infer<typeof baseUserSchema>;

// Field Dictionary (Single Source of Truth for UI)
// 使用 as const 確保類型安全，不會有 undefined
export const userFieldDefs = {
  fullName: {
    name: "fullName",
    label: "真實姓名",
    icon: "pi pi-user",
    placeholder: "請輸入姓名",
    required: true,
    component: "InputText",
  },
  phone: {
    name: "phone",
    label: "手機號碼",
    icon: "pi pi-phone",
    placeholder: "0912-345-678",
    required: true,
    type: "tel",
    component: "InputText",
  },
  email: {
    name: "email",
    label: "電子信箱",
    icon: "pi pi-envelope",
    placeholder: "example@email.com",
    required: true,
    type: "email",
    component: "InputText",
  },
  password: {
    name: "password",
    label: "設定密碼",
    icon: "pi pi-lock",
    placeholder: "請輸入密碼",
    required: true,
    component: "Password",
    extraProps: { toggleMask: true, feedback: true },
  },
  confirmPassword: {
    name: "confirmPassword",
    label: "確認密碼",
    icon: "pi pi-lock",
    placeholder: "請再次輸入密碼",
    required: true,
    component: "Password",
    extraProps: { toggleMask: true, feedback: false },
  },
  gender: {
    name: "gender",
    label: "性別",
    icon: "pi pi-user",
    required: true,
    component: "SelectButton",
    options: genderOptions,
  },
  birthDate: {
    name: "birthDate",
    label: "出生年月日",
    icon: "pi pi-calendar",
    required: true,
    component: "DatePicker",
  },
  maritalStatus: {
    name: "maritalStatus",
    label: "婚姻狀態",
    component: "Select",
    options: maritalOptions,
    placeholder: "請選擇狀態",
  },
  lineId: {
    name: "lineId",
    label: "Line ID",
    component: "InputText",
    placeholder: "請輸入 Line ID",
  },
  address: {
    name: "address",
    label: "通訊地址",
    component: "InputText",
    placeholder: "請輸入通訊地址",
  },
  emergencyContactName: {
    name: "emergencyContactName",
    label: "緊急聯絡人姓名",
    component: "InputText",
    placeholder: "聯絡人姓名",
  },
  emergencyContactPhone: {
    name: "emergencyContactPhone",
    label: "緊急聯絡人電話",
    component: "InputText",
    placeholder: "聯絡人電話",
  },
  isBaptized: {
    name: "isBaptized",
    label: "是否已經受洗？",
    component: "SelectButton",
    options: [
      { label: "是", value: true },
      { label: "否", value: false },
    ],
  },
  baptismDate: {
    name: "baptismDate",
    label: "受洗日期",
    component: "DatePicker",
    placeholder: "請選擇日期",
  },
  pastoralZone: {
    name: "pastoralZone",
    label: "歸屬牧區",
    component: "Select",
    placeholder: "請選擇牧區",
    extraProps: { optionLabel: "name", optionValue: "id" },
  },
  homeGroup: {
    name: "homeGroup",
    label: "歸屬小組",
    component: "Select",
    placeholder: "請選擇小組",
    extraProps: { optionLabel: "name", optionValue: "id" },
  },
  previousCourses: {
    name: "previousCourses",
    label: "曾經參與過的福音課程 (可複選，僅供參考)",
    component: "Listbox",
    options: courseOptions,
    extraProps: { multiple: true },
  },
} as const satisfies Record<string, FieldSchema>;
