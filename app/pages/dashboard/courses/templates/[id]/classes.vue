<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CourseClass } from "~/types/course-class";
import type { CourseTemplate } from "~/types/course";
import CourseClassCard from "./_components/CourseClassCard.vue";
import CreateClassDialog from "./_components/CreateClassDialog.vue";

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
        teacherIds: ["teacher_1"],
        status: "IN_PROGRESS",
        sessions: [{ sessionId: "s1", startTime: "", endTime: "" }],
        currentSessionId: "s1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: "class_2",
        templateId: templateId.value,
        name: "2025 秋季啟發小組",
        teacherIds: ["teacher_2"],
        status: "COMPLETED",
        sessions: [{}, {}] as any,
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
  <div class="max-w-7xl mx-auto pb-12">
    <!-- Header Area -->
    <div class="mb-8">
      <Button
        label="返回課程總覽"
        icon="pi pi-arrow-left"
        text
        class="mb-4 text-slate-500 hover:text-slate-800"
        @click="router.push('/dashboard/courses/templates')"
      />

      <div v-if="isLoading" class="animate-pulse flex flex-col gap-4">
        <div class="h-10 bg-slate-200 rounded w-1/3"></div>
        <div class="h-6 bg-slate-200 rounded w-2/3"></div>
      </div>

      <div
        v-else-if="template"
        class="bg-slate-800 rounded-2xl p-8 text-white shadow-lg relative overflow-hidden"
      >
        <!-- 裝飾性背景 -->
        <div
          class="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-emerald-500 opacity-10 rounded-full blur-3xl"
        ></div>

        <div class="relative z-10 flex justify-between items-start">
          <div>
            <div class="flex items-center gap-3 mb-2">
              <span
                class="bg-emerald-500 text-white text-sm px-3 py-1 rounded-full font-semibold tracking-wider"
              >
                {{ template.code }}
              </span>
              <span class="text-slate-400 text-sm"
                >| 授課方式: {{ template.format || "未指定" }}</span
              >
            </div>
            <h1 class="text-4xl font-bold mb-4 tracking-tight">
              {{ template.name }}
            </h1>
            <p class="text-slate-300 text-lg max-w-3xl leading-relaxed">
              建立於此模板下的實體班級將繼承其課綱與修課條件。您可以在此管理所有的開課紀錄。
            </p>
          </div>

          <Button
            label="編輯模板"
            icon="pi pi-pencil"
            outlined
            class="text-emerald-400 border-emerald-400 hover:bg-emerald-400 hover:text-slate-900 transition-colors"
            @click="router.push(`/dashboard/courses/templates/${template.id}`)"
          />
        </div>
      </div>
    </div>

    <!-- Classes Section -->
    <div class="flex justify-between items-end mb-6 mt-12">
      <h2 class="text-2xl font-bold text-slate-800 flex items-center gap-2">
        <i class="pi pi-book text-emerald-600"></i>
        開課紀錄
      </h2>
      <Button
        label="建立新班級"
        icon="pi pi-plus"
        class="bg-emerald-600 hover:bg-emerald-700 border-none shadow-md text-lg px-6"
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
  </div>
</template>
