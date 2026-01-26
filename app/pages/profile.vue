<script setup lang="ts">
/**
 * 個人頁面 (Profile Page)
 * 包含個人資訊摘要、管理員入口（若有權限）、以及功能選單。
 */

const user = ref({
  name: "提摩太弟兄",
  avatar: null, // 測試用，若有圖片 URL 可填入
  isAdmin: true, // 模擬管理員權限
});

const menuItems = [
  {
    label: "個人資料設定",
    icon: "pi pi-user",
    to: "/profile/settings",
  },
  {
    label: "學習旅程", // 原修課歷史紀錄
    icon: "pi pi-history",
    to: "/profile/learning-journey",
  },
  {
    label: "修改密碼",
    icon: "pi pi-lock",
    to: "/profile/change-password",
  },
  {
    label: "幫助與支援",
    icon: "pi pi-question-circle",
    to: "/support",
  },
];

const handleLogout = () => {
  // 實作登出邏輯
  console.log("Logout clicked");
  navigateTo("/login");
};

const navigateToAdmin = () => {
  // 導向管理後台
  console.log("Navigate to Admin Console");
};
</script>

<template>
  <div
    :class="[
      'w-full max-w-md md:max-w-4xl',
      'flex flex-col md:grid md:grid-cols-12 md:gap-8 md:items-start',
    ]"
  >
    <!-- Left Column: Profile Info & Admin -->
    <div
      :class="[
        'col-span-12 md:col-span-5',
        'flex flex-col gap-6',
        'md:bg-white md:dark:bg-slate-900 md:p-8 md:rounded-3xl md:shadow-sm',
      ]"
    >
      <!-- Profile Header -->
      <div :class="['flex flex-col items-center']">
        <div
          :class="[
            'relative mb-4 rounded-full p-1',
            'bg-white dark:bg-slate-800 shadow-sm',
          ]"
        >
          <Avatar
            :image="user.avatar || undefined"
            :icon="user.avatar ? undefined : 'pi pi-user'"
            size="xlarge"
            shape="circle"
            :class="[
              '!w-28 !h-28',
              '!bg-primary-50 dark:!bg-slate-700',
              '!text-primary-300 dark:!text-slate-400',
              '!text-5xl',
            ]"
          />
        </div>
        <h1
          :class="[
            'text-2xl font-bold tracking-wide',
            'text-slate-900 dark:text-white',
          ]"
        >
          {{ user.name }}
        </h1>
        <p :class="['text-sm text-slate-500 mt-1']">user@example.com</p>
      </div>

      <!-- Admin Console Card (Conditional) -->
      <div
        v-if="user.isAdmin"
        :class="[
          'w-full p-5 rounded-2xl',
          'bg-blue-50 dark:bg-blue-900/10',
          'border border-blue-100 dark:border-blue-800/30',
        ]"
      >
        <div :class="['flex items-start gap-4 mb-4']">
          <div
            :class="[
              'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
              'bg-blue-500 text-white shadow-md shadow-blue-200 dark:shadow-none',
            ]"
          >
            <i class="pi pi-shield text-lg font-bold"></i>
          </div>
          <div>
            <h3
              :class="[
                'font-bold text-base mb-1',
                'text-slate-800 dark:text-blue-100',
              ]"
            >
              管理員控制台
            </h3>
            <p :class="['text-xs', 'text-blue-600/80 dark:text-blue-300/80']">
              您擁有教務系統管理權限
            </p>
          </div>
        </div>
        <Button
          label="進入管理模式"
          @click="navigateToAdmin"
          :class="[
            '!w-full !rounded-xl !font-bold !py-2.5 !text-sm',
            '!bg-blue-600 hover:!bg-blue-700 !border-none',
            'shadow-lg shadow-blue-500/20',
          ]"
        />
      </div>
    </div>

    <!-- Right Column: Settings Menu -->
    <div
      :class="[
        'col-span-12 md:col-span-7',
        'flex flex-col h-full justify-between',
        'md:bg-white md:dark:bg-slate-900 md:p-8 md:rounded-3xl md:shadow-sm md:min-h-[400px]',
      ]"
    >
      <div :class="['w-full flex flex-col gap-2 mt-8 md:mt-0']">
        <h2
          :class="[
            'hidden md:block mb-4 text-lg font-bold',
            'text-slate-800 dark:text-white',
          ]"
        >
          帳號設定
        </h2>

        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex items-center justify-between p-4 rounded-xl transition-all duration-200',
            'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50',
            'active:scale-[0.99]',
            'md:border md:border-slate-100 md:dark:border-slate-800',
          ]"
        >
          <div :class="['flex items-center gap-4']">
            <div
              :class="[
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
                'md:bg-primary-50 md:text-primary md:dark:bg-slate-800 md:dark:text-slate-300',
              ]"
            >
              <i :class="[item.icon, 'text-lg']"></i>
            </div>
            <span
              :class="[
                'text-base font-medium',
                'text-slate-700 dark:text-slate-200',
              ]"
            >
              {{ item.label }}
            </span>
          </div>
          <i
            :class="[
              'pi pi-chevron-right text-xs',
              'text-slate-300 dark:text-slate-600',
            ]"
          ></i>
        </NuxtLink>
      </div>

      <!-- Logout -->
      <div
        :class="[
          'mt-12 mb-4 md:mt-auto md:mb-0 md:pt-8 md:border-t md:border-slate-50 md:dark:border-slate-800',
        ]"
      >
        <Button
          label="登出帳號"
          link
          @click="handleLogout"
          :class="[
            '!text-slate-400 hover:!text-slate-600 dark:!text-slate-500 dark:hover:!text-slate-300',
            '!text-sm !font-medium !underline-offset-4 hover:!underline',
            'md:!w-full md:!text-red-500 md:hover:!text-red-600 md:!no-underline md:!bg-red-50 md:dark:!bg-red-900/10 md:!py-3 md:!rounded-xl',
          ]"
        />
      </div>
    </div>
  </div>
</template>
