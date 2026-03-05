<script setup lang="ts">
/**
 * 受邀註冊頁面 /register/invite?token=xxx
 * 用戶透過邀請連結開啟，自行填寫個人資料 + 密碼完成註冊。
 * 角色由邀請預設，不支援社群登入。
 */
import type { InvitationPublicInfo } from "~/types/invitation";
import { signInWithCustomToken, type Auth } from "firebase/auth";
import { useAuthStore } from "~/stores/auth.store";
import AccountInfoForm from "./_components/AccountInfoForm.vue";

definePageMeta({
  layout: "auth-layout",
});

const route = useRoute();
const toast = useToast();
const { $firebaseAuth } = useNuxtApp();
const auth = $firebaseAuth as Auth;
const authStore = useAuthStore();
const { isLoading } = useGlobalLoading();

const token = route.query.token as string | undefined;
const invitation = ref<InvitationPublicInfo | null>(null);

const isSubmitting = ref(false);
const errorMessage = ref("");

const formData = ref({
  fullName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
});

const formErrors = ref<Record<string, string>>({});

async function loadInvitation(): Promise<void> {
  if (!token) {
    errorMessage.value = "缺少邀請 Token，請確認連結是否正確。";
    isLoading.value = false;
    return;
  }

  try {
    const res = await $fetch<{ success: boolean; data: InvitationPublicInfo }>(
      `/api/invitations/${token}`,
    );
    invitation.value = res.data;

    if (res.data.expired) {
      errorMessage.value = "此邀請連結已過期，請聯繫管理員重新發送。";
    }
  } catch (err: any) {
    const status = err?.statusCode || err?.data?.statusCode;
    if (status === 410) {
      errorMessage.value = err?.data?.message || "此邀請連結已失效或已被使用。";
    } else if (status === 404) {
      errorMessage.value = "邀請連結不存在，請確認連結是否正確。";
    } else {
      errorMessage.value = "載入邀請資料失敗，請稍後再試。";
    }
  } finally {
    isLoading.value = false;
  }
}

function validate(): boolean {
  const errors: Record<string, string> = {};

  if (!formData.value.fullName.trim()) errors.fullName = "請輸入姓名";
  if (!formData.value.email.trim()) errors.email = "請輸入 Email";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.value.email))
    errors.email = "Email 格式不正確";
  if (!formData.value.password || formData.value.password.length < 6)
    errors.password = "密碼長度至少 6 個字元";
  if (formData.value.password !== formData.value.confirmPassword)
    errors.confirmPassword = "兩次密碼輸入不一致";

  formErrors.value = errors;
  return Object.keys(errors).length === 0;
}

async function handleSubmit(): Promise<void> {
  if (!validate()) return;

  isSubmitting.value = true;
  try {
    const res = await $fetch<{
      success: boolean;
      data: { uid: string; customToken: string };
    }>("/api/auth/register-by-invitation", {
      method: "POST",
      body: {
        token,
        fullName: formData.value.fullName.trim(),
        email: formData.value.email.trim(),
        phone: formData.value.phone.trim(),
        password: formData.value.password,
      },
    });

    const credential = await signInWithCustomToken(auth, res.data.customToken);
    const idToken = await credential.user.getIdToken();

    await $fetch("/api/auth/session", {
      method: "POST",
      body: { idToken },
    });

    await authStore.loadContext();

    toast.add({
      severity: "success",
      summary: "註冊成功！",
      detail: "歡迎加入，正在跳轉...",
      life: 3000,
    });

    navigateTo(authStore.isAdmin ? "/dashboard" : "/");
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "註冊失敗",
      detail: err?.data?.message || err?.message || "註冊失敗，請稍後再試",
      life: 4000,
    });
  } finally {
    isSubmitting.value = false;
  }
}

onMounted(() => {
  loadInvitation();
});
</script>

<template>
  <LayoutAuthCard>
    <!-- Error 狀態 -->
    <div
      v-if="errorMessage"
      class="flex flex-col items-center text-center py-12 px-6"
    >
      <i class="pi pi-times-circle text-5xl text-red-400 mb-4" />
      <h1 class="text-xl font-bold text-slate-800 dark:text-white mb-2">
        無法完成註冊
      </h1>
      <p class="text-sm text-slate-500 dark:text-slate-400 mb-6">
        {{ errorMessage }}
      </p>
      <Button
        label="前往登入頁面"
        icon="pi pi-sign-in"
        outlined
        @click="navigateTo('/login')"
      />
    </div>

    <!-- 註冊表單 -->
    <div v-else-if="invitation" class="py-8 px-6 sm:px-8">
      <header class="text-center mb-8">
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
          建立新帳號
        </h1>
        <p class="text-sm mt-2 text-slate-500 dark:text-slate-400">
          您已被邀請加入教會學習平台，請填寫以下資料完成註冊
        </p>
      </header>

      <AccountInfoForm
        v-model="formData"
        :errors="formErrors"
        :loading="isSubmitting"
        submit-label="完成註冊"
        @submit="handleSubmit"
      />

      <div
        class="pt-6 mt-4 text-center border-t border-slate-50 dark:border-slate-800/50"
      >
        <p class="text-sm text-slate-500 dark:text-slate-400">
          已經有帳號了嗎？
          <NuxtLink to="/login" class="font-bold text-primary hover:underline">
            立即登入
          </NuxtLink>
        </p>
      </div>
    </div>
  </LayoutAuthCard>
</template>

<style scoped></style>
