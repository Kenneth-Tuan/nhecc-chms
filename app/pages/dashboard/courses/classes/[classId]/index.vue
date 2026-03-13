<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { CourseClass } from "~/types/course-class";
import ClassStudentList from "./_components/ClassStudentList.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const classId = computed(() => route.params.classId as string);
const currentClass = ref<CourseClass | null>(null);
const students = ref<any[]>([]); // 假資料用
const isLoading = ref(false);

// TODO: fetch class data by classId
onMounted(async () => {
  isLoading.value = true;
  try {
    // 模擬 API 請求
    await new Promise((resolve) => setTimeout(resolve, 500));
    currentClass.value = {
      id: classId.value,
      templateId: "temp_1",
      name: "2026 春季啟發小組 (平日晚)",
      teacherIds: ["teacher_1"],
      status: "SETUP",
      sessions: [
        {
          sessionId: "s1",
          startTime: "2026-03-20T19:00:00Z",
          endTime: "2026-03-20T21:00:00Z",
        },
        {
          sessionId: "s2",
          startTime: "2026-03-27T19:00:00Z",
          endTime: "2026-03-27T21:00:00Z",
        },
      ],
      currentSessionId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    students.value = [
      {
        id: "stu_1",
        name: "張小明",
        mobile: "0912-345-678",
        status: "ASSIGNED",
      },
      {
        id: "stu_2",
        name: "李大華",
        mobile: "0922-333-444",
        status: "ASSIGNED",
      },
    ];
  } finally {
    isLoading.value = false;
  }
});

function goBack() {
  if (currentClass.value) {
    router.push(
      `/dashboard/courses/templates/${currentClass.value.templateId}/classes`,
    );
  } else {
    router.push("/dashboard/courses/templates");
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto pb-12">
    <div class="mb-6">
      <Button
        label="返回班級列表"
        icon="pi pi-arrow-left"
        text
        class="text-slate-500 hover:text-slate-800"
        @click="goBack"
      />
    </div>

    <div v-if="isLoading" class="flex justify-center p-12">
      <ProgressSpinner />
    </div>

    <template v-else-if="currentClass">
      <!-- Class Header -->
      <div
        class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
      >
        <div>
          <div class="flex items-center gap-3 mb-2">
            <Tag
              :value="currentClass.status === 'SETUP' ? '準備中' : '進行中'"
              :severity="
                currentClass.status === 'SETUP' ? 'secondary' : 'success'
              "
            />
            <span class="text-slate-500">ID: {{ currentClass.id }}</span>
          </div>
          <h1 class="text-3xl font-bold text-slate-800">
            {{ currentClass.name }}
          </h1>
        </div>

        <div class="flex gap-3">
          <Button
            label="編輯設定"
            icon="pi pi-cog"
            outlined
            class="text-slate-600 border-slate-300"
          />
          <Button
            v-if="currentClass.status === 'SETUP'"
            label="正式開課"
            icon="pi pi-play"
            class="bg-emerald-600 hover:bg-emerald-700 border-none shadow-md"
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Left Col: Students -->
        <div class="lg:col-span-2">
          <ClassStudentList :classId="currentClass.id" :students="students" />
        </div>

        <!-- Right Col: Schedule & Info -->
        <div class="space-y-8">
          <!-- Info Card -->
          <div
            class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
          >
            <h3 class="text-lg font-bold text-slate-800 mb-4 border-b pb-2">
              班級資訊
            </h3>
            <div class="space-y-4 text-base">
              <div>
                <span class="text-slate-500 block text-sm">授課老師</span>
                <span class="font-medium text-slate-700">{{
                  currentClass.teacherIds.length > 0
                    ? "已指派 " + currentClass.teacherIds.length + " 位"
                    : "未指派"
                }}</span>
              </div>
              <div>
                <span class="text-slate-500 block text-sm">建立時間</span>
                <span class="font-medium text-slate-700">{{
                  new Date(currentClass.createdAt).toLocaleDateString("zh-TW")
                }}</span>
              </div>
            </div>
          </div>

          <!-- Schedule Card -->
          <div
            class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm"
          >
            <div class="flex justify-between items-center border-b pb-2 mb-4">
              <h3 class="text-lg font-bold text-slate-800">
                課表 ({{ currentClass.sessions.length }}堂)
              </h3>
            </div>

            <div class="space-y-3">
              <div
                v-for="(session, idx) in currentClass.sessions"
                :key="session.sessionId"
                class="flex gap-4 items-start p-3 bg-slate-50 rounded-lg"
              >
                <div
                  class="bg-slate-200 text-slate-600 font-bold px-3 py-1 rounded text-sm mt-1"
                >
                  第 {{ idx + 1 }} 堂
                </div>
                <div>
                  <div class="font-medium text-slate-800">
                    {{
                      new Date(session.startTime).toLocaleDateString("zh-TW")
                    }}
                  </div>
                  <div class="text-sm text-slate-500">
                    {{
                      new Date(session.startTime).toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                    -
                    {{
                      new Date(session.endTime).toLocaleTimeString("zh-TW", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
