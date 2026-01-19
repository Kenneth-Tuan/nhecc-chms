<script setup lang="ts">
import { ref } from "vue";

const formData = ref({
  name: "",
  account: "",
  password: "",
  confirmPassword: "",
});

const handleRegister = () => {
  // Handle register logic
  console.log("Register attempt", formData.value);
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
          <div class="w-16 h-16 mx-auto mb-6">
            <img
              src="@/assets/icons/NHECC_ICON-01.png"
              alt="Logo"
              class="w-full h-full object-contain"
            />
          </div>
          <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
            註冊帳號
          </h1>
          <p class="text-slate-500 dark:text-slate-400 mt-2 text-sm">
            歡迎加入教會學習平台
          </p>
        </div>

        <!-- Form -->
        <form class="space-y-5" @submit.prevent="handleRegister">
          <FloatLabel variant="in">
            <InputText v-model="formData.name" fluid />
            <label>姓名</label>
          </FloatLabel>

          <FloatLabel variant="in">
            <InputText v-model="formData.account" fluid />
            <label>Email 或 手機號碼</label>
          </FloatLabel>

          <FloatLabel variant="in">
            <Password
              v-model="formData.password"
              toggleMask
              :feedback="false"
              fluid
            />
            <label>設定密碼</label>
          </FloatLabel>

          <FloatLabel variant="in">
            <Password
              v-model="formData.confirmPassword"
              toggleMask
              :feedback="false"
              fluid
            />
            <label>確認密碼</label>
          </FloatLabel>

          <Button
            label="註冊 (Register)"
            type="submit"
            class="!w-full !text-lg !font-bold shadow-sm shadow-primary-500/20 !mt-4"
          />
        </form>

        <!-- Footer Text -->
        <div class="mt-auto pb-6 pt-10 text-center">
          <div class="flex items-center justify-center mb-6">
            <span class="text-sm text-slate-500 dark:text-slate-400 mr-2"
              >已經有帳號了嗎？</span
            >
            <NuxtLink
              to="/login"
              class="text-primary-500 hover:underline text-sm font-bold"
              >立即登入</NuxtLink
            >
          </div>

          <p
            class="text-[11px] text-slate-400 dark:text-slate-500 tracking-tight"
          >
            註冊即代表您同意
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
