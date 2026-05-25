<script setup lang="ts">
import type { ClassSession } from '~/types/course-class'
import type { AttendanceStatus, CourseAttendance } from '~/types/course-attendance'

const props = defineProps<{
  classId: string
  sessions: ClassSession[]
  canEdit: boolean
  studentOnly?: string // 若傳入 userId，只顯示該學生自己的紀錄
}>()

const toast = useToast()
const { fetchClassAttendance, fetchMyAttendance, updateAttendanceStatus, isUpdating } =
  useCourseAttendance()

// --- Session 選擇 ---
const selectedSessionId = ref<string | null>(null)

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

// 預設選最近 session
onMounted(() => {
  if (sortedSessions.value.length) {
    const now = Date.now()
    const current = sortedSessions.value.find(s => new Date(s.endTime).getTime() >= now)
    selectedSessionId.value = (current ?? sortedSessions.value[0])?.sessionId ?? null
  }
  loadAttendance()
})

watch(selectedSessionId, loadAttendance)

// --- 出席資料 ---
const attendances = ref<CourseAttendance[]>([])
const isLoading = ref(false)

async function loadAttendance() {
  if (!props.classId) return
  isLoading.value = true
  try {
    if (props.studentOnly) {
      const all = await fetchMyAttendance(props.classId)
      attendances.value = all
    } else {
      attendances.value = await fetchClassAttendance(
        props.classId,
        selectedSessionId.value ?? undefined,
      )
    }
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '載入失敗', detail: e.data?.message ?? e.message, life: 3000 })
  } finally {
    isLoading.value = false
  }
}

// 計算出席率（教師模式：選取 session；學生模式：全期）
const attendanceRate = computed(() => {
  if (!attendances.value.length) return null
  const present = attendances.value.filter(a => a.status === 'PRESENT').length
  return Math.round((present / attendances.value.length) * 100)
})

// --- 教師模式：inline 編輯 ---
const statusOptions = [
  { label: '出席', value: 'PRESENT' },
  { label: '缺席', value: 'ABSENT' },
  { label: '請假', value: 'EXCUSED' },
]

async function handleStatusChange(attendance: CourseAttendance, newStatus: AttendanceStatus) {
  try {
    const updated = await updateAttendanceStatus(props.classId, attendance.id, newStatus)
    const idx = attendances.value.findIndex(a => a.id === attendance.id)
    if (idx !== -1) attendances.value[idx] = updated
    toast.add({ severity: 'success', summary: '已更新', life: 2000 })
  } catch (e: any) {
    toast.add({ severity: 'error', summary: '更新失敗', detail: e.data?.message ?? e.message, life: 3000 })
  }
}

// --- 學生模式：顯示某 session 對應的紀錄 ---
function getSessionLabel(sessionId: string) {
  const idx = sortedSessions.value.findIndex(s => s.sessionId === sessionId)
  if (idx === -1) return '未知堂次'
  return `第 ${idx + 1} 堂｜${formatDateTime(sortedSessions.value[idx]?.startTime)}`
}

// --- UI helpers ---
type TagSeverity = 'success' | 'danger' | 'warn' | 'secondary' | 'info'

function getStatusLabel(status: AttendanceStatus) {
  if (status === 'PRESENT') return '出席'
  if (status === 'ABSENT') return '缺席'
  if (status === 'EXCUSED') return '請假'
  return status
}

function getStatusSeverity(status: AttendanceStatus): TagSeverity {
  if (status === 'PRESENT') return 'success'
  if (status === 'ABSENT') return 'danger'
  if (status === 'EXCUSED') return 'warn'
  return 'secondary'
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
</script>

<template>
  <div class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
    <!-- Header -->
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div>
        <p class="text-sm font-black text-blue-600 dark:text-blue-400">ATTENDANCE</p>
        <h2 class="mt-1 text-2xl font-black text-slate-950 dark:text-white">
          {{ studentOnly ? '我的出席紀錄' : '出席管理' }}
        </h2>
      </div>

      <!-- Session 下拉（教師模式） -->
      <Select
        v-if="!studentOnly && sessionOptions.length"
        v-model="selectedSessionId"
        :options="sessionOptions"
        option-label="label"
        option-value="value"
        placeholder="選擇堂次"
        class="w-full max-w-xs text-sm"
      />
    </div>

    <!-- 出席率 badge -->
    <div
      v-if="attendanceRate !== null"
      class="mb-4 flex items-center gap-2 rounded-2xl bg-slate-50 px-4 py-3 dark:bg-surface-800"
    >
      <i class="pi pi-chart-bar text-blue-500 dark:text-blue-400" />
      <span class="text-sm font-black text-slate-500 dark:text-surface-300">
        {{ studentOnly ? '個人出席率' : '本堂出席率' }}
      </span>
      <span
        class="ml-auto text-lg font-black"
        :class="
          attendanceRate >= 80
            ? 'text-emerald-600 dark:text-emerald-400'
            : attendanceRate >= 60
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-red-600 dark:text-red-400'
        "
      >
        {{ attendanceRate }}%
      </span>
    </div>

    <!-- 載入中 -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner style="width: 40px; height: 40px" />
    </div>

    <!-- 教師模式 DataTable -->
    <DataTable
      v-else-if="!studentOnly"
      :value="attendances"
      striped-rows
      :paginator="attendances.length > 15"
      :rows="15"
      class="text-sm"
    >
      <template #empty>
        <div class="py-10 text-center font-bold text-slate-400">
          {{ selectedSessionId ? '本堂尚無簽到紀錄' : '請選擇堂次' }}
        </div>
      </template>
      <Column field="userId" header="學員 ID">
        <template #body="{ data }">
          <span class="font-mono text-xs text-slate-500 dark:text-surface-400">{{ data.userId }}</span>
        </template>
      </Column>
      <Column field="status" header="出席狀態">
        <template #body="{ data }">
          <div v-if="canEdit">
            <Select
              :model-value="data.status"
              :options="statusOptions"
              option-label="label"
              option-value="value"
              :disabled="isUpdating"
              class="w-28 text-sm"
              @update:model-value="(val) => handleStatusChange(data, val)"
            />
          </div>
          <Tag
            v-else
            :value="getStatusLabel(data.status)"
            :severity="getStatusSeverity(data.status)"
          />
        </template>
      </Column>
      <Column field="scannedAt" header="簽到時間">
        <template #body="{ data }">
          <span class="text-slate-500 dark:text-surface-400">{{ data.scannedAt ? formatDateTime(data.scannedAt) : '—' }}</span>
        </template>
      </Column>
    </DataTable>

    <!-- 學生模式 DataTable -->
    <DataTable
      v-else
      :value="attendances"
      striped-rows
      :paginator="attendances.length > 15"
      :rows="15"
      class="text-sm"
    >
      <template #empty>
        <div class="py-10 text-center font-bold text-slate-400">尚無出席紀錄</div>
      </template>
      <Column field="sessionId" header="堂次">
        <template #body="{ data }">
          <span class="font-bold text-slate-700 dark:text-surface-200">{{ getSessionLabel(data.sessionId) }}</span>
        </template>
      </Column>
      <Column field="status" header="出席狀態">
        <template #body="{ data }">
          <Tag
            :value="getStatusLabel(data.status)"
            :severity="getStatusSeverity(data.status)"
          />
        </template>
      </Column>
      <Column field="scannedAt" header="簽到時間">
        <template #body="{ data }">
          <span class="text-slate-500 dark:text-surface-400">{{ data.scannedAt ? formatDateTime(data.scannedAt) : '—' }}</span>
        </template>
      </Column>
    </DataTable>
  </div>
</template>
