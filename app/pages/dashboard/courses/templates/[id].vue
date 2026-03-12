<script setup lang="ts">
/**
 * 課程模板編輯頁 (ST015)
 */
import type { CourseTemplate } from '~/types/course'
import TemplateForm from './_components/TemplateForm.vue'
import { updateCourseTemplateSchema } from '~/schemas/course.schema'

definePageMeta({
  layout: 'dashboard',
})

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { getById, update } = useCourseTemplates()

const templateId = computed(() => route.params.id as string)
const template = ref<CourseTemplate | null>(null)
const isLoading = ref(false)
const isSaving = ref(false)

onMounted(async () => {
  isLoading.value = true
  try {
    template.value = await getById(templateId.value)
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: '錯誤',
      detail: e.data?.message || '載入課程模板失敗',
      life: 5000,
    })
    router.push('/dashboard/courses/templates')
  } finally {
    isLoading.value = false
  }
})

async function handleSubmit(payload: any): Promise<void> {
  const result = updateCourseTemplateSchema.safeParse(payload)
  if (!result.success) {
    const firstError = result.error.issues[0]
    toast.add({
      severity: 'warn',
      summary: '驗證失敗',
      detail: firstError.message,
      life: 4000,
    })
    return
  }

  isSaving.value = true
  try {
    await update(templateId.value, result.data)
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '課程模板已更新',
      life: 3000,
    })
    router.push('/dashboard/courses/templates')
  } catch (e: any) {
    toast.add({
      severity: 'error',
      summary: '更新失敗',
      detail: e.data?.message || '發生未知錯誤',
      life: 5000,
    })
  } finally {
    isSaving.value = false
  }
}

function handleCancel(): void {
  router.push('/dashboard/courses/templates')
}
</script>

<template>
  <div>
    <div class="mb-6">
      <Button
        label="返回列表"
        icon="pi pi-arrow-left"
        text
        size="small"
        @click="handleCancel"
      />
      <h1 class="text-2xl font-bold mt-2">編輯課程模板</h1>
    </div>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Form -->
    <div
      v-else-if="template"
      class="bg-white border border-slate-200 rounded-xl p-6"
    >
      <TemplateForm
        :template="template"
        :is-saving="isSaving"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>
