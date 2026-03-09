<script setup lang="ts">
/**
 * 個人頁面 (Profile Page)
 * 包含個人資訊摘要、管理員入口（若有權限）、以及功能選單。
 */

import { useAuthStore } from "~/stores/auth.store";
import { useToast } from "primevue/usetoast";
import googleIcon from "@/assets/icons/google.svg";
import lineIcon from "@/assets/icons/line.svg";

definePageMeta({
  layout: "default",
});

const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();
const {
  linkWithGoogle,
  unlinkProvider,
  linkedProviders,
  loading: authLoading,
} = useFirebaseAuth();

const user = computed(() => ({
  name: authStore.userContext?.fullName || "載入中...",
  email: authStore.userContext?.email || "",
  avatar: authStore.userContext?.avatar || null,
  isAdmin: authStore.isAdmin,
}));

const menuItems = [
  {
    label: "個人資料設定",
    icon: "pi pi-user",
    to: "/profile/settings",
  },
  {
    label: "重設密碼",
    icon: "pi pi-lock",
    to: "/profile/password",
  },
];

const { logout } = useFirebaseAuth();

const handleLogout = async () => {
  try {
    await logout();
    navigateTo("/login");
  } catch (error) {
    console.error("Logout failed:", error);
  }
};

const navigateToAdmin = () => {
  navigateTo("/dashboard");
};

const handleLinkGoogle = async () => {
  try {
    await linkWithGoogle();
    toast.add({
      severity: "success",
      summary: "Google 綁定成功",
      detail: "已成功連結 Google 帳號",
      life: 3000,
    });
  } catch (e: any) {
    const msg =
      e.data?.message ||
      (e.code === "auth/credential-already-in-use"
        ? "此 Google 帳號已被其他帳號使用"
        : "綁定失敗，請稍後再試");
    toast.add({
      severity: "error",
      summary: "Google 綁定失敗",
      detail: msg,
      life: 4000,
    });
  }
};

const handleUnlinkGoogle = async () => {
  try {
    await unlinkProvider("google");
    toast.add({
      severity: "success",
      summary: "已解除連結",
      detail: "Google 帳號已解除連結",
      life: 3000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "解除連結失敗",
      detail: e.data?.message || "請稍後再試",
      life: 4000,
    });
  }
};

const handleLinkLine = () => {
  navigateTo("/liff?intent=link");
};

const handleUnlinkLine = async () => {
  try {
    await unlinkProvider("line");
    toast.add({
      severity: "success",
      summary: "已解除連結",
      detail: "LINE 帳號已解除連結",
      life: 3000,
    });
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "解除連結失敗",
      detail: e.data?.message || "請稍後再試",
      life: 4000,
    });
  }
};

onMounted(() => {
  if (!authStore.isInitialized) {
    authStore.loadContext();
  }
});
</script>

