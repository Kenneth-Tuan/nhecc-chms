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
      'flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300',
    ]"
  >
    <!-- Desktop Sidebar -->
    <aside
      :class="[
        'hidden md:flex flex-col',
        'fixed left-0 top-0 z-30',
        'w-72 h-screen',
        'bg-white dark:bg-slate-900',
        'border-r border-slate-200 dark:border-slate-800',
        'shadow-sm',
      ]"
    >
      <div
        :class="[
          'flex items-center justify-start', // layout
          'p-6', // spacing
          'border-b border-slate-100 dark:border-slate-800/50', // border
        ]"
      >
        <div
          :class="[
            'flex items-center justify-center', // layout
            'mr-3', // spacing
            'w-12 h-12', // scaling
          ]"
        >
          <img
            src="@/assets/icons/NHECC_ICON-01.png"
            alt="Logo"
            class="object-contain"
          />
        </div>
        <div>
          <h1
            :class="[
              'font-bold text-lg leading-tight', // font
              'text-slate-800 dark:text-white', // colors
            ]"
          >
            內行學習平台
          </h1>
          <p
            :class="[
              'text-xs', // font
              'text-slate-500 dark:text-slate-400', // colors
            ]"
          >
            NHECC Learning
          </p>
        </div>
      </div>

      <div
        :class="[
          'flex-1', // layout
          'p-4', // spacing
          'overflow-y-auto', // position
        ]"
      >
        <Menu
          :model="menuItems"
          :class="[
            '!w-full', // scaling
            '!border-none !bg-transparent', // border/colors
          ]"
        >
          <template #item="{ item, props }">
            <NuxtLink
              v-if="item.to"
              :to="item.to"
              v-bind="props.action"
              :class="[
                'flex items-center gap-4', // layout
                'px-4 py-3.5', // spacing
                'rounded-xl', // border
                'transition-all duration-200 group', // animation
                'hover:bg-slate-50 dark:hover:bg-slate-800', // etc (hover)
                isActive(item.to)
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary font-bold'
                  : 'text-slate-600 dark:text-slate-400 font-medium', // dynamic
              ]"
            >
              <i
                :class="[
                  'text-2xl', // font
                  'transition-colors', // animation
                  item.icon,
                  isActive(item.to)
                    ? 'text-primary'
                    : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300', // dynamic colors
                ]"
              />
              <span
                :class="[
                  'text-base', // font
                ]"
                >{{ item.label }}</span
              >
            </NuxtLink>
          </template>
        </Menu>
      </div>

      <div
        :class="[
          'p-4', // spacing
          'border-t border-slate-100 dark:border-slate-800', // border
        ]"
      >
        <Button
          :class="[
            '!flex !items-center !gap-3', // layout
            '!px-4 !py-3', // spacing
            '!w-full', // scaling
            '!border-none !bg-transparent', // border/colors
            '!shadow-none !transition-colors', // shadow/animation
            'hover:!bg-slate-50 dark:hover:!bg-slate-800', // etc
          ]"
        >
          <Avatar
            icon="pi pi-user"
            shape="circle"
            :class="[
              '!bg-slate-200 dark:!bg-slate-700 !text-slate-500', // colors
            ]"
          />
          <div
            :class="[
              'flex-1 flex flex-col items-start', // layout
              'min-w-0', // scaling
            ]"
          >
            <p
              :class="[
                'text-sm font-bold', // font
                'truncate', // position
                'text-slate-900 dark:text-white', // colors
              ]"
            >
              用戶名稱
            </p>
            <p
              :class="[
                'text-xs', // font
                'truncate', // position
                'text-slate-500', // colors
              ]"
            >
              user@example.com
            </p>
          </div>
          <ColorModeButton />
          <i
            :class="[
              'pi pi-sign-out', // etc
              'text-slate-400', // colors
            ]"
          ></i>
        </Button>
      </div>
    </aside>

    <!-- Main Content -->
    <main
      :class="[
        'flex-1', // layout
        'pt-4 px-4 pb-[88px] md:pb-0 md:pl-76', // spacing
        'w-full min-h-screen', // scaling
        'transition-all duration-300', // animation
      ]"
    >
      <slot />
    </main>

    <!-- Mobile Bottom Navigation -->
    <nav
      :class="[
        'md:hidden', // layout
        'fixed bottom-0 left-0 right-0 z-40', // position
        'pb-safe', // spacing
        'bg-white dark:bg-slate-900', // colors
        'border-t border-slate-200 dark:border-slate-800', // border
        'shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.1)]', // shadow
      ]"
    >
      <div
        :class="[
          'grid grid-cols-4', // layout
          'h-[72px]', // scaling
        ]"
      >
        <NuxtLink
          v-for="item in menuItems"
          :key="item.to"
          :to="item.to"
          :class="[
            'flex flex-col items-center justify-center gap-1', // layout
            'active:scale-95 transition-transform', // animation
            isActive(item.to)
              ? 'text-primary'
              : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300', // dynamic colors
          ]"
        >
          <div
            :class="[
              'px-5 py-1', // spacing
              'rounded-2xl', // border
              'transition-colors duration-300', // animation
              isActive(item.to)
                ? 'bg-primary-50 dark:bg-primary-900/20'
                : 'bg-transparent', // dynamic colors
            ]"
          >
            <i
              :class="[
                item.icon,
                'text-2xl', // font
              ]"
            ></i>
          </div>
          <span
            :class="[
              'text-[11px] font-bold tracking-wide', // font
            ]"
            >{{ item.label }}</span
          >
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
