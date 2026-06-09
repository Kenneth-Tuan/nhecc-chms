<script setup lang="ts">
import type { CourseClass } from "~/types/course-class";
import ClassStudentList from "./_components/ClassStudentList.vue";
import ClassForm from "../_components/ClassForm.vue";
import BasePageContainer from "~/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "~/pages/dashboard/_components/BasePageHeader.vue";
import AssignStudentsDialog from "./_components/AssignStudentsDialog.vue";

definePageMeta({
  layout: "dashboard",
});

const route = useRoute();
const router = useRouter();
const toast = useToast();
const confirm = useConfirm();
const auth = useAuth();

const classId = computed(() => route.params.classId as string);
const {
  fetchClassById,
  fetchClassStudents,
  updateClass,
  startCourse,
  concludeCourse,
  deleteCourseClass,
  isCreating,
  isStarting,
  isConcluding,
  isDeleting,
} = useCourseClass();
const currentClass = ref<
  (CourseClass & { templateName: string; templateCode: string }) | null
>(null);
const students = ref<any[]>([]);
const isLoading = ref(false);
const showEditDialog = ref(false);
const showAssignDialog = ref(false);

const canManageCourseClass = computed(() => {
  if (!currentClass.value) return false;
  return auth.can("manage", {
    ...currentClass.value,
    __type: "CourseClass",
  } as any);
});

const canDeleteCourseClass = computed(() => {
  if (!currentClass.value) return false;
  return auth.can("delete", {
    ...currentClass.value,
    __type: "CourseClass",
  } as any);
});

const canAssignStudents = computed(() => {
  return canManageCourseClass.value && currentClass.value?.status === "SETUP";
});

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

async function handleStudentAssigned() {
  try {
    const [classData, studentData] = await Promise.all([
      fetchClassById(classId.value),
      fetchClassStudents(classId.value),
    ]);
    currentClass.value = classData;
    students.value = studentData;
  } catch (error: any) {
    console.error("Refresh class details failed:", error);
    toast.add({
      severity: "error",
      summary: "重新載入失敗",
      detail: error.message || "無法更新學生名單",
      life: 3000,
    });
  }
}

function goBack() {
  if (currentClass.value) {
    router.push(
      `/dashboard/courses/templates/${currentClass.value.templateId}/classes`
    );
  } else {
    router.push("/dashboard/courses/templates");
  }
}

async function handleUpdateClass(formData: any) {
  if (!currentClass.value || !canManageCourseClass.value) return;
  try {
    const updated = await updateClass(classId.value, formData);
    currentClass.value = {
      ...currentClass.value,
      ...updated,
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

function getStatusLabel(status: CourseClass["status"]) {
  switch (status) {
    case "SETUP":
      return "準備中";
    case "IN_PROGRESS":
      return "進行中";
    case "COMPLETED":
      return "已結業";
    default:
      return status;
  }
}

function getStatusSeverity(status: CourseClass["status"]) {
  switch (status) {
    case "SETUP":
      return "secondary";
    case "IN_PROGRESS":
      return "success";
    case "COMPLETED":
      return "info";
    default:
      return "secondary";
  }
}

async function handleStartCourse() {
  if (!currentClass.value || !canManageCourseClass.value) return;

  try {
    const updated = await startCourse(classId.value);
    currentClass.value = {
      ...currentClass.value,
      ...updated,
    };
    students.value = await fetchClassStudents(classId.value);

    toast.add({
      severity: "success",
      summary: "已正式開課",
      detail: "班級與已指派學員狀態已更新為進行中",
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "開課失敗",
      detail: error.data?.message || error.message || "無法正式開課",
      life: 5000,
    });
  }
}

function confirmStartCourse() {
  if (!currentClass.value) return;

  confirm.require({
    message: `確定要將「${currentClass.value.name}」正式開課嗎？開課後已指派學員會進入修課中，且前台不可再報名此班級。`,
    header: "正式開課確認",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-success",
    acceptLabel: "確認開課",
    rejectLabel: "取消",
    accept: handleStartCourse,
  });
}

async function handleConcludeCourse() {
  if (!currentClass.value || !canManageCourseClass.value) return;

  try {
    const updated = await concludeCourse(classId.value);
    currentClass.value = {
      ...currentClass.value,
      ...updated,
    };
    students.value = await fetchClassStudents(classId.value);

    toast.add({
      severity: "success",
      summary: "已完成結業",
      detail: "進行中的學員狀態已更新為已完成",
      life: 3000,
    });
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "結業失敗",
      detail: error.data?.message || error.message || "無法結業課程",
      life: 5000,
    });
  }
}

function confirmConcludeCourse() {
  if (!currentClass.value) return;

  confirm.require({
    message: `確定要將「${currentClass.value.name}」結業嗎？進行中的學員會被標記為已完成並取得學分。`,
    header: "結業確認",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-info",
    acceptLabel: "確認結業",
    rejectLabel: "取消",
    accept: handleConcludeCourse,
  });
}

async function handleDeleteCourseClass() {
  if (!currentClass.value || !canDeleteCourseClass.value) return;

  try {
    await deleteCourseClass(classId.value);
    toast.add({
      severity: "success",
      summary: "刪除成功",
      detail: "班級已成功刪除",
      life: 3000,
    });
    router.push("/dashboard/courses/classes");
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "刪除失敗",
      detail: error.data?.message || error.message || "無法刪除班級",
      life: 5000,
    });
  }
}

