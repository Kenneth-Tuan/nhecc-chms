<script setup lang="ts">
/**
 * 課程模板列表頁 (ST015)
 */
import type {
  CourseTemplateListItem,
  CourseTemplateStatus,
} from "~/types/course";
import { COURSE_FORMAT_OPTIONS, FREQUENCY_OPTIONS } from "~/types/course";
import TemplateTable from "./_components/TemplateTable.vue";
import BasePageContainer from "@/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "@/pages/dashboard/_components/BasePageHeader.vue";
import BaseFilterBar from "@/pages/dashboard/_components/BaseFilterBar.vue";

definePageMeta({
  layout: "dashboard",
});

const router = useRouter();
const toast = useToast();
const { list, updateStatus } = useCourseTemplates();

const templates = ref<CourseTemplateListItem[]>([]);
const isLoading = ref(false);
const error = ref<string | null>(null);
const statusFilter = ref<CourseTemplateStatus | "all">("all");

async function fetchTemplates(): Promise<void> {
  isLoading.value = true;
  error.value = null;
  try {
    templates.value = await list({
      status: statusFilter.value === "all" ? undefined : statusFilter.value,
    });
  } catch (e: any) {
    error.value = e.data?.message || "載入課程模板失敗";
  } finally {
    isLoading.value = false;
  }
}

async function toggleStatus(template: CourseTemplateListItem): Promise<void> {
  const newStatus: CourseTemplateStatus =
    template.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  try {
    await updateStatus(template.id, newStatus);
    toast.add({
      severity: "success",
      summary: "成功",
      detail: `已${newStatus === "ACTIVE" ? "啟用" : "停用"}「${template.name}」`,
      life: 3000,
    });
    fetchTemplates();
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: e.data?.message || "狀態更新失敗",
      life: 3000,
    });
  }
}

function editTemplate(template: CourseTemplateListItem): void {
  router.push(`/dashboard/courses/templates/${template.id}`);
}

function viewClasses(template: CourseTemplateListItem): void {
  router.push(`/dashboard/courses/templates/${template.id}/classes`);
}

function createClass(template: CourseTemplateListItem): void {
  router.push({
    path: "/dashboard/courses/classes/create",
    query: { templateId: template.id },
  });
}

function getFormatLabel(value?: string): string {
  if (!value) return "-";
  return COURSE_FORMAT_OPTIONS.find((o) => o.value === value)?.label || value;
}

function getFrequencyLabel(value?: string): string {
  if (!value) return "-";
  return FREQUENCY_OPTIONS.find((o) => o.value === value)?.label || value;
}

const statusOptions = [
  { label: "全部", value: "all" },
  { label: "啟用中", value: "ACTIVE" },
  { label: "已停用", value: "INACTIVE" },
];

onMounted(() => {
  fetchTemplates();
});
</script>

<template>
  <BasePageContainer>
    <!-- Header: 確保標題與新增模板按鈕正確呈現 -->
    <BasePageHeader
      title="課程模板管理"
      :description="`目前共建立 ${templates.length} 個課程模板`"
    >
      <template #actions>
        <NuxtLink to="/dashboard/courses/templates/create">
          <Button label="新增模板" icon="pi pi-plus" class="shadow-md" />
        </NuxtLink>
      </template>
    </BasePageHeader>

    <!-- Filters: 統一篩選區域佈局 -->
    <BaseFilterBar :columns="4">
      <div class="flex flex-col gap-1">
        <label class="text-base font-semibold text-slate-500 ml-1"
          >狀態篩選</label
        >
        <Select
          v-model="statusFilter"
          :options="statusOptions"
          option-label="label"
          option-value="value"
          fluid
          @update:model-value="fetchTemplates"
        />
      </div>
    </BaseFilterBar>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false" class="mb-4">
      <span class="text-base">{{ error }}</span>
      <Button
        label="重試"
        size="small"
        text
        class="ml-2 text-base"
        @click="fetchTemplates"
      />
    </Message>

    <!-- Table: 卡片樣式包裹 -->
    <div
      class="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
    >
      <TemplateTable
        :templates="templates"
        :is-loading="isLoading"
        :get-format-label="getFormatLabel"
        :get-frequency-label="getFrequencyLabel"
        @edit="editTemplate"
        @view-classes="viewClasses"
        @create-class="createClass"
        @toggle-status="toggleStatus"
      />
    </div>
  </BasePageContainer>
</template>
