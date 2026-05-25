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
  AttachmentType,
} from "~/types/course";
import {
  COURSE_FORMAT_OPTIONS,
  FREQUENCY_OPTIONS,
  DURATION_TYPE_OPTIONS,
} from "~/types/course";
import PrerequisiteSelect from "./PrerequisiteSelect.vue";

const props = defineProps<{
  /** 編輯時傳入現有模板，建立時為 undefined */
  template?: CourseTemplate;
  isSaving: boolean;
}>();

const emit = defineEmits<{
  submit: [payload: any, pendingFiles: File[]];
  cancel: [];
}>();

const { list: listCategories } = useCourseCategories();
const toast = useToast();
const { deleteAttachment } = useCourseAttachmentUpload();

// ── Form state ──
const name = ref("");
const code = ref("");
const categoryIds = ref<string[]>([]);
const format = ref<CourseFormat | undefined>(undefined);
const prerequisites = ref<Prerequisite[]>([]);
const durationType = ref<DurationType | undefined>(undefined);
const durationWeeks = ref<number | undefined>(undefined);
const durationHours = ref<number | undefined>(undefined);
const frequency = ref<FrequencyType | undefined>(undefined);
const attachments = ref<CourseAttachment[]>([]);
const pendingFiles = ref<File[]>([]);
const syllabus = ref("");
const status = ref<"ACTIVE" | "INACTIVE">("ACTIVE");

const isDeletingAttachment = ref(false);

// ── 分類選項 ──
const categories = ref<CourseCategory[]>([]);

onMounted(async () => {
  try {
    categories.value = await listCategories();
  } catch {
    // 靜默
  }

  // 編輯模式：填充表單
  if (props.template) {
    const t = props.template;
    name.value = t.name;
    code.value = t.code;
    categoryIds.value = t.categoryIds || [];
    format.value = t.format;
    prerequisites.value = t.prerequisites || [];
    frequency.value = t.frequency;
    attachments.value = t.attachments || [];
    syllabus.value = t.syllabus || "";
    status.value = t.status;

    if (t.estimatedDuration) {
      durationType.value = t.estimatedDuration.type;
      durationWeeks.value = t.estimatedDuration.weeks;
      durationHours.value = t.estimatedDuration.hoursPerSession;
    }
  }
});

const isEditMode = computed(() => !!props.template);
const codeDisabled = computed(
  () => isEditMode.value && props.template?.hasAssociations,
);

function onCodeInput(event: Event): void {
  const input = event.target as HTMLInputElement;
  code.value = input.value.toUpperCase();
}

function handleSubmit(): void {
  // 組裝 estimatedDuration
  let estimatedDuration: any = undefined;
  if (durationType.value) {
    estimatedDuration = { type: durationType.value };
    if (durationType.value === "WEEKLY" && durationWeeks.value) {
      estimatedDuration.weeks = durationWeeks.value;
    }
    if (durationType.value === "EVENT" && durationHours.value) {
      estimatedDuration.hoursPerSession = durationHours.value;
    }
  }

  emit("submit", {
    name: name.value,
    code: code.value,
    categoryIds: categoryIds.value,
    format: format.value,
    prerequisites: prerequisites.value,
    estimatedDuration,
    frequency: frequency.value,
    attachments: attachments.value,
    syllabus: syllabus.value,
    status: status.value,
  }, pendingFiles.value);
}

interface AttachmentItem {
  id: string
  name: string
  size?: number
  mimeType?: string
  url: string
  file?: File
}

const allAttachments = computed(() => {
  const items: AttachmentItem[] = attachments.value.map(a => ({
    id: a.url,
    name: a.name,
    size: a.size,
    mimeType: a.mimeType,
    url: a.url
  }))
  
  const pendingItems: AttachmentItem[] = pendingFiles.value.map(f => ({
    id: `pending-${f.name}-${f.size}`,
    name: f.name,
    size: f.size,
    mimeType: f.type,
    url: '',
    file: f
  }))
  
  return [...items, ...pendingItems]
})

// ── 附件上傳 ──
function onFileUpload(event: any): void {
  const files = event.files as File[];
  for (const file of files) {
    // 檢查檔案大小是否超過 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.add({
        severity: "warn",
        summary: "檔案太大",
        detail: `檔案 ${file.name} 超過 10MB 限制`,
        life: 4000
      })
      continue
    }
    const isDup = pendingFiles.value.some(f => f.name === file.name && f.size === file.size) ||
                  attachments.value.some(a => a.name === file.name && a.size === file.size)
    if (!isDup) {
      pendingFiles.value.push(file)
    }
  }
}

async function removeAttachmentItem(item: AttachmentItem): Promise<void> {
  if (!item.url) {
    // 本地待上傳檔案，直接移除
    pendingFiles.value = pendingFiles.value.filter(f => f !== item.file)
    return
  }

  // 已上傳檔案
  if (!props.template?.id) return

  try {
    isDeletingAttachment.value = true
    await deleteAttachment(props.template.id, item.url)
    attachments.value = attachments.value.filter(a => a.url !== item.url)
    toast.add({
      severity: 'success',
      summary: '成功',
      detail: '附件已刪除',
      life: 3000,
    })
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: '刪除失敗',
      detail: err.message || '刪除附件失敗',
      life: 4000,
    })
  } finally {
    isDeletingAttachment.value = false
  }
}

