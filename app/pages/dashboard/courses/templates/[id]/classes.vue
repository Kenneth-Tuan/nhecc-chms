<script setup lang="ts">
import type { CourseClass } from "~/types/course-class";
import type { CourseTemplate } from "~/types/course";
import CourseClassCard from "./_components/CourseClassCard.vue";
import CreateClassDialog from "./_components/CreateClassDialog.vue";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const { getById } = useCourseTemplates(); // 假設已有的 composable

const templateId = computed(() => route.params.id as string);
const template = ref<CourseTemplate | null>(null);
const classes = ref<CourseClass[]>([]); // 未來會從 API 拿

const isLoading = ref(false);
const showCreateDialog = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    template.value = await getById(templateId.value);
    // TODO: fetch classes
    // classes.value = await getClassesByTemplate(templateId.value)

    // 假資料
    classes.value = [
      {
        id: "class_1",
        templateId: templateId.value,
        name: "2026 春季啟發小組 (平日晚)",
        teachers: [{ id: "teacher_1", name: "張老師" }],
        teacherIds: ["teacher_1"],
        studentIds: [],
        status: "IN_PROGRESS",
        startDate: "2026-03-01",
        endDate: "2026-05-31",
        location: "多功能教室 A",
        description: "本班級為平日晚間進度。",
        attachments: [],
        maxCapacity: 30,
        enrollmentCount: 25,
        isPublished: true,
        sessions: [{ sessionId: "s1", startTime: "2026-03-01T19:00:00Z", endTime: "2026-03-01T21:00:00Z" }],
        currentSessionId: "s1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "class_2",
        templateId: templateId.value,
        name: "2025 秋季啟發小組",
        teachers: [{ id: "teacher_2", name: "李老師" }],
        teacherIds: ["teacher_2"],
        studentIds: ["std_1", "std_2"],
        status: "COMPLETED",
        startDate: "2025-09-01",
        endDate: "2025-11-30",
        location: "線上 Zoom",
        description: "已結束的秋季班。",
        attachments: [],
        maxCapacity: 50,
        enrollmentCount: 48,
        isPublished: true,
        sessions: [],
        currentSessionId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  } catch (error) {
    console.error("Failed to load template", error);
  } finally {
    isLoading.value = false;
  }
});

function goToClass(classId: string) {
  router.push(`/dashboard/courses/classes/${classId}`);
}

function handleClassSaved() {
  // TODO: refresh classes list
}
</script>

<template>
  <BasePageContainer>
    <!-- Header -->
    <BasePageHeader
      title="課程模板詳情"
      back-to="/dashboard/courses/templates"
    />

    <!-- Hero Section / Template Identity -->
    <div v-if="isLoading" class="animate-pulse flex flex-col gap-4 mb-8">
      <div class="h-10 bg-slate-200 rounded w-1/3"></div>
      <div class="h-6 bg-slate-200 rounded w-2/3"></div>
    </div>

    <div
      v-else-if="template"
      class="bg-slate-800 rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden mb-12"
    >
      <!-- 裝飾性背景 -->
      <div
        class="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl"
      ></div>

      <div
        class="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6"
      >
        <div>
          <div class="flex items-center gap-3 mb-4">
            <span
              class="bg-emerald-500 text-white text-base px-3 py-1 rounded-full font-bold tracking-wider"
            >
              {{ template.code }}
            </span>
            <span class="text-slate-400 text-base font-medium"
              >| 授課方式: {{ template.format || "未指定" }}</span
            >
          </div>
          <h1 class="text-4xl md:text-5xl font-bold mb-6 tracking-tight">
            {{ template.name }}
          </h1>
          <p class="text-slate-300 text-lg max-w-3xl leading-relaxed">
            在此管理所有基於此模板開設的班級紀錄。所有班級將繼承此模板的課綱、擋修條件與基本教材。
          </p>
        </div>

        <Button
          label="編輯模板"
          icon="pi pi-pencil"
          outlined
          class="text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-slate-900 transition-all font-bold px-6 text-base"
          @click="router.push(`/dashboard/courses/templates/${template.id}`)"
        />
      </div>
    </div>

    <!-- Classes Section -->
    <div class="flex justify-between items-center mb-8">
      <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-3">
        <i class="pi pi-book text-emerald-600"></i>
        班級開課紀錄
      </h2>
      <Button
        label="建立新班級"
        icon="pi pi-plus"
        class="bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-100 text-lg px-6"
        @click="showCreateDialog = true"
      />
    </div>

    <!-- Class Grid -->
    <div
      v-if="classes.length === 0 && !isLoading"
      class="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-16 text-center"
    >
      <div
        class="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
      >
        <i class="pi pi-folder-open text-3xl"></i>
      </div>
      <h3 class="text-xl font-bold text-slate-700 mb-2">尚無實體班級</h3>
      <p class="text-slate-500 mb-6 text-lg">
        目前這個課程模板還沒有任何開課紀錄。
      </p>
      <Button
        label="立即建立第一堂課"
        icon="pi pi-plus"
        outlined
        @click="showCreateDialog = true"
      />
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <CourseClassCard
        v-for="c in classes"
        :key="c.id"
        :course-class="c"
        @click="goToClass(c.id)"
      />
    </div>

    <CreateClassDialog
      v-if="template"
      v-model:visible="showCreateDialog"
      :template-id="template.id"
      @saved="handleClassSaved"
    />
  </BasePageContainer>
</template>
