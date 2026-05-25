<script setup lang="ts">
import QRCode from 'qrcode'
import type { ClassSession } from '~/types/course-class'

const props = defineProps<{
  visible: boolean
  classId: string
  sessions: ClassSession[]
  initialSessionId?: string | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const toast = useToast()
const { getAttendanceQrCode } = useCourseAttendance()

const selectedSessionId = ref<string | null>(props.initialSessionId ?? null)
const qrDataUrl = ref<string | null>(null)
const qrUrl = ref<string | null>(null)
const isLoadingQr = ref(false)

const sortedSessions = computed(() =>
  [...props.sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  ),
)

const sessionOptions = computed(() =>
  sortedSessions.value.map((s, i) => ({
    label: `第 ${i + 1} 堂｜${formatDateTime(s.startTime)}`,
    value: s.sessionId,
  })),
)

watch(
  () => props.visible,
  async (v) => {
    if (v) {
      if (!selectedSessionId.value && sortedSessions.value.length) {
        const now = Date.now()
        const current = sortedSessions.value.find(s => new Date(s.endTime).getTime() >= now)
        selectedSessionId.value = (current ?? sortedSessions.value[0]).sessionId
      }
      await generateQr()
    }
  },
)

watch(selectedSessionId, async (id) => {
  if (id && props.visible) await generateQr()
})

async function generateQr() {
  if (!selectedSessionId.value) return
  isLoadingQr.value = true
  qrDataUrl.value = null
  try {
    const { url } = await getAttendanceQrCode(props.classId, selectedSessionId.value)
    qrUrl.value = url
    qrDataUrl.value = await QRCode.toDataURL(url, {
      width: 280,
      margin: 2,
      color: { dark: '#0f172a', light: '#ffffff' },
    })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: 'QR Code 產生失敗', detail: e.data?.message ?? e.message, life: 4000 })
  } finally {
    isLoadingQr.value = false
  }
}

function formatDateTime(value?: string) {
  if (!value) return '—'
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function copyUrl() {
  if (!qrUrl.value) return
  navigator.clipboard.writeText(qrUrl.value)
  toast.add({ severity: 'success', summary: '已複製連結', life: 2000 })
}
</script>

<template>
  <Dialog
    :visible="visible"
    header="課堂簽到 QR Code"
    modal
    :draggable="false"
    class="w-full max-w-md"
    @update:visible="emit('update:visible', $event)"
  >
    <div class="flex flex-col gap-5">
      <!-- Session 選擇 -->
      <div v-if="sessionOptions.length > 1">
        <label class="mb-2 block text-sm font-bold text-slate-600 dark:text-surface-300">選擇堂次</label>
        <Select
          v-model="selectedSessionId"
          :options="sessionOptions"
          option-label="label"
          option-value="value"
          class="w-full"
        />
      </div>

      <!-- QR Code 顯示 -->
      <div class="flex flex-col items-center gap-4 rounded-2xl bg-slate-50 p-6 dark:bg-surface-800">
        <div v-if="isLoadingQr" class="flex h-[280px] items-center justify-center">
          <ProgressSpinner style="width: 48px; height: 48px" />
        </div>
        <img
          v-else-if="qrDataUrl"
          :src="qrDataUrl"
          alt="簽到 QR Code"
          class="h-[280px] w-[280px] rounded-xl"
        />
        <div
          v-else
          class="flex h-[280px] w-[280px] items-center justify-center rounded-xl bg-slate-200 dark:bg-surface-700"
        >
          <i class="pi pi-qrcode text-5xl text-slate-400" />
        </div>

        <p class="text-center text-sm font-bold text-slate-500 dark:text-surface-400">
          學員掃描後會直接進入簽到頁面<br />有效期至本堂課程結束
        </p>
      </div>

      <!-- 複製連結 -->
      <Button
        v-if="qrUrl"
        label="複製簽到連結"
        icon="pi pi-copy"
        outlined
        class="w-full"
        @click="copyUrl"
      />
    </div>
  </Dialog>
</template>
