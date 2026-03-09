<script setup lang="ts">
/**
 * 重設密碼頁面
 */
import {
  resetPasswordSchema,
  type ResetPasswordValues,
} from "~/schemas/password.schema";

definePageMeta({
  layout: "default",
});

const router = useRouter();
const toast = useToast();

const form = ref<ResetPasswordValues>({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});

const errors = ref<Record<string, string>>({});
const isSubmitting = ref(false);

const { changePassword } = useFirebaseAuth();

const handleSave = async () => {
  const result = resetPasswordSchema.safeParse(form.value);
  if (!result.success) {
    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue: any) => {
      const key = issue.path[0] as string;
      if (key && !newErrors[key]) newErrors[key] = issue.message;
    });
    errors.value = newErrors;
    return;
  }
  errors.value = {};

  isSubmitting.value = true;
  try {
    await changePassword(form.value.oldPassword, form.value.newPassword);

    toast.add({
      severity: "success",
      summary: "密碼更新成功",
      detail: "您的密碼已經成功更新",
      life: 3000,
    });
    router.replace("/profile");
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "更新失敗",
      detail: error.message || "無法更新密碼，可能有誤或請稍後再試",
      life: 4000,
    });
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <div class="px-4 py-8 max-w-2xl mx-auto pb-24">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <Button
        icon="pi pi-chevron-left"
        text
        rounded
        class="!p-3"
        @click="router.back()"
      />
      <h1
        class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
      >
        重設密碼
      </h1>
    </div>

    <form
      @submit.prevent="handleSave"
      class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <div class="space-y-6">
        <h2
          class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white border-l-4 border-primary pl-3"
        >
          密碼資訊
        </h2>

        <div class="flex flex-col gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">舊密碼</label>
            <Password
              v-model="form.oldPassword"
              placeholder="請輸入目前的密碼"
              :invalid="!!errors.oldPassword"
              :feedback="false"
              toggleMask
              fluid
              inputClass="w-full !py-3 !px-4 !text-lg !rounded-xl bg-inherit"
            />
            <small
              v-if="errors.oldPassword"
              class="text-red-500 text-xs mt-1"
              >{{ errors.oldPassword }}</small
            >
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">新密碼</label>
            <Password
              v-model="form.newPassword"
              placeholder="至少 6 個字元"
              :invalid="!!errors.newPassword"
              :feedback="true"
              toggleMask
              fluid
              inputClass="w-full !py-3 !px-4 !text-lg !rounded-xl bg-inherit"
            />
            <small
              v-if="errors.newPassword"
              class="text-red-500 text-xs mt-1"
              >{{ errors.newPassword }}</small
            >
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">確認新密碼</label>
            <Password
              v-model="form.confirmPassword"
              placeholder="請再次輸入新密碼"
              :invalid="!!errors.confirmPassword"
              :feedback="false"
              toggleMask
              fluid
              inputClass="w-full !py-3 !px-4 !text-lg !rounded-xl bg-inherit"
            />
            <small
              v-if="errors.confirmPassword"
              class="text-red-500 text-xs mt-1"
              >{{ errors.confirmPassword }}</small
            >
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div
        class="fixed bottom-0 left-0 w-full p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-center z-50"
      >
        <div class="w-full max-w-2xl flex gap-4">
          <Button
            label="取消"
            severity="secondary"
            text
            class="flex-1 !py-4 !rounded-2xl !font-bold"
            @click="router.back()"
          />
          <Button
            label="確認修改密碼"
            severity="primary"
            class="flex-[2] !py-4 !rounded-2xl !font-extrabold shadow-md shadow-primary-500/20"
            type="submit"
            :loading="isSubmitting"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
:deep(.p-inputtext:focus) {
  outline: 2px solid rgba(var(--primary-500), 0.2) !important;
  border-color: var(--primary-500) !important;
}
</style>
