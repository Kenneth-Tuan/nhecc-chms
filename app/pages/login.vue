<script setup lang="ts">
/**
 * 登入頁面
 * 支援 320px 最小寬度，採用 PrimeVue 與 UnoCSS 實作。
 */

const formData = ref({
  account: "",
  password: "",
  rememberMe: false,
});

const loading = ref(false);

const handleLogin = async () => {
  loading.value = true;
  // 模擬登入延遲
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Login attempt", formData.value);
  loading.value = false;
  // 導向首頁
  navigateTo("/");
};

const handleSocialLogin = (provider: string) => {
  console.log(`Social login with ${provider}`);
};

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <div
    :class="[
      'flex flex-col',
      'overflow-hidden',
      'w-full max-w-[420px] min-h-[700px]',
      'bg-white dark:bg-slate-900',
      'rounded-3xl',
      'shadow-2xl',
    ]"
  >
    <main
      :class="[
        'flex-1 flex flex-col', // layout
        'p-6 sm:p-8', // spacing
      ]"
    >
      <!-- Header -->
      <div
        :class="[
          'text-center', // layout
          'mt-4 mb-8', // spacing
        ]"
      >
        <div
          :class="[
            'flex items-center justify-center', // layout
            'mx-auto mb-4', // spacing
            'w-20 h-20', // scaling
          ]"
        >
          <img
            src="@/assets/icons/NHECC_ICON-01.png"
            alt="Logo"
            :class="[
              'object-contain', // etc
            ]"
          />
        </div>
        <h1
          :class="[
            'text-2xl font-bold', // font
            'text-slate-800 dark:text-white', // colors
          ]"
        >
          歡迎回來
        </h1>
        <p
          :class="[
            'text-sm', // font
            'mt-2', // spacing
            'text-slate-500 dark:text-slate-400', // colors
          ]"
        >
          請登入您的帳號以繼續使用
        </p>
      </div>

      <!-- Form -->
      <form
        :class="[
          'space-y-6', // spacing
        ]"
        @submit.prevent="handleLogin"
      >
        <div
          :class="[
            'space-y-4', // spacing
          ]"
        >
          <div
            :class="[
              'flex flex-col gap-2', // layout
            ]"
          >
            <label
              :class="[
                'text-sm font-semibold', // font
                'ml-1', // spacing
                'text-slate-700 dark:text-slate-300', // colors
              ]"
              >帳號</label
            >
            <InputText
              v-model="formData.account"
              placeholder="Email 或 手機號碼"
              :class="[
                'py-3 px-4', // spacing
                'rounded-xl', // border
              ]"
              style="
                --p-inputtext-padding-x: 1rem;
                --p-inputtext-padding-y: 0.75rem;
              "
              fluid
            />
          </div>

          <div
            :class="[
              'flex flex-col gap-2', // layout
            ]"
          >
            <div
              :class="[
                'flex justify-between items-center', // layout
                'px-1', // spacing
              ]"
            >
              <label
                :class="[
                  'text-sm font-semibold', // font
                  'text-slate-700 dark:text-slate-300', // colors
                ]"
                >密碼</label
              >
              <NuxtLink
                to="#"
                :class="[
                  'text-xs font-medium', // font
                  'text-primary', // colors
                  'hover:underline', // etc
                ]"
                >忘記密碼？</NuxtLink
              >
            </div>
            <Password
              v-model="formData.password"
              placeholder="請輸入密碼"
              toggleMask
              :feedback="false"
              fluid
              :class="[
                'w-full', // scaling
              ]"
              :input-class="[
                '!py-3 !px-4 !w-full', // spacing/scaling
                '!rounded-xl', // border
              ]"
            />
          </div>

          <div
            :class="[
              'flex items-center gap-2', // layout
              'px-1', // spacing
            ]"
          >
            <Checkbox
              v-model="formData.rememberMe"
              binary
              inputId="rememberMe"
            />
            <label
              for="rememberMe"
              :class="[
                'text-sm', // font
                'text-slate-600 dark:text-slate-400', // colors
                'cursor-pointer', // etc
              ]"
              >記住我</label
            >
          </div>
        </div>

        <Button
          label="立即登入"
          type="submit"
          :loading="loading"
          :class="[
            '!text-lg !font-bold', // font
            '!w-full', // scaling
            'transition-all hover:scale-[1.01] active:scale-98', // animation
            'shadow-md shadow-surface-500', // shadow
          ]"
        />
      </form>

      <!-- Divider -->
      <div
        :class="[
          'text-center', // layout
          'relative', // position
          'my-8', // spacing
        ]"
      >
        <div
          :class="[
            'flex items-center', // layout
            'absolute inset-0', // position
          ]"
        >
          <div
            :class="[
              'w-full', // scaling
              'border-t border-slate-200 dark:border-slate-800', // border
            ]"
          ></div>
        </div>
        <span
          :class="[
            'text-xs font-medium uppercase tracking-widest', // font
            'relative', // position
            'px-4', // spacing
            'bg-white dark:bg-slate-900', // colors
            'text-slate-400', // etc
          ]"
        >
          或使用社交帳號登入
        </span>
      </div>

      <!-- Social Login -->
      <div
        :class="[
          'grid grid-cols-2 gap-4', // layout
        ]"
      >
        <Button
          severity="secondary"
          outlined
          :class="[
            'flex items-center justify-center gap-2',
            '!rounded-xl',
            'shadow-md shadow-surface-200',
          ]"
          @click="handleSocialLogin('line')"
        >
          <img
            src="@/assets/icons/line.svg"
            alt="Line"
            :class="['w-10 h-10']"
          />
          <span :class="['font-bold', 'text-slate-700 dark:text-slate-200']"
            >LINE</span
          >
        </Button>

        <Button
          severity="secondary"
          outlined
          :class="[
            'flex items-center justify-center gap-2',
            '!rounded-xl',
            'shadow-md shadow-surface-200',
          ]"
          @click="handleSocialLogin('google')"
        >
          <img
            src="@/assets/icons/google.svg"
            alt="Google"
            :class="['w-10 h-10']"
          />
          <span :class="['font-bold', 'text-slate-700 dark:text-slate-200']"
            >Google</span
          >
        </Button>
      </div>

      <!-- Footer -->
      <div
        :class="[
          'text-center', // layout
          'mt-auto pt-8', // spacing
        ]"
      >
        <p
          :class="[
            'text-sm', // font
            'text-slate-500 dark:text-slate-400', // colors
          ]"
        >
          還沒有帳號？
          <NuxtLink
            to="/register"
            :class="[
              'font-bold', // font
              'text-primary', // colors
              'hover:underline', // etc
            ]"
            >立即註冊</NuxtLink
          >
        </p>
        <div
          :class="[
            'flex justify-center gap-4', // layout
            'mt-4', // spacing
          ]"
        >
          <NuxtLink
            to="#"
            :class="[
              'text-[11px]', // font
              'text-slate-400 hover:text-slate-600', // colors
              'underline', // etc
            ]"
            >服務條款</NuxtLink
          >
          <NuxtLink
            to="#"
            :class="[
              'text-[11px]', // font
              'text-slate-400 hover:text-slate-600', // colors
              'underline', // etc
            ]"
            >隱私政策</NuxtLink
          >
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped></style>
