<script setup lang="ts">
/**
 * 課程模板列表頁 (ST015)
 */
import type {
  CourseTemplateListItem,
  CourseTemplateStatus,
} from '~/types/course'
import {
  COURSE_FORMAT_OPTIONS,
  FREQUENCY_OPTIONS,
} from '~/types/course'
import TemplateTable from './_components/TemplateTable.vue'

definePageMeta({
  layout: 'dashboard',
})

const router = useRouter()
const toast = useToast()
const { list, updateStatus } = useCourseTemplates()

const templates = ref<CourseTemplateListItem[]>([])
const isLoading = ref(false)
const error = ref<string | null>(null)
const statusFilter = ref<CourseTemplateStatus | 'all'>('all')

async function fetchTemplates(): Promise<void> {
  isLoading.value = true
  error.value = null
  try {
    templates.value = await list({
      status: statusFilter.value === 'all' ? undefined : statusFilter.value,
    })
  } catch (e: any) {
    error.value = e.data?.message || '載入課程模板失敗'
  } finally {
    isLoading.value = false
  }
}

async function toggleStatus(template: CourseTemplateListItem): Promise<void> {
  const newStatus: CourseTemplateStatus =
    template.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
  try {
    await updateStatus(template.id, newStatus)
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: `已${newStatus === 'ACTIVE' ? '啟用' : '停用'}「${template.name}」`,
      life: 3000,
    })
    fetchTemplates()
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: '錯誤',
      detail: e.data?.message || '狀態更新失敗',
      life: 3000,
    })
  }
}

function editTemplate(template: CourseTemplateListItem): void {
  router.push(`/dashboard/courses/templates/${template.id}`)
}

function getFormatLabel(value?: string): string {
  if (!value) return '-'
  return COURSE_FORMAT_OPTIONS.find((o) => o.value === value)?.label || value
}

function getFrequencyLabel(value?: string): string {
  if (!value) return '-'
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label || value
}

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '啟用中', value: 'ACTIVE' },
  { label: '已停用', value: 'INACTIVE' },
]

onMounted(() => {
  fetchTemplates()
})
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">課程模板管理</h1>
        <p class="text-sm text-slate-500 mt-1">
          共 {{ templates.length }} 個課程模板
        </p>
      </div>
      <Button
        label="新增模板"
        icon="pi pi-plus"
        @click="router.push('/dashboard/courses/templates/create')"
      />
    </div>

    <!-- Filters -->
    <div class="mb-4">
      <Select
        v-model="statusFilter"
        :options="statusOptions"
        option-label="label"
        option-value="value"
        class="w-40"
        @update:model-value="fetchTemplates"
      />
    </div>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
      <Button
        label="重試"
        size="small"
        text
        class="ml-2"
        @click="fetchTemplates"
      />
    </Message>

    <!-- Table -->
    <TemplateTable
      :templates="templates"
      :is-loading="isLoading"
      :get-format-label="getFormatLabel"
      :get-frequency-label="getFrequencyLabel"
      @edit="editTemplate"
      @toggle-status="toggleStatus"
    />
  </div>
</template>
