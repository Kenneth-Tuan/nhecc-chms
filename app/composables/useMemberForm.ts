/**
 * 會友表單 Composable (ST004)
 * 整合表單提交、Zod 驗證以及新增/編輯的錯誤處理。
 */
import { ZodError } from "zod";
import {
  createMemberSchema,
  updateMemberSchema,
} from "~/schemas/member.schema";
import type { CreateMemberPayload, UpdateMemberPayload } from "~/types/member";

interface FormError {
  field: string;
  message: string;
}

export function useMemberForm() {
  const toast = useToast();
  const isSubmitting = ref(false);
  const fieldErrors = ref<Record<string, string>>({});

  /** 清除所有欄位錯誤 */
  function clearErrors(): void {
    fieldErrors.value = {};
  }

  /** 清除特定欄位的錯誤 */
  function clearFieldError(field: string): void {
    delete fieldErrors.value[field];
  }

  /** 根據 Zod 驗證結果設定欄位錯誤 */
  function setFieldErrors(errors: FormError[]): void {
    clearErrors();
    for (const error of errors) {
      fieldErrors.value[error.field] = error.message;
    }
  }

  /** 使用「建立」架構驗證表單資料 */
  function validateCreate(data: Record<string, unknown>): boolean {
    try {
      createMemberSchema.parse(data);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setFieldErrors(
          error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        );
      }
      return false;
    }
  }

  /** 使用「更新」架構驗證表單資料 */
  function validateUpdate(data: Record<string, unknown>): boolean {
    try {
      updateMemberSchema.parse(data);
      clearErrors();
      return true;
    } catch (error) {
      if (error instanceof ZodError) {
        setFieldErrors(
          error.errors.map((e) => ({
            field: e.path.join("."),
            message: e.message,
          })),
        );
      }
      return false;
    }
  }

  /** 提交建立會友表單 */
  async function submitCreate(
    payload: CreateMemberPayload,
  ): Promise<{ success: boolean; data?: Record<string, unknown> }> {
    isSubmitting.value = true;
    clearErrors();

    try {
      const response = await $fetch<{
        success: boolean;
        data: Record<string, unknown>;
        message: string;
      }>("/api/members", {
        method: "POST",
        body: payload,
      });

      toast.add({
        severity: "success",
        summary: "成功",
        detail: response.message || "會友新增成功！",
        life: 3000,
      });

      return { success: true, data: response.data };
    } catch (error: unknown) {
      handleApiError(error);
      return { success: false };
    } finally {
      isSubmitting.value = false;
    }
  }

  /** 提交更新會友表單 */
  async function submitUpdate(
    uuid: string,
    payload: UpdateMemberPayload,
  ): Promise<{ success: boolean; data?: Record<string, unknown> }> {
    isSubmitting.value = true;
    clearErrors();

    try {
      const response = await $fetch<{
        success: boolean;
        data: Record<string, unknown>;
        message: string;
      }>(`/api/members/${uuid}`, {
        method: "PATCH",
        body: payload,
      });

      toast.add({
        severity: "success",
        summary: "成功",
        detail: response.message || "會友資料已更新！",
        life: 3000,
      });

      return { success: true, data: response.data };
    } catch (error: unknown) {
      handleApiError(error);
      return { success: false };
    } finally {
      isSubmitting.value = false;
    }
  }

  /** 處理 API 錯誤，包含 Toast 提示與欄位對應 */
  function handleApiError(error: unknown): void {
    const apiError = error as {
      data?: { message?: string; errors?: FormError[] };
    };

    if (apiError?.data?.errors) {
      setFieldErrors(apiError.data.errors);
      toast.add({
        severity: "error",
        summary: "表單驗證失敗",
        detail: "請檢查紅色標記的欄位",
        life: 5000,
      });
    } else {
      const message = apiError?.data?.message || "操作失敗，請稍後再試";
      toast.add({
        severity: "error",
        summary: "錯誤",
        detail: message,
        life: 5000,
      });
    }
  }

  return {
    isSubmitting,
    fieldErrors,
    clearErrors,
    clearFieldError,
    validateCreate,
    validateUpdate,
    submitCreate,
    submitUpdate,
  };
}
