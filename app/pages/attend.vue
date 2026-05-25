<script setup lang="ts">
/**
 * /attend?token=xxx
 * 公開簽到確認頁（免登入可查看課程資訊）。
 * - 已登入：自動送出簽到
 * - 未登入：顯示課程資訊 + 「登入並完成簽到」按鈕
 */
import { useAuthStore } from '~/stores/auth.store'

definePageMeta({
  layout: 'auth-layout',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()
const { verifyAttendanceToken, submitAttendance, isSubmitting } = useCourseAttendance()

const token = computed(() => route.query.token as string | undefined)

interface VerifyResult {
  valid: boolean
  expired: boolean
  className?: string
  sessionDate?: string
  classId?: string
  sessionId?: string
}

const verifyResult = ref<VerifyResult | null>(null)
const isVerifying = ref(true)
const submitResult = ref<'success' | 'already' | 'not_member' | 'expired' | null>(null)

onMounted(async () => {
  if (!token.value) {
    verifyResult.value = { valid: false, expired: false }
    isVerifying.value = false
    return
  }

  try {
    verifyResult.value = await verifyAttendanceToken(token.value)
  } catch {
    verifyResult.value = { valid: false, expired: false }
  } finally {
    isVerifying.value = false
  }

  // 若 token 有效且已登入，自動簽到
  if (verifyResult.value?.valid && !verifyResult.value?.expired && authStore.userContext) {
    await doSubmit()
  }
})

async function doSubmit() {
  if (!token.value) return
  try {
    await submitAttendance(token.value)
    submitResult.value = 'success'
  } catch (e: any) {
    const msg: string = e.data?.message ?? e.message ?? ''
    if (msg.includes('已簽到') || e.statusCode === 200) {
      submitResult.value = 'already'
    } else if (msg.includes('不是此班級') || e.statusCode === 403) {
      submitResult.value = 'not_member'
    } else if (msg.includes('過期')) {
      submitResult.value = 'expired'
    } else {
      toast.add({ severity: 'error', summary: '簽到失敗', detail: msg, life: 4000 })
    }
  }
}

function goLogin() {
  router.push({ path: '/login', query: { redirect: route.fullPath } })
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
</script>

<template>
  <LayoutAuthCard>
    <div
      class="rounded-[56px] p-[0.3rem] bg-[linear-gradient(180deg,_var(--p-primary-color)_10%,_rgba(33,150,243,0)_30%)]"
    >
      <main
        class="bg-surface-0 dark:bg-surface-900 flex-1 flex flex-col p-6 sm:p-8 rounded-52px"
      >
        <!-- Loading -->
        <div v-if="isVerifying" class="flex flex-col items-center justify-center py-16 gap-4">
          <ProgressSpinner style="width: 56px; height: 56px" />
          <p class="font-bold text-slate-500 dark:text-surface-400">正在載入...</p>
        </div>

        <!-- Invalid token -->
        <div v-else-if="!verifyResult?.valid" class="flex flex-col items-center gap-5 py-8 text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/40">
            <i class="pi pi-times-circle text-4xl text-red-500" />
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-950 dark:text-white">無效的簽到連結</h1>
            <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
              此 QR Code 不存在或已失效，請向老師確認。
            </p>
          </div>
        </div>

        <!-- Expired token -->
        <div v-else-if="verifyResult?.expired" class="flex flex-col items-center gap-5 py-8 text-center">
          <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-amber-50 dark:bg-amber-950/40">
            <i class="pi pi-clock text-4xl text-amber-500" />
          </div>
          <div>
            <h1 class="text-2xl font-black text-slate-950 dark:text-white">簽到時間已截止</h1>
            <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
              本堂課程已結束，無法再進行簽到。
            </p>
          </div>
          <div class="w-full rounded-2xl bg-slate-50 dark:bg-surface-800 p-4 text-left">
            <p class="text-sm font-black text-slate-400 dark:text-surface-400">課程資訊</p>
            <p class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ verifyResult.className }}</p>
            <p class="mt-1 text-sm font-bold text-slate-500 dark:text-surface-400">{{ formatDateTime(verifyResult.sessionDate) }}</p>
          </div>
        </div>

        <!-- Valid token — 處理簽到結果 -->
        <template v-else>
          <!-- 簽到成功 -->
          <div v-if="submitResult === 'success'" class="flex flex-col items-center gap-5 py-8 text-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-50 dark:bg-emerald-950/40">
              <i class="pi pi-check-circle text-4xl text-emerald-500" />
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-950 dark:text-white">簽到成功！</h1>
              <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
                已記錄你的出席，感謝參與。
              </p>
            </div>
            <div class="w-full rounded-2xl bg-slate-50 dark:bg-surface-800 p-4 text-left">
              <p class="text-sm font-black text-slate-400 dark:text-surface-400">課程</p>
              <p class="mt-1 text-lg font-black text-slate-950 dark:text-white">{{ verifyResult.className }}</p>
              <p class="mt-1 text-sm font-bold text-slate-500 dark:text-surface-400">{{ formatDateTime(verifyResult.sessionDate) }}</p>
            </div>
            <NuxtLink
              v-if="verifyResult.classId"
              :to="`/learn/${verifyResult.classId}`"
              class="w-full"
            >
              <Button label="前往課程頁面" icon="pi pi-arrow-right" icon-pos="right" class="w-full" />
            </NuxtLink>
          </div>

          <!-- 已簽到過 -->
          <div v-else-if="submitResult === 'already'" class="flex flex-col items-center gap-5 py-8 text-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-blue-50 dark:bg-blue-950/40">
              <i class="pi pi-info-circle text-4xl text-blue-500" />
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-950 dark:text-white">你已簽到過了</h1>
              <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
                本堂課程的簽到紀錄已存在，無需重複操作。
              </p>
            </div>
            <NuxtLink v-if="verifyResult.classId" :to="`/learn/${verifyResult.classId}`" class="w-full">
              <Button label="前往課程頁面" outlined class="w-full" />
            </NuxtLink>
          </div>

          <!-- 非學員 -->
          <div v-else-if="submitResult === 'not_member'" class="flex flex-col items-center gap-5 py-8 text-center">
            <div class="flex h-20 w-20 items-center justify-center rounded-3xl bg-red-50 dark:bg-red-950/40">
              <i class="pi pi-ban text-4xl text-red-500" />
            </div>
            <div>
              <h1 class="text-2xl font-black text-slate-950 dark:text-white">你不是此班級的學員</h1>
              <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
                請確認你掃描的是正確的 QR Code。
              </p>
            </div>
          </div>

          <!-- 已登入 + 簽到中 -->
          <div v-else-if="authStore.userContext && isSubmitting" class="flex flex-col items-center justify-center py-16 gap-4">
            <ProgressSpinner style="width: 56px; height: 56px" />
            <p class="font-bold text-slate-500 dark:text-surface-400">正在完成簽到...</p>
          </div>

          <!-- 未登入 — 顯示課程資訊 + 登入引導 -->
          <div v-else class="flex flex-col gap-6">
            <div class="flex items-end justify-center">
              <div class="flex items-center justify-center w-16 h-16">
                <img src="@/assets/icons/NHECC_ICON-01.png" alt="Logo" class="object-contain" />
              </div>
            </div>

            <div class="text-center">
              <h1 class="text-2xl font-black text-slate-950 dark:text-white">課程簽到</h1>
              <p class="mt-2 text-sm font-semibold text-slate-500 dark:text-surface-400">
                請登入帳號以完成簽到
              </p>
            </div>

            <!-- 課程資訊卡 -->
            <div class="rounded-2xl bg-blue-50 border border-blue-100 dark:bg-blue-950/30 dark:border-blue-900/50 p-4">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
                  <i class="pi pi-graduation-cap" />
                </div>
                <div>
                  <p class="font-black text-slate-950 dark:text-white">{{ verifyResult.className }}</p>
                  <p class="text-xs font-bold text-slate-500 dark:text-surface-400">{{ formatDateTime(verifyResult.sessionDate) }}</p>
                </div>
              </div>
            </div>

            <Button
              label="登入並完成簽到"
              icon="pi pi-sign-in"
              class="w-full !text-lg !font-bold shadow-md shadow-surface-500"
              @click="goLogin"
            />
          </div>
        </template>
      </main>
    </div>
  </LayoutAuthCard>
</template>
