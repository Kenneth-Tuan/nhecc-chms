<script setup lang="ts">
/**
 * 課程模板建立/編輯共用表單 (ST015)
 */
import type {
  CourseTemplate,
  CourseFormat,
  FrequencyType,
  DurationType,
  Prerequisite,
  CourseAttachment,
  CourseCategory,
  RegistrationDateRange,
} from '~/types/course'
import {
  COURSE_FORMAT_OPTIONS,
  FREQUENCY_OPTIONS,
  DURATION_TYPE_OPTIONS,
} from '~/types/course'
import PrerequisiteSelect from './PrerequisiteSelect.vue'

const props = defineProps<{
  /** 編輯時傳入現有模板，建立時為 undefined */
  template?: CourseTemplate
  isSaving: boolean
}>()

const emit = defineEmits<{
  submit: [payload: any]
  cancel: []
}>()

const { list: listCategories } = useCourseCategories()

// ── Form state ──
const name = ref('')
const code = ref('')
const categoryIds = ref<string[]>([])
const format = ref<CourseFormat | undefined>(undefined)
const prerequisites = ref<Prerequisite[]>([])
const durationType = ref<DurationType | undefined>(undefined)
const durationWeeks = ref<number | undefined>(undefined)
const durationHours = ref<number | undefined>(undefined)
const frequency = ref<FrequencyType | undefined>(undefined)
const attachments = ref<CourseAttachment[]>([])
const syllabus = ref('')
const regDateRange = ref<Date[] | undefined>(undefined)
const status = ref<'ACTIVE' | 'INACTIVE'>('ACTIVE')

// ── 分類選項 ──
const categories = ref<CourseCategory[]>([])

onMounted(async () => {
  try {
    categories.value = await listCategories()
  } catch {
    // 靜默
  }

  // 編輯模式：填充表單
  if (props.template) {
    const t = props.template
    name.value = t.name
    code.value = t.code
    categoryIds.value = t.categoryIds || []
    format.value = t.format
    prerequisites.value = t.prerequisites || []
    frequency.value = t.frequency
    attachments.value = t.attachments || []
    syllabus.value = t.syllabus || ''
    status.value = t.status

    if (t.estimatedDuration) {
      durationType.value = t.estimatedDuration.type
      durationWeeks.value = t.estimatedDuration.weeks
      durationHours.value = t.estimatedDuration.hoursPerSession
    }

    if (t.registrationDateRange) {
      regDateRange.value = [
        new Date(t.registrationDateRange.start),
        new Date(t.registrationDateRange.end),
      ]
    }
  }
})

const isEditMode = computed(() => !!props.template)
const codeDisabled = computed(
  () => isEditMode.value && props.template?.hasAssociations,
)

function onCodeInput(event: Event): void {
  const input = event.target as HTMLInputElement
  code.value = input.value.toUpperCase()
}

function handleSubmit(): void {
  // 組裝 estimatedDuration
  let estimatedDuration: any = undefined
  if (durationType.value) {
    estimatedDuration = { type: durationType.value }
    if (durationType.value === 'WEEKLY' && durationWeeks.value) {
      estimatedDuration.weeks = durationWeeks.value
    }
    if (durationType.value === 'EVENT' && durationHours.value) {
      estimatedDuration.hoursPerSession = durationHours.value
    }
  }

  // 組裝 registrationDateRange
  let registrationDateRange: RegistrationDateRange | undefined = undefined
  if (regDateRange.value && regDateRange.value.length === 2) {
    registrationDateRange = {
      start: regDateRange.value[0].toISOString(),
      end: regDateRange.value[1].toISOString(),
    }
  }

  emit('submit', {
    name: name.value,
    code: code.value,
    categoryIds: categoryIds.value,
    format: format.value,
    prerequisites: prerequisites.value,
    estimatedDuration,
    frequency: frequency.value,
    attachments: attachments.value,
    syllabus: syllabus.value,
    registrationDateRange,
    status: status.value,
  })
}

// ── 附件上傳 ──
function onFileUpload(event: any): void {
  const files = event.files as File[]
  for (const file of files) {
    // TODO: 實際上傳至 Firebase Storage，取得 URL
    // 目前先建立 placeholder
    attachments.value.push({
      name: file.name,
      url: '', // 待接 Firebase Storage
      size: file.size,
      mimeType: file.type,
      uploadedAt: new Date().toISOString(),
    })
  }
}

