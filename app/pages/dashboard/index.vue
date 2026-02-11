<script setup lang="ts">
/**
 * Dashboard Home Page
 */
definePageMeta({
  layout: 'dashboard',
});

const auth = useAuth();
</script>

<template>
  <div>
    <h1 class="text-2xl font-bold mb-6">儀表板</h1>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
            <i class="pi pi-users text-primary text-lg" />
          </div>
          <span class="text-sm text-slate-500 dark:text-slate-400">會友總數</span>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">--</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
            <i class="pi pi-check-circle text-green-500 text-lg" />
          </div>
          <span class="text-sm text-slate-500 dark:text-slate-400">啟用會友</span>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">--</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
            <i class="pi pi-sitemap text-amber-500 text-lg" />
          </div>
          <span class="text-sm text-slate-500 dark:text-slate-400">牧區數量</span>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">--</p>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <i class="pi pi-shield text-purple-500 text-lg" />
          </div>
          <span class="text-sm text-slate-500 dark:text-slate-400">角色數量</span>
        </div>
        <p class="text-3xl font-bold text-slate-900 dark:text-white">--</p>
      </div>
    </div>

    <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
      <h2 class="text-lg font-semibold mb-4">歡迎使用 NHECC ChMS</h2>
      <p class="text-slate-600 dark:text-slate-400">
        您目前以 <strong>{{ auth.currentUserName.value }}</strong> 身分登入，
        資料範圍為 <Tag :value="auth.currentScope.value" severity="info" class="!text-xs" />。
      </p>
      <p class="text-slate-500 dark:text-slate-500 mt-2 text-sm">
        使用頂部的 DEV 工具列可以切換不同角色的測試用戶，以驗證各角色的權限表現。
      </p>
    </div>
  </div>
</template>
