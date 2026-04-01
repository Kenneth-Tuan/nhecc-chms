<script setup lang="ts">
import type { CourseClass } from "~/types/course-class";
import ClassStudentList from "./_components/ClassStudentList.vue";
import ClassForm from "../_components/ClassForm.vue";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();

const classId = computed(() => route.params.classId as string);
const { fetchClassById, fetchClassStudents, updateClass, isCreating } = useCourseClass();
const currentClass = ref<(CourseClass & { templateName: string, templateCode: string }) | null>(null);
const students = ref<any[]>([]); 
const isLoading = ref(false);
const showEditDialog = ref(false);

onMounted(async () => {
  isLoading.value = true;
  try {
    const [classData, studentData] = await Promise.all([
      fetchClassById(classId.value),
      fetchClassStudents(classId.value),
    ]);
    currentClass.value = classData;
    students.value = studentData;
  } catch (error: any) {
    console.error("Fetch class details failed:", error);
    toast.add({
      severity: "error",
      summary: "載入失敗",
      detail: error.message || "無法獲取班級資料",
      life: 3000,
    });
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

async function handleUpdateClass(formData: any) {
  if (!currentClass.value) return;
  try {
    const updated = await updateClass(classId.value, formData);
    currentClass.value = { 
      ...currentClass.value, 
      ...updated 
    };
    showEditDialog.value = false;
    toast.add({
      severity: "success",
      summary: "更新成功",
      detail: "班級資料已更新",
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "更新失敗",
      detail: error.data?.message || "無法更新班級資料",
      life: 5000,
    });
  }
}
</script>

<template>
  <BasePageContainer>
    <Dialog
      v-model:visible="showEditDialog"
      header="編輯班級資料"
      modal
      class="w-full max-w-3xl"
      :content-class="'p-0'"
    >
      <div class="px-8 py-6">
        <ClassForm
          v-if="currentClass"
          :initial-data="currentClass"
          submit-label="儲存修改"
          :is-submitting="isCreating"
          @submit="handleUpdateClass"
          @cancel="showEditDialog = false"
        />
      </div>
    </Dialog>

    <!-- Header: 統一導航與基本資訊 -->
    <BasePageHeader
      v-if="currentClass"
      title="班級成員與課程管理"
      :description="`正在管理「${currentClass.name}」`"
      @back="goBack"
      class="text-base"
    />

    <div v-if="isLoading" class="flex justify-center p-12">
      <ProgressSpinner />
    </div>

    <template v-else-if="currentClass">
      <!-- Summary Card: 狀態與操作 -->
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
              class="text-base px-3 py-1"
            />
            <span class="text-slate-500 font-mono text-base"
              >ID: {{ currentClass.id }}</span
            >
          </div>
          <h1 class="text-3xl font-bold text-slate-800">
            {{ currentClass.name }}
          </h1>
          <p v-if="currentClass.description" class="text-slate-500 text-base mt-2 max-w-2xl">
            {{ currentClass.description }}
          </p>
        </div>

        <div class="flex gap-4">
          <Button
            label="編輯班級"
            icon="pi pi-cog"
            outlined
            class="text-slate-600 border-slate-300 text-base px-6"
            @click="showEditDialog = true"
          />
          <Button
            v-if="currentClass.status === 'SETUP'"
            label="正式開課"
            icon="pi pi-play"
            class="bg-emerald-600 hover:bg-emerald-700 border-none shadow-lg shadow-emerald-100 text-base px-8 py-3 font-bold"
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <!-- Left Col: Students -->
        <div class="lg:col-span-2">
          <ClassStudentList :classId="currentClass.id" :students="students" />
        </div>

        <!-- Right Col: Schedule & Info -->
        <div class="space-y-8">
          <!-- Info Card -->
          <div
            class="bg-white border border-slate-200 rounded-xl p-8 shadow-sm"
          >
            <h3 class="text-xl font-bold text-slate-800 mb-6 border-b pb-3">
              班級概況
            </h3>
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">授課老師</span>
                <span class="font-bold text-slate-700 text-base">
                  {{
                    currentClass.teachers.length > 0
                      ? currentClass.teachers.map((t: any) => t.name).join(", ")
                      : "未指派"
                  }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">上課地點</span>
                <span class="font-bold text-slate-700 text-base">{{
                  currentClass.location
                }}</span>
              </div>
              <div v-if="currentClass.meetingLink" class="flex justify-between items-center">
                <span class="text-slate-500 text-base">線上連結</span>
                <a 
                  :href="currentClass.meetingLink" 
                  target="_blank" 
                  class="text-blue-600 hover:underline font-bold text-sm truncate max-w-[150px]"
                >
                  {{ currentClass.meetingLink }}
                </a>
              </div>
              <div v-if="currentClass.scheduleDescription" class="flex justify-between items-center">
                <span class="text-slate-500 text-base">時間備註</span>
                <span class="font-bold text-slate-700 text-sm text-right max-w-[150px]">
                  {{ currentClass.scheduleDescription }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">建立日期</span>
                <span class="font-bold text-slate-700 text-base">{{
                  new Date(currentClass.createdAt).toLocaleDateString("zh-TW")
                }}</span>
              </div>
            </div>
          </div>

          <!-- Schedule Card -->
          <div
            class="bg-white border border-slate-200 rounded-xl p-8 shadow-sm"
          >
            <div class="flex justify-between items-center border-b pb-3 mb-6">
              <h3 class="text-xl font-bold text-slate-800">
                課程表 ({{ currentClass.sessions.length }} 堂)
              </h3>
            </div>

            <div class="space-y-4">
              <div
                v-for="(session, idx) in currentClass.sessions"
                :key="session.sessionId"
                class="flex gap-4 items-start p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <div
                  class="bg-slate-200 text-slate-700 font-bold px-4 py-1 rounded text-base mt-1"
                >
                  {{ idx + 1 }}
                </div>
                <div>
                  <div class="font-bold text-slate-800 text-base leading-tight">
                    {{
                      new Date(session.startTime).toLocaleDateString("zh-TW", {
                        month: "short",
                        day: "numeric",
                        weekday: "short",
                      })
                    }}
                  </div>
                  <div class="text-base text-slate-500 mt-1">
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
  </BasePageContainer>
</template>
