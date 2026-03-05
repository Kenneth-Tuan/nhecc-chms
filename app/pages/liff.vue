<script setup lang="ts">
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";
import { useAuthStore } from "~/stores/auth.store";
import { useToast } from "primevue/usetoast";
import liff from "@line/liff";

const firebaseAuth = useFirebaseAuth();
const toast = useToast();
const loading = ref(true);
const route = useRoute();

/** 判斷是否為「帳號綁定」意圖，而非正常登入 */
const isLinkIntent = computed(() => route.query.intent === "link");

onMounted(async () => {
  try {
    // 初始化 LIFF（不管哪種 intent 都需要）
    const config = useRuntimeConfig();
    await liff.init({ liffId: config.public.liffId as string });

    if (!liff.isLoggedIn()) {
      // 重導向到 LINE 登入，帶回 intent 參數
      liff.login({ redirectUri: window.location.href });
      return;
    }

    const idToken = liff.getIDToken();
    if (!idToken) throw new Error("Failed to get LINE ID token");

    // === INTENT: link — 帳號綁定模式 ===
    if (isLinkIntent.value) {
      await firebaseAuth.linkWithLine(idToken);
      toast.add({
        severity: "success",
        summary: "LINE 綁定成功",
        detail: "已成功連結您的 LINE 帳號",
        life: 3000,
      });
      navigateTo("/profile");
      return;
    }

    // === 正常登入模式 ===
    const result = await firebaseAuth.loginWithLine();

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
      const authStore = useAuthStore();
      if (authStore.isAdmin) {
        navigateTo("/dashboard");
      } else {
        navigateTo("/");
      }
    }
  } catch (err: any) {
    const isLinkMode = isLinkIntent.value;
    toast.add({
      severity: "error",
      summary: isLinkMode ? "LINE 綁定失敗" : "LINE 登入失敗",
      detail: err.data?.message || err.message || "發生錯誤，請稍後再試",
      life: 4000,
    });
    navigateTo(isLinkMode ? "/profile" : "/login");
  } finally {
    loading.value = false;
  }
});

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <div class="flex flex-col w-full max-w-xl rounded-3xl shadow-2xl mx-4">
    <main
      class="flex flex-col items-center justify-center p-8 sm:p-12 text-center animate-fade-in animate-duration-500"
    >
      <div class="flex items-center justify-center w-20 h-20 mb-8">
        <img
          src="@/assets/icons/NHECC_ICON-01.png"
          alt="Logo"
          class="object-contain drop-shadow-sm"
        />
      </div>

      <ProgressSpinner
        class="w-12 h-12 mb-8 text-primary"
        strokeWidth="4"
        animationDuration="1s"
      />

      <h1
        class="text-xl font-bold tracking-wide text-slate-800 dark:text-white mb-3"
      >
        LINE 安全驗證中
      </h1>

      <p
        class="text-sm font-medium text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed"
      >
        正在與 LINE 伺服器連線以完成登入，請稍候片刻...
      </p>
    </main>
  </div>
</template>
