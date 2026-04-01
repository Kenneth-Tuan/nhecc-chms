<script setup lang="ts">
/**
 * 擋修條件選擇器 (ST015)
 * 合併「系統固定條件」與「現有課程模板」為統一下拉清單。
 */
import type { Prerequisite, CourseTemplateListItem } from '~/types/course'
import { SYSTEM_STATUS_CONDITIONS } from '~/types/course'

const props = defineProps<{
  modelValue: Prerequisite[]
  /** 排除的課程 ID（避免自己選自己） */
  excludeId?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: Prerequisite[]]
}>()

const { list } = useCourseTemplates()

const allTemplates = ref<CourseTemplateListItem[]>([])
const isLoadingOptions = ref(false)

onMounted(async () => {
  isLoadingOptions.value = true
  try {
    allTemplates.value = await list({ status: 'ACTIVE' })
  } catch {
    // 靜默失敗，選項為空
  } finally {
    isLoadingOptions.value = false
  }
})

interface PrerequisiteOption {
  type: 'COURSE' | 'STATUS'
  value: string
  label: string
}

const options = computed<PrerequisiteOption[]>(() => {
  const systemOpts: PrerequisiteOption[] = SYSTEM_STATUS_CONDITIONS.map(
    (c) => ({
      type: c.type,
      value: c.value,
      label: c.label,
    }),
  )

  const courseOpts: PrerequisiteOption[] = allTemplates.value
    .filter((t) => t.id !== props.excludeId)
    .map((t) => ({
      type: 'COURSE' as const,
      value: t.code,
      label: `${t.code} - ${t.name}`,
    }))

  return [...systemOpts, ...courseOpts]
})

/** 選取中的 value 陣列（MultiSelect 用） */
const selectedValues = computed({
  get: () => props.modelValue.map((p) => p.value),
  set: (values: string[]) => {
    const result: Prerequisite[] = values.map((v) => {
      const opt = options.value.find((o) => o.value === v)
      return { type: opt?.type || 'COURSE', value: v }
    })
    emit('update:modelValue', result)
  },
})
</script>

<template>
  <MultiSelect
    v-model="selectedValues"
    :options="options"
    option-label="label"
    option-value="value"
    placeholder="選擇擋修條件"
    display="chip"
    filter
    :loading="isLoadingOptions"
    class="w-full text-base"
  />
</template>