function removeAttachment(index: number): void {
  attachments.value.splice(index, 1)
}
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <!-- 課程名稱 -->
      <div class="flex flex-col gap-2">
        <label for="name" class="font-semibold">課程名稱 *</label>
        <InputText
          id="name"
          v-model.trim="name"
          placeholder="例：成長班 - 基礎信仰建立"
          class="w-full"
        />
      </div>

      <!-- 課程代號 -->
      <div class="flex flex-col gap-2">
        <label for="code" class="font-semibold">
          課程代號 *
          <span v-if="codeDisabled" class="text-xs text-orange-500 ml-1">
            (已有關聯，不可修改)
          </span>
        </label>
        <InputText
          id="code"
          :model-value="code"
          :disabled="codeDisabled"
          placeholder="例：S101"
          class="w-full font-mono"
          @input="onCodeInput"
        />
      </div>

      <!-- 課程分類 -->
      <div class="flex flex-col gap-2">
        <label for="categoryIds" class="font-semibold">課程分類</label>
        <MultiSelect
          id="categoryIds"
          v-model="categoryIds"
          :options="categories"
          option-label="name"
          option-value="id"
          placeholder="選擇分類"
          display="chip"
          class="w-full"
        />
      </div>

      <!-- 授課方式 -->
      <div class="flex flex-col gap-2">
        <label for="format" class="font-semibold">授課方式</label>
        <Select
          id="format"
          v-model="format"
          :options="COURSE_FORMAT_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="選擇授課方式"
          show-clear
          class="w-full"
        />
      </div>

      <!-- 擋修條件 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-semibold">擋修條件</label>
        <PrerequisiteSelect
          v-model="prerequisites"
          :exclude-code="code"
        />
      </div>

      <!-- 預計時間 -->
      <div class="flex flex-col gap-2">
        <label class="font-semibold">預計花費時間</label>
        <div class="flex gap-2">
          <Select
            v-model="durationType"
            :options="DURATION_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="類型"
            show-clear
            class="w-40"
          />
          <InputNumber
            v-if="durationType === 'WEEKLY'"
            v-model="durationWeeks"
            placeholder="週數"
            :min="1"
            suffix=" 週"
            class="flex-1"
          />
          <InputNumber
            v-if="durationType === 'EVENT'"
            v-model="durationHours"
            placeholder="小時"
            :min="0.5"
            :step="0.5"
            suffix=" 小時/次"
            class="flex-1"
          />
        </div>
      </div>

      <!-- 開課頻率 -->
      <div class="flex flex-col gap-2">
        <label for="frequency" class="font-semibold">開課頻率</label>
        <Select
          id="frequency"
          v-model="frequency"
          :options="FREQUENCY_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="選擇開課頻率"
          show-clear
          class="w-full"
        />
      </div>

      <!-- 意願登記日期 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-semibold">開放意願登記日期</label>
        <DatePicker
          v-model="regDateRange"
          selection-mode="range"
          date-format="yy-mm-dd"
          placeholder="選擇日期範圍"
          show-icon
          class="w-full"
        />
      </div>

      <!-- 課程教材 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-semibold">課程教材</label>
        <FileUpload
          mode="basic"
          multiple
          choose-label="上傳教材"
          class="mb-2"
          auto
          custom-upload
          @uploader="onFileUpload"
        />
        <div v-if="attachments.length > 0" class="flex flex-col gap-2">
          <div
            v-for="(att, idx) in attachments"
            :key="idx"
            class="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg"
          >
            <div class="flex items-center gap-2">
              <i class="pi pi-file text-slate-500" />
              <span class="text-sm">{{ att.name }}</span>
              <span v-if="att.size" class="text-xs text-slate-400">
                ({{ (att.size / 1024).toFixed(1) }} KB)
              </span>
            </div>
            <Button
              icon="pi pi-times"
              text
              rounded
              severity="danger"
              size="small"
              @click="removeAttachment(idx)"
            />
          </div>
        </div>
      </div>

      <!-- 課程大綱 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-semibold">課程大綱</label>
        <Editor
          v-model="syllabus"
          editor-style="height: 250px"
        />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-200">
      <Button
        label="取消"
        severity="secondary"
        outlined
        @click="emit('cancel')"
      />
      <Button
        type="submit"
        :label="isEditMode ? '儲存變更' : '建立模板'"
        :loading="isSaving"
        icon="pi pi-check"
      />
    </div>
  </form>
</template>
