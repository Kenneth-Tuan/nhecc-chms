<script setup lang="ts">
/**
 * 預設佈局 (Default Layout)
 * 包含響應式導航欄：
 * - Mobile/Tablet: Bottom Navigation Bar (大字體、大 Icon)
 * - Desktop: Sidebar
 */

const route = useRoute();

const menuItems = [
  { label: "首頁", icon: "pi pi-home", to: "/" },
  { label: "探索", icon: "pi pi-compass", to: "/explore" },
  { label: "學習", icon: "pi pi-book", to: "/learn" },
  { label: "個人", icon: "pi pi-user", to: "/profile" },
];

const isActive = (path: string) => route.path === path;
</script>

<template>
  <div
    :class="[
      'min-h-screen flex transition-colors duration-300',
      'bg-slate-50 dark:bg-slate-950',
      'text-slate-900 dark:text-slate-100',
    ]"
  >
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        'hidden md:flex flex-col w-72 h-screen fixed left-0 top-0 z-30 shadow-sm',
        'bg-white dark:bg-slate-900',
        'border-r border-slate-200 dark:border-slate-800',
      ]"
    >
      <div
        :class="[
          'p-6 flex items-center justify-start',
          'border-b border-slate-100 dark:border-slate-800/50',
        ]"
      >
        <div class="w-12 h-12 flex items-center justify-center mr-3">
          <img
            src="@/assets/icons/NHECC_ICON-01.png"
            alt="Logo"
            class="object-contain"
          />
        </div>
        <div>
          <h1
            :class="[
              'font-bold text-lg leading-tight',
              'text-slate-800 dark:text-white',
            ]"
          >
            教會學習平台
          </h1>
          <p class="text-xs text-slate-500 dark:text-slate-400">
            NHECC Learning
          </p>
        </div>
      </div>

      <div class="flex-1 p-4 overflow-y-auto">
        <Menu :model="menuItems" class="!w-full !border-none !bg-transparent">
          <template #item="{ item, props }">
            <NuxtLink
              v-if="item.to"
              :to="item.to"
              v-bind="props.action"
              :class="[
                'flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group',
                'hover:bg-slate-50 dark:hover:bg-slate-800',
                isActive(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-bold'
                  : 'text-slate-600 dark:text-slate-400 font-medium',
              ]"
            >
              <i
                :class="[
                  item.icon,
                  'text-2xl transition-colors',
                  isActive(item.to)
                    ? 'text-primary'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300',
                ]"
              />
              <span class="text-base">{{ item.label }}</span>
            </NuxtLink>
          </template>
        </Menu>
      </div>

      <div class="p-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          :class="[
            '!w-full !px-4 !py-3 !rounded-xl !flex !items-center !gap-3 !text-left !shadow-none !transition-colors !border-none',
            '!bg-transparent hover:!bg-slate-50 dark:hover:!bg-slate-800',
          ]"
        >
          <Avatar
            icon="pi pi-user"
            shape="circle"
            class="!bg-slate-200 dark:!bg-slate-700 !text-slate-500"
          />
          <div class="flex-1 min-w-0 flex flex-col items-start">
            <p
              :class="[
                'text-sm font-bold truncate',
                'text-slate-900 dark:text-white',
              ]"
            >
              用戶名稱
            </p>
            <p class="text-xs text-slate-500 truncate">user@example.com</p>
          </div>
          <i class="pi pi-sign-out text-slate-400"></i>
        </Button>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      :class="[
        'flex-1 w-full min-h-screen transition-all duration-300',
        'md:pl-76 md:pb-0',
        'pb-[88px]',
        'pt-4 px-4',
      ]"
    >
      <slot />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav
      :class="[
        'md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]',
        'bg-white dark:bg-slate-900',
        'border-t border-slate-200 dark:border-slate-800',
      ]"
    >
      <div class="grid grid-cols-4 h-[72px]">
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex flex-col items-center justify-center gap-1 active:scale-95 transition-transform',
            isActive(item.to)
              ? 'text-primary'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300',
          ]"
        >
          <div
            :class="[
              'rounded-2xl px-5 py-1 transition-colors duration-300',
              isActive(item.to)
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-transparent',
            ]"
          >
            <i :class="[item.icon, 'text-2xl']"></i>
          </div>
          <span class="text-[11px] font-bold tracking-wide">{{
            item.label
          }}</span>
        </NuxtLink>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 20px);
}
.pt-safe {
  padding-top: env(safe-area-inset-top, 20px);
}
</style>
