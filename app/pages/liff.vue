<script setup lang="ts">
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";
import { useToast } from "primevue/usetoast";

const firebaseAuth = useFirebaseAuth();
const toast = useToast();
const loading = ref(true);

onMounted(async () => {
  try {
    const result = await firebaseAuth.loginWithLine();

    // 如果發生重定向 (liff.login())，或是沒拿到 uid，就中斷後續邏輯
    if (!result || !result.uid) return;

    if (result.isNewUser) {
      navigateTo({
        path: "/register",
        query: {
          uid: result.uid,
          fullName: result.lineProfile?.name || "",
          email: result.lineProfile?.email || "",
          avatar: result.lineProfile?.picture || "",
          social: "line",
        },
      });
    } else {
      navigateTo("/");
    }
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "LINE 登入失敗",
      detail: err.message || "發生錯誤，請稍後再試",
      life: 4000,
    });
    navigateTo("/login");
  } finally {
    loading.value = false;
  }
});

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-screen">
    <div
      class="flex flex-col overflow-hidden w-full max-w-[420px] min-h-[700px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl mx-auto"
    >
      <main
        class="flex-1 flex flex-col items-center justify-center p-6 sm:p-8 text-center animate-fade-in animate-duration-500"
      >
        <div class="flex items-center justify-center w-24 h-24 mb-6">
          <img
            src="@/assets/icons/NHECC_ICON-01.png"
            alt="Logo"
            class="object-contain drop-shadow-sm"
          />
        </div>

        <ProgressSpinner
          class="w-14 h-14 mb-6 text-primary"
          strokeWidth="4"
          animationDuration="1s"
        />

        <h1
          class="text-xl font-bold tracking-wide text-slate-800 dark:text-white mb-2"
        >
          LINE 安全驗證中
        </h1>

        <p
          class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[260px] mx-auto leading-relaxed"
        >
          正在與 LINE 伺服器連線以完成登入，請稍候片刻...
        </p>
      </main>
    </div>
  </div>
</template>