function previewAttachment(item: AttachmentItem): void {
  if (item.url) {
    window.open(item.url, '_blank')
  } else if (item.file) {
    const objectUrl = URL.createObjectURL(item.file)
    window.open(objectUrl, '_blank')
  }
}
</script>



<template>
  <form @submit.prevent="handleSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- 課程名稱 -->
      <div class="flex flex-col gap-2">
        <label for="name" class="font-bold text-slate-700 dark:text-surface-200 text-base">課程名稱 *</label>
        <InputText
          id="name"
          v-model.trim="name"
          placeholder="例：一對一門徒訓練養育班"
          class="w-full text-base"
        />
      </div>

      <!-- 課程代號 -->
      <div class="flex flex-col gap-2">
        <label for="code" class="font-bold text-slate-700 dark:text-surface-200 text-base">
          課程代號 *
          <span v-if="codeDisabled" class="text-base text-orange-500 dark:text-orange-400 ml-2 font-normal">
            (已有關聯班級，不可修改)
          </span>
        </label>
        <InputText
          id="code"
          :model-value="code"
          :disabled="codeDisabled"
          placeholder="例：S101"
          class="w-full font-mono text-base"
          @input="onCodeInput"
        />
      </div>

      <!-- 課程分類 -->
      <div class="flex flex-col gap-2">
        <label for="categoryIds" class="font-bold text-slate-700 dark:text-surface-200 text-base">課程分類</label>
        <MultiSelect
          id="categoryIds"
          v-model="categoryIds"
          :options="categories"
          option-label="name"
          option-value="id"
          placeholder="選擇分類"
          display="chip"
          class="w-full text-base"
        />
      </div>

      <!-- 授課方式 -->
      <div class="flex flex-col gap-2">
        <label for="format" class="font-bold text-slate-700 dark:text-surface-200 text-base">授課方式</label>
        <Select
          id="format"
          v-model="format"
          :options="COURSE_FORMAT_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="選擇授課方式"
          show-clear
          class="w-full text-base"
        />
      </div>

      <!-- 擋修條件 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 dark:text-surface-200 text-base">擋修條件 (需先修完以下模板)</label>
        <PrerequisiteSelect v-model="prerequisites" :exclude-id="template?.id" />
      </div>

      <!-- 預計時間 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 dark:text-surface-200 text-base">預計花費時間</label>
        <div class="flex gap-3">
          <Select
            v-model="durationType"
            :options="DURATION_TYPE_OPTIONS"
            option-label="label"
            option-value="value"
            placeholder="類型"
            show-clear
            class="w-44 text-base"
          />
          <InputNumber
            v-if="durationType === 'WEEKLY'"
            v-model="durationWeeks"
            placeholder="週數"
            :min="1"
            suffix=" 週"
            class="flex-1 text-base"
          />
          <InputNumber
            v-if="durationType === 'EVENT'"
            v-model="durationHours"
            placeholder="小時"
            :min="0.5"
            :step="0.5"
            suffix=" 小時/次"
            class="flex-1 text-base"
          />
        </div>
      </div>

      <!-- 開課頻率 -->
      <div class="flex flex-col gap-2">
        <label for="frequency" class="font-bold text-slate-700 dark:text-surface-200 text-base">開課頻率</label>
        <Select
          id="frequency"
          v-model="frequency"
          :options="FREQUENCY_OPTIONS"
          option-label="label"
          option-value="value"
          placeholder="選擇開課頻率"
          show-clear
          class="w-full text-base"
        />
      </div>

      <!-- 課程教材 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 dark:text-surface-200 text-base">課程教材</label>
        <FileUpload
          mode="basic"
          multiple
          choose-label="上傳課程附件 (PDF/Office)"
          class="mb-3 text-base"
          auto
          custom-upload
          @uploader="onFileUpload"
        />
        <div v-if="allAttachments.length > 0" class="flex flex-col gap-3">
          <div
            v-for="att in allAttachments"
            :key="att.id"
            class="flex items-center justify-between p-4 bg-slate-50 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-xl"
          >
            <div
              class="flex items-center gap-3 cursor-pointer group flex-1 mr-4"
              title="點擊預覽/下載檔案"
              @click="previewAttachment(att)"
            >
              <i class="pi pi-file text-slate-500 dark:text-surface-400 text-lg group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
              <div class="flex flex-col">
                <span class="text-base font-bold text-slate-800 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:underline transition-all">
                  {{ att.name }}
                </span>
                <span v-if="att.size" class="text-base text-slate-400 dark:text-surface-400">
                  {{ (att.size / 1024).toFixed(1) }} KB
                  <span v-if="!att.url" class="ml-2 text-primary-500 dark:text-primary-400 font-normal italic">(待上傳)</span>
                </span>
              </div>
            </div>
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              class="p-2 flex-shrink-0"
              :loading="isDeletingAttachment && att.url !== ''"
              :disabled="isDeletingAttachment"
              @click="removeAttachmentItem(att)"
            />
          </div>
        </div>


      </div>

      <!-- 課程大綱 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 dark:text-surface-200 text-base">課程大綱</label>
        <Editor v-model="syllabus" editor-style="height: 300px" class="text-base" />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-surface-700">
      <Button
        label="取消"
        severity="secondary"
        text
        class="px-8 text-base"
        @click="emit('cancel')"
      />
      <Button
        type="submit"
        :label="isEditMode ? '儲存變更' : '建立課程模板'"
        :loading="isSaving"
        icon="pi pi-check"
        class="px-10 py-3 shadow-lg dark:shadow-none text-base font-bold"
      />
    </div>
  </form>
</template>