function confirmDeleteCourseClass() {
  if (!currentClass.value) return;

  confirm.require({
    message: `確定要刪除「${currentClass.value.name}」嗎？此操作無法復原。`,
    header: "刪除班級確認",
    icon: "pi pi-exclamation-triangle",
    acceptClass: "p-button-danger",
    acceptLabel: "確認刪除",
    rejectLabel: "取消",
    accept: handleDeleteCourseClass,
  });
}
</script>

<template>
  <BasePageContainer>
    <ConfirmDialog />

    <Dialog
      v-if="canManageCourseClass"
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

    <AssignStudentsDialog
      v-if="canAssignStudents"
      v-model:visible="showAssignDialog"
      :classId="classId"
      @assigned="handleStudentAssigned"
    />

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
        class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-2xl p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8"
      >
        <div>
          <div class="flex items-center gap-3 mb-2">
            <Tag
              :value="getStatusLabel(currentClass.status)"
              :severity="getStatusSeverity(currentClass.status)"
              class="text-base px-3 py-1"
            />
            <span class="text-slate-500 font-mono text-base"
              >ID: {{ currentClass.id }}</span
            >
          </div>
          <h1 class="text-3xl font-bold text-slate-900 dark:text-surface-0">
            {{ currentClass.name }}
          </h1>
          <p
            v-if="currentClass.description"
            class="text-slate-500 text-base mt-2 max-w-2xl"
          >
            {{ currentClass.description }}
          </p>
        </div>

        <div v-if="canManageCourseClass" class="flex gap-4">
          <Button
            label="編輯班級"
            icon="pi pi-cog"
            outlined
            class="text-slate-600 dark:text-surface-400 border-slate-300 dark:border-surface-700 text-base px-6"
            @click="showEditDialog = true"
          />
          <Button
            v-if="canDeleteCourseClass && currentClass.status === 'SETUP' && (!currentClass.enrollmentCount || currentClass.enrollmentCount === 0)"
            label="刪除班級"
            icon="pi pi-trash"
            severity="danger"
            outlined
            :loading="isDeleting"
            class="text-base px-6"
            @click="confirmDeleteCourseClass"
          />
          <Button
            v-if="currentClass.status === 'SETUP'"
            label="正式開課"
            icon="pi pi-play"
            :loading="isStarting"
            class="bg-emerald-600 dark:bg-emerald-700 hover:bg-emerald-700 dark:hover:bg-emerald-800 border-none shadow-lg shadow-emerald-100 dark:shadow-emerald-900 text-base px-8 py-3 font-bold text-white dark:text-white"
            @click="confirmStartCourse"
          />
          <Button
            v-if="currentClass.status === 'IN_PROGRESS'"
            label="結業課程"
            icon="pi pi-flag"
            severity="info"
            :loading="isConcluding"
            class="text-base px-8 py-3 font-bold"
            @click="confirmConcludeCourse"
          />
        </div>
      </div>

      <!-- Main Content Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
        <!-- Left Col: Students + Attendance -->
        <div class="lg:col-span-2 space-y-8">
          <ClassStudentList
            :classId="currentClass.id"
            :students="students"
            :can-manage="canAssignStudents"
            @assign-click="showAssignDialog = true"
          />
          <CourseClassAttendancePanel
            :class-id="currentClass.id"
            :sessions="currentClass.sessions"
            :can-edit="canManageCourseClass"
          />
        </div>

        <!-- Right Col: Schedule & Info -->
        <div class="space-y-8">
          <!-- Info Card -->
          <div
            class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-xl p-8 shadow-sm"
          >
            <h3
              class="text-xl font-bold text-slate-900 dark:text-surface-0 mb-6 border-b pb-3"
            >
              班級概況
            </h3>
            <div class="space-y-6">
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">授課老師</span>
                <span
                  class="font-bold dark:font-bold text-slate-700 dark:text-surface-200 text-base"
                >
                  {{
                    currentClass.teachers.length > 0
                      ? currentClass.teachers.map((t: any) => t.name).join(", ")
                      : "未指派"
                  }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">上課地點</span>
                <span
                  class="font-bold dark:font-bold text-slate-700 dark:text-surface-200 text-base"
                  >{{ currentClass.location }}</span
                >
              </div>
              <div
                v-if="currentClass.meetingLink"
                class="flex justify-between items-center"
              >
                <span class="text-slate-500 text-base">線上連結</span>
                <a
                  :href="currentClass.meetingLink"
                  target="_blank"
                  class="text-blue-600 dark:text-blue-400 hover:underline font-bold text-sm truncate max-w-[150px]"
                >
                  {{ currentClass.meetingLink }}
                </a>
              </div>
              <div
                v-if="currentClass.scheduleDescription"
                class="flex justify-between items-center"
              >
                <span class="text-slate-500 text-base">時間備註</span>
                <span
                  class="font-bold dark:font-bold text-slate-700 dark:text-surface-200 text-sm text-right max-w-[150px]"
                >
                  {{ currentClass.scheduleDescription }}
                </span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-500 text-base">建立日期</span>
                <span
                  class="font-bold dark:font-bold text-slate-700 dark:text-surface-200 text-base"
                  >{{
                    new Date(currentClass.createdAt).toLocaleDateString("zh-TW")
                  }}</span
                >
              </div>
            </div>
          </div>

          <!-- Schedule Card -->
          <div
            class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-surface-700 rounded-xl p-8 shadow-sm"
          >
            <div class="flex justify-between items-center border-b pb-3 mb-6">
              <h3 class="text-xl font-bold text-slate-900 dark:text-surface-0">
                課程表 ({{ currentClass.sessions.length }} 堂)
              </h3>
            </div>

            <div class="space-y-4">
              <div
                v-for="(session, idx) in currentClass.sessions"
                :key="session.sessionId"
                class="flex gap-4 items-start p-4 bg-slate-50 dark:bg-surface-800 rounded-xl hover:bg-slate-100 dark:hover:bg-surface-700 transition-colors"
              >
                <div
                  class="bg-slate-200 dark:bg-surface-800 text-slate-700 dark:text-surface-200 font-bold px-4 py-1 rounded text-base mt-1"
                >
                  {{ idx + 1 }}
                </div>
                <div>
                  <div
                    class="font-bold dark:font-bold text-slate-900 dark:text-surface-0 text-base leading-tight"
                  >
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
