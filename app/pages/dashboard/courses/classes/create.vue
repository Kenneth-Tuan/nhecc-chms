<script setup lang="ts">
/**
 * 建立班級流程頁面 (ST015)
 * 採用兩步驟導引式表單，整合模板選擇與詳細設定。
 */
import { useCourseTemplates } from "~/composables/useCourseTemplates";
import { useCourseClass } from "~/composables/useCourseClass";
import type { CourseTemplateListItem } from "~/types/course";
import ClassForm from "./_components/ClassForm.vue";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const { list: listTemplates } = useCourseTemplates();
const { createClass, isCreating } = useCourseClass();

// 狀態管理
const activeStep = ref(0);
const templates = ref<CourseTemplateListItem[]>([]);
const searchTemplate = ref("");
const selectedTemplate = ref<CourseTemplateListItem | null>(null);

async function loadInitialData() {
  const tData = await listTemplates({ status: "ACTIVE" });
  templates.value = tData;

  // 若從模板列表帶入 templateId
  const templateId = route.query.templateId as string;
  if (templateId) {
    const target = tData.find((t) => t.id === templateId);
    if (target) {
      handleSelectTemplate(target);
    }
  }
}

onMounted(() => {
  loadInitialData();
});

const filteredTemplates = computed(() => {
  if (!searchTemplate.value) return templates.value;
  const term = searchTemplate.value.toLowerCase();
  return templates.value.filter(
    (t) =>
      t.name.toLowerCase().includes(term) ||
      t.code.toLowerCase().includes(term),
  );
});

function handleSelectTemplate(template: CourseTemplateListItem) {
  selectedTemplate.value = template;
  activeStep.value = 1;
}

async function handleSubmit(formData: any) {
  if (!selectedTemplate.value) return;

  const payload = {
    templateId: selectedTemplate.value.id,
    ...formData,
    status: "SETUP",
    sessions: [],
    currentSessionId: null,
    attachments: [],
    enrollmentCount: 0,
  };

  // 1. 建立班級
  try {
    const data = await createClass(payload as any);
    toast.add({
      severity: "success",
      summary: "開班成功",
      detail: `班級「${data.name}」已建立`,
      life: 3000,
    });
    router.push(`/dashboard/courses/classes/${data.id}`);
  } catch (e: any) {
    toast.add({
      severity: "error",
      summary: "建立失敗",
      detail: e.data?.message || "伺服器錯誤",
      life: 5000,
    });
  }
}
</script>

<template>
  <BasePageContainer>
    <BasePageHeader
      title="建立新班級"
      :description="
        activeStep === 0 ? '第一步：選擇課程模板' : '第二步：設定班級詳情'
      "
      @back="activeStep === 1 ? (activeStep = 0) : router.back()"
    />

    <!-- Step 1: Template Selection -->
    <div v-if="activeStep === 0" class="space-y-8 animate-fade-in">
      <div
        class="bg-blue-50 p-8 rounded-2xl border border-blue-100 flex items-center gap-6 mb-8"
      >
        <i class="pi pi-info-circle text-blue-500 text-3xl" />
        <div>
          <p class="font-bold text-blue-900 text-lg">
            首先，請選擇一個課程模板 (Template)
          </p>
          <p class="text-blue-700 text-base">
            系統將繼承該模板的教材與基本資料，以便快速開班
          </p>
        </div>
      </div>

      <IconField>
        <InputIcon class="pi pi-search text-base" />
        <InputText
          v-model="searchTemplate"
          placeholder="搜尋模板名稱或代號..."
          class="text-base"
          fluid
        />
      </IconField>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div
          v-for="t in filteredTemplates"
          :key="t.id"
          class="p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all cursor-pointer group"
          @click="handleSelectTemplate(t)"
        >
          <div class="flex justify-between items-start mb-4">
            <Tag
              :value="t.code"
              severity="secondary"
              class="bg-slate-100 text-slate-600 font-mono text-base px-3"
            />
            <i
              class="pi pi-arrow-right text-slate-300 group-hover:text-blue-500 transition-colors text-lg"
            />
          </div>
          <h3
            class="font-bold text-xl text-slate-800 group-hover:text-blue-600 transition-colors"
          >
            {{ t.name }}
          </h3>
          <div class="mt-4 flex items-center gap-4 text-base text-slate-500">
            <span class="flex items-center gap-2"
              ><i class="pi pi-tags" /> {{ t.categoryIds.length }} 分類</span
            >
            <span class="flex items-center gap-2"
              ><i class="pi pi-file" /> {{ t.prerequisiteCount }} 擋修</span
            >
          </div>
        </div>
      </div>
    </div>

    <!-- Step 2: Class Details Form -->
    <div
      v-else
      class="bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-sm animate-slide-up"
    >
      <div
        v-if="selectedTemplate"
        class="flex items-center gap-6 border-b pb-8 mb-8"
      >
        <div class="bg-blue-100 p-4 rounded-xl">
          <i class="pi pi-book text-blue-600 text-xl" />
        </div>
        <div>
          <p class="text-base text-slate-500 font-medium">已選擇模板</p>
          <p class="font-bold text-slate-900 text-2xl">
            {{ selectedTemplate.name }} ({{ selectedTemplate.code }})
          </p>
        </div>
      </div>

      <ClassForm
        :initial-data="selectedTemplate ? { name: `${selectedTemplate.name} - ${new Date().getFullYear()}秋季班` } : null"
        submit-label="確認建立班級"
        :is-submitting="isCreating"
        @submit="handleSubmit"
        @cancel="activeStep = 0"
      />
    </div>
  </BasePageContainer>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
.animate-slide-up {
  animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
