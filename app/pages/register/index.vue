<script setup lang="ts">
/**
 * 註冊頁面 - 階段一：建立新帳號
 * 支援 320px 最小寬度。
 */

const formData = ref({
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
});

const loading = ref(false);

const handleNextStep = async () => {
  // 基本驗證
  if (formData.value.password !== formData.value.confirmPassword) {
    // 這裡通常會用 PrimeVue 的 Toast 或 Message，暫時用 console
    console.warn("密碼與確認密碼不符");
    return;
  }

  loading.value = true;
  // 模擬處理延遲
  await new Promise((resolve) => setTimeout(resolve, 800));
  console.log("Register Step 1 attempt", formData.value);
  loading.value = false;

  // 導向註冊階段二：個人資料完成
  navigateTo("/register/profile");
};

definePageMeta({
  layout: "auth",
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
  >
    <div
      class="w-full max-w-[420px] bg-white dark:bg-slate-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[750px]"
    >
      <main class="flex-1 p-6 sm:p-8 flex flex-col">
        <!-- Progress Indicator -->
        <div class="flex items-center justify-center gap-2 mb-8">
          <div class="h-1.5 w-12 bg-primary rounded-full"></div>
          <div
            class="h-1.5 w-12 bg-slate-200 dark:bg-slate-800 rounded-full"
          ></div>
        </div>

        <!-- Header -->
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
            建立新帳號
          </h1>
          <p
            class="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed"
          >
            請輸入您的基本資訊以開始使用<br />教會學習平台
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleNextStep">
          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
              >真實姓名 <span class="text-primary">*</span></label
            >
            <div class="relative">
              <i
                class="pi pi-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
              />
              <InputText
                v-model="formData.fullName"
                placeholder="請輸入姓名"
                fluid
                required
                class="!pl-11 !rounded-xl !py-3"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
              >手機號碼 <span class="text-primary">*</span></label
            >
            <div class="relative">
              <i
                class="pi pi-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
              />
              <InputText
                v-model="formData.phone"
                placeholder="0912-345-678"
                fluid
                required
                type="tel"
                class="!pl-11 !rounded-xl !py-3"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
              >電子信箱 <span class="text-primary">*</span></label
            >
            <div class="relative">
              <i
                class="pi pi-envelope absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
              />
              <InputText
                v-model="formData.email"
                placeholder="example@email.com"
                fluid
                required
                type="email"
                class="!pl-11 !rounded-xl !py-3"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5 text-xs text-slate-400 px-1 mb-1">
            <i class="pi pi-info-circle mr-1"></i> 密碼需包含 8 位以上英數字
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
              >設定密碼 <span class="text-primary">*</span></label
            >
            <div class="relative">
              <i
                class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
              />
              <Password
                v-model="formData.password"
                placeholder="請輸入密碼"
                toggleMask
                :feedback="false"
                fluid
                required
                class="w-full"
                input-class="!pl-11 !rounded-xl !py-3 !w-full"
              />
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label
              class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
              >確認密碼 <span class="text-primary">*</span></label
            >
            <div class="relative">
              <i
                class="pi pi-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg z-10"
              />
              <Password
                v-model="formData.confirmPassword"
                placeholder="請再次輸入密碼"
                toggleMask
                :feedback="false"
                fluid
                required
                class="w-full"
                input-class="!pl-11 !rounded-xl !py-3 !w-full"
              />
            </div>
          </div>

          <div class="pt-4">
            <Button
              label="下一步 (Next)"
              type="submit"
              :loading="loading"
              class="!w-full !py-4 !rounded-xl !text-lg !font-bold shadow-lg shadow-primary/20"
            />
            <p
              class="text-[11px] text-slate-400 text-center mt-4 px-4 leading-normal"
            >
              點擊下一步即代表您同意本平台的
              <NuxtLink to="#" class="underline hover:text-slate-600"
                >服務條款</NuxtLink
              >
              與
              <NuxtLink to="#" class="underline hover:text-slate-600"
                >隱私政策</NuxtLink
              >
            </p>
          </div>
        </form>

        <!-- Footer -->
        <div
          class="mt-auto pt-8 text-center border-t border-slate-50 dark:border-slate-800/50"
        >
          <p class="text-sm text-slate-500 dark:text-slate-400">
            已經有帳號了嗎？
            <NuxtLink to="/login" class="text-primary font-bold hover:underline"
              >立即登入</NuxtLink
            >
          </p>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext) {
  @apply bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 transition-all;
}
:deep(.p-inputtext:focus) {
  @apply border-primary ring-2 ring-primary/20;
}
</style>
