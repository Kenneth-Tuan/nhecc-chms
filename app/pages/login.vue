<script setup lang="ts">
/**
 * 登入頁面
 * 支援 320px 最小寬度，採用 PrimeVue 與 UnoCSS 實作。
 */

const formData = ref({
  account: "",
  password: "",
  rememberMe: false,
});

const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  // 模擬登入延遲
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Login attempt", formData.value);
  loading.value = false;
  // 導向首頁
  navigateTo("/");
};

const handleSocialLogin = (provider: string) => {
  console.log(`Social login with ${provider}`);
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
  >
    <!-- 容器支援最小 320px -->
    <div
      class="w-full max-w-[420px] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[700px]"
    >
      <main class="flex-1 p-6 sm:p-8 flex flex-col">
        <!-- Header -->
        <div class="text-center mt-4 mb-8">
          <div class="w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <img
              src="@/assets/icons/NHECC_ICON-01.png"
              alt="Logo"
              class="object-contain"
            />
          </div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
            歡迎回來
          </h1>
          <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            請登入您的帳號以繼續使用
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div class="space-y-4">
            <div class="flex flex-col gap-2">
              <label
                class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                >帳號</label
              >
              <InputText
                v-model="formData.account"
                placeholder="Email 或 手機號碼"
                fluid
                class="!rounded-xl !py-3 !px-4"
              />
            </div>

            <div class="flex flex-col gap-2">
              <div class="flex justify-between items-center px-1">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >密碼</label
                >
                <NuxtLink
                  to="#"
                  class="text-xs text-primary font-medium hover:underline"
                  >忘記密碼？</NuxtLink
                >
              </div>
              <Password
                v-model="formData.password"
                placeholder="請輸入密碼"
                toggleMask
                :feedback="false"
                fluid
                class="w-full"
                input-class="!rounded-xl !py-3 !px-4 !w-full"
              />
            </div>

            <div class="flex items-center gap-2 px-1">
              <Checkbox
                v-model="formData.rememberMe"
                binary
                inputId="rememberMe"
              />
              <label
                for="rememberMe"
                class="text-sm text-slate-600 dark:text-slate-400 cursor-pointer"
                >記住我</label
              >
            </div>
          </div>

          <Button
            label="立即登入"
            type="submit"
            :loading="loading"
            class="!w-full !py-4 !rounded-xl !text-lg !font-bold !bg-primary !border-none shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-98 transition-all"
          />
        </form>

        <!-- Divider -->
        <div class="relative my-8 text-center">
          <div class="absolute inset-0 flex items-center">
            <div
              class="w-full border-t border-slate-200 dark:border-slate-800"
            ></div>
          </div>
          <span
            class="relative bg-white dark:bg-slate-900 px-4 text-xs uppercase text-slate-400 font-medium tracking-widest"
          >
            或使用社交帳號登入
          </span>
        </div>

        <!-- Social Login -->
        <div class="grid grid-cols-2 gap-4">
          <Button
            severity="secondary"
            outlined
            class="!py-3 !rounded-xl !border-slate-200 dark:!border-slate-800 !bg-transparent hover:!bg-slate-50 dark:hover:!bg-slate-800 transition-all flex items-center justify-center gap-2"
            @click="handleSocialLogin('line')"
          >
            <img src="@/assets/icons/line.svg" alt="Line" class="w-5 h-5" />
            <span class="text-sm font-bold text-slate-700 dark:text-slate-200"
              >LINE</span
            >
          </Button>

          <Button
            severity="secondary"
            outlined
            class="!py-3 !rounded-xl !border-slate-200 dark:!border-slate-800 !bg-transparent hover:!bg-slate-50 dark:hover:!bg-slate-800 transition-all flex items-center justify-center gap-2"
            @click="handleSocialLogin('google')"
          >
            <img src="@/assets/icons/google.svg" alt="Google" class="w-5 h-5" />
            <span class="text-sm font-bold text-slate-700 dark:text-slate-200"
              >Google</span
            >
          </Button>
        </div>

        <!-- Footer -->
        <div class="mt-auto pt-8 text-center">
          <p class="text-sm text-slate-500 dark:text-slate-400">
            還沒有帳號？
            <NuxtLink
              to="/register"
              class="text-primary font-bold hover:underline"
              >立即註冊</NuxtLink
            >
          </p>
          <div class="mt-4 flex justify-center gap-4">
            <NuxtLink
              to="#"
              class="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >服務條款</NuxtLink
            >
            <NuxtLink
              to="#"
              class="text-[11px] text-slate-400 hover:text-slate-600 underline"
              >隱私政策</NuxtLink
            >
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* 確保 PrimeVue 元件符合設計 */
:deep(.p-inputtext) {
  @apply bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 transition-all;
}
:deep(.p-inputtext:focus) {
  @apply border-primary ring-2 ring-primary/20;
}
:deep(.p-button.p-button-secondary.p-button-outlined) {
  @apply transition-colors;
}
</style>