<template>
  <div
    :class="[
      'flex flex-col md:grid md:grid-cols-12', // layout
      'w-full max-w-md md:max-w-4xl', // scaling
      'md:gap-8 md:items-start', // etc
    ]"
  >
    <!-- Left Column: Profile Info & Admin -->
    <div
      :class="[
        'col-span-12 md:col-span-5 flex flex-col gap-6', // layout
        'md:p-8', // spacing
        'md:bg-white md:dark:bg-slate-900', // colors
        'md:rounded-3xl', // border
        'md:shadow-sm', // shadow
      ]"
    >
      <!-- Profile Header -->
      <div
        :class="[
          'flex flex-col items-center', // layout
        ]"
      >
        <div
          :class="[
            'relative mb-4 rounded-full p-1',
            '!w-28 !h-28',
            'bg-white dark:bg-slate-800 shadow-sm',
          ]"
        >
          <Avatar
            :image="user.avatar || undefined"
            :icon="user.avatar ? undefined : 'pi pi-user'"
            size="xlarge"
            shape="circle"
            :class="[
              '!text-5xl', // font
              'w-full h-full',
              '!bg-primary-50 dark:!bg-slate-700', // colors
              '!text-primary-300 dark:!text-slate-400', // etc
            ]"
          />
        </div>
        <h1
          :class="[
            'text-2xl font-bold tracking-wide', // font
            'text-slate-900 dark:text-white', // colors
          ]"
        >
          {{ user.name }}
        </h1>
        <p
          :class="[
            'text-sm', // font
            'mt-1', // spacing
            'text-slate-500', // colors
          ]"
        >
          {{ user.email || "未設定信箱" }}
        </p>
      </div>

      <div
        v-if="user.isAdmin"
        :class="[
          'p-5', // spacing
          'w-full', // scaling
          'bg-blue-50 dark:bg-blue-900/10', // colors
          'rounded-2xl border border-blue-100 dark:border-blue-800/30', // border
        ]"
      >
        <div
          :class="[
            'flex items-start gap-4', // layout
            'mb-4', // spacing
          ]"
        >
          <div
            :class="[
              'flex items-center justify-center shrink-0', // layout
              'w-10 h-10', // scaling
              'bg-blue-500 text-white', // colors
              'rounded-full', // border
              'shadow-md shadow-blue-200 dark:shadow-none', // shadow
            ]"
          >
            <i class="pi pi-shield text-lg font-bold"></i>
          </div>
          <div>
            <h3
              :class="[
                'font-bold text-base', // font
                'mb-1', // spacing
                'text-slate-800 dark:text-blue-100', // colors
              ]"
            >
              管理員控制台
            </h3>
            <p
              :class="[
                'text-xs', // font
                'text-blue-600/80 dark:text-blue-300/80', // colors
              ]"
            >
              您擁有教務系統管理權限
            </p>
          </div>
        </div>
        <Button
          label="進入管理模式"
          @click="navigateToAdmin"
          :class="[
            '!text-sm !font-bold !text-white', // font
            '!py-2.5', // spacing
            '!w-full', // scaling
            '!bg-blue-600 hover:!bg-blue-700 !border-none', // border/color
            'shadow-lg shadow-blue-500/20', // shadow
            '!rounded-xl', // etc
          ]"
        />
      </div>
    </div>

    <!-- Right Column: Settings Menu -->
    <div
      :class="[
        'col-span-12 md:col-span-7 flex flex-col h-full justify-between', // layout
        'md:p-8', // spacing
        'md:min-h-[400px]', // scaling
        'md:bg-white md:dark:bg-slate-900', // colors
        'md:rounded-3xl', // border
        'md:shadow-sm', // shadow
      ]"
    >
      <div
        :class="[
          'w-full flex flex-col gap-2', // layout
          'mt-8 md:mt-0', // spacing
        ]"
      >
        <h2
          :class="[
            'hidden md:block text-lg font-bold', // font
            'mb-4', // spacing
            'text-slate-800 dark:text-white', // colors
          ]"
        >
          帳號設定
        </h2>

        <NuxtLink
          v-for="item in menuItems"
          :key="item.label"
          :to="item.to"
          :class="[
            'flex items-center justify-between', // layout
            'p-4', // spacing
            'transition-all duration-200', // animation
            'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/50', // colors
            'rounded-xl md:border md:border-slate-100 md:dark:border-slate-800', // border
            'active:scale-[0.99]', // etc
          ]"
        >
          <div
            :class="[
              'flex items-center gap-4', // layout
            ]"
          >
            <div
              :class="[
                'flex items-center justify-center shrink-0', // layout
                'w-10 h-10', // scaling
                'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400', // color
                'md:bg-primary-50 md:text-primary md:dark:bg-slate-800 md:dark:text-slate-300 font-bold', // md color/font
                'rounded-full', // border
              ]"
            >
              <i
                :class="[
                  item.icon, // etc
                  'text-lg', // font
                ]"
              ></i>
            </div>
            <span
              :class="[
                'text-base font-medium', // font
                'text-slate-700 dark:text-slate-200', // colors
              ]"
            >
              {{ item.label }}
            </span>
          </div>
          <i
            :class="[
              'pi pi-chevron-right', // etc
              'text-xs', // font
              'text-slate-300 dark:text-slate-600', // colors
            ]"
          ></i>
        </NuxtLink>

        <!-- 連結帳號區塊 -->
        <div class="mt-4">
          <h2
            :class="[
              'text-sm font-semibold uppercase tracking-wider',
              'mb-3 px-1',
              'text-slate-400 dark:text-slate-500',
            ]"
          >
            連結帳號
          </h2>
          <div class="flex flex-col gap-2">
            <LinkedAccountItem
              :icon="googleIcon"
              label="Google"
              :linked="linkedProviders.google"
              :loading="authLoading"
              :can-unlink="linkedProviders.line || linkedProviders.email"
              @link="handleLinkGoogle"
              @unlink="handleUnlinkGoogle"
            />
            <LinkedAccountItem
              :icon="lineIcon"
              label="LINE"
              :linked="linkedProviders.line"
              :loading="authLoading"
              :can-unlink="linkedProviders.google || linkedProviders.email"
              @link="handleLinkLine"
              @unlink="handleUnlinkLine"
            />
          </div>
        </div>
      </div>

      <!-- Logout -->
      <div
        :class="[
          'mt-12 mb-4', // spacing
          'md:mt-auto md:mb-0 md:pt-8', // md spacing
          'md:border-t md:border-slate-50 md:dark:border-slate-800', // border
        ]"
      >
        <Button
          label="登出帳號"
          link
          @click="handleLogout"
          :class="[
            '!text-sm !font-medium', // font
            '!underline-offset-4 hover:!underline', // etc
            '!text-slate-400 hover:!text-slate-600 dark:!text-slate-500 dark:hover:!text-slate-300', // colors
            'md:!w-full md:!text-red-500 md:hover:!text-red-600 md:!no-underline md:!bg-red-50 md:dark:!bg-red-900/10 md:!py-3 md:!rounded-xl', // md overrides
          ]"
        />
      </div>
    </div>
  </div>
</template>
