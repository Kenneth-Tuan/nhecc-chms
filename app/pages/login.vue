<script setup lang="ts">
import { ref } from "vue";

const formData = ref({
  account: "",
  password: "",
});

const handleLogin = () => {
  // Handle login logic
  console.log("Login attempt", formData.value);
};
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300"
  >
    <div
      class="w-full max-w-[420px] bg-white dark:bg-surface-900 shadow-2xl rounded-3xl overflow-hidden flex flex-col min-h-[750px]"
    >
      <main class="flex-1 p-8 flex flex-col">
        <!-- Header -->
        <div class="text-center mt-6 mb-10">
          <div class="w-16 h-16 mx-auto">
            <img src="@/assets/icons/NHECC_ICON-01.png" alt="Logo" />
          </div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
            歡迎回來
          </h1>
        </div>

        <!-- Form -->
        <form class="space-y-4" @submit.prevent="handleLogin">
          <FloatLabel variant="in">
            <InputText v-model="formData.account" fluid />
            <label for="on_label">Email 或 手機號碼</label>
          </FloatLabel>

          <FloatLabel variant="in">
            <InputText v-model="formData.password" fluid />
            <label for="on_label">密碼</label>
          </FloatLabel>

          <Button
            label="登入 (Login)"
            type="submit"
            class="!w-full !text-lg !font-bold shadow-sm shadow-primary-500/20"
          />
        </form>

        <!-- Links -->
        <div class="flex items-center justify-between mt-6 px-1">
          <NuxtLink
            to="/register"
            class="text-primary-500 hover:underline text-sm font-medium"
            >註冊新帳號</NuxtLink
          >
          <NuxtLink
            to="#"
            class="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium"
            >忘記密碼</NuxtLink
          >
        </div>

        <!-- Divider -->
        <div class="relative my-8">
          <Divider align="center" type="solid">
            <span
              class="text-xs uppercase text-slate-400 font-medium tracking-wider px-2"
              >或是透過以下方式繼續</span
            >
          </Divider>
        </div>

        <!-- Social Login -->
        <div class="space-y-3">
          <Button
            outlined
            severity="secondary"
            class="!w-full !py-3 !rounded-lg !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 transition-all"
          >
            <div class="!w-6 !h-6">
              <img src="@/assets/icons/google.svg" alt="Google" />
            </div>
            使用 Google 繼續
          </Button>

          <Button
            outlined
            severity="secondary"
            class="!w-full !py-3 !rounded-lg !border-slate-200 dark:!border-slate-700 !text-slate-700 dark:!text-slate-200 transition-all"
          >
            <div class="!w-6 !h-6">
              <img src="@/assets/icons/line.svg" alt="Line" />
            </div>
            使用 LINE 繼續
          </Button>
        </div>

        <!-- Footer Text -->
        <div class="mt-auto pb-6 pt-10 text-center">
          <p
            class="text-[11px] text-slate-400 dark:text-slate-500 tracking-tight"
          >
            登入即代表您同意
            <NuxtLink
              to="#"
              class="underline hover:text-slate-600 dark:hover:text-slate-300"
              >服務條款</NuxtLink
            >
            與
            <NuxtLink
              to="#"
              class="underline hover:text-slate-600 dark:hover:text-slate-300"
              >隱私政策</NuxtLink
            >
          </p>
        </div>
      </main>
    </div>
  </div>
</template>
