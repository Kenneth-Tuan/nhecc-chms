<script setup lang="ts">
import { ref } from "vue";
import type { CreateCourseClassPayload, CourseTeacher } from "~/types/course-class";

const props = defineProps<{
  visible: boolean;
  templateId: string;
}>();

const emit = defineEmits<{
  "update:visible": [value: boolean];
  saved: [];
}>();

const { createClass, isCreating } = useCourseClass();
const toast = useToast();

const formData = ref({
  name: "",
  teachers: [] as CourseTeacher[],
  sessions: [] as any[],
});

// TODO: Replace with actual member fetch
const dummyTeachers: CourseTeacher[] = [
  { name: "王牧師", id: "teacher_1" },
  { name: "李執事", id: "teacher_2" },
];

function closeDialog() {
  emit("update:visible", false);
}

async function handleSave() {
  if (!formData.value.name) {
    toast.add({
      severity: "warn",
      summary: "提示",
      detail: "請輸入班級名稱",
      life: 3000,
    });
    return;
  }

  try {
    const payload: any = {
      templateId: props.templateId,
      name: formData.value.name,
      teachers: formData.value.teachers,
      sessions: formData.value.sessions,
      status: "SETUP",
      currentSessionId: null,
      startDate: new Date().toISOString(), // 預設值
      endDate: new Date().toISOString(),   // 預設值
      location: "未定",
      description: "",
      maxCapacity: 30,
      enrollmentCount: 0,
      attachments: [],
      isPublished: false,
    };

    await createClass(payload);
    toast.add({
      severity: "success",
      summary: "成功",
      detail: "班級建立成功",
      life: 3000,
    });
    emit("saved");
    closeDialog();
  } catch (error: any) {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: error.data?.message || "建立失敗",
      life: 5000,
    });
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    modal
    header="建立實體班級"
    :style="{ width: '550px' }"
    class="p-fluid"
  >
    <div class="flex flex-col gap-8 py-4">
      <!-- 班級名稱 -->
      <div class="flex flex-col gap-2">
        <label for="className" class="font-bold text-slate-700 text-base"
          >正式班級名稱 <span class="text-red-500">*</span></label
        >
        <InputText
          id="className"
          v-model="formData.name"
          placeholder="例如：2026 春季啟發小組"
          class="text-base p-3"
        />
      </div>

      <!-- 授課老師 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">指派授課老師 / 同伴者</label>
        <MultiSelect
          v-model="formData.teachers"
          :options="dummyTeachers"
          optionLabel="name"
          placeholder="請選擇老師"
          display="chip"
          class="text-base"
        />
        <p class="text-slate-500 text-base mt-1">可暫不選，或之後再於管理頁面指派。</p>
      </div>

      <!-- 課表設定 (簡化版) -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">班級課表設定</label>
        <div
          class="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center text-blue-700"
        >
          <i class="pi pi-calendar-plus mb-3 text-3xl"></i>
          <p class="text-base leading-relaxed">排課輔助系統開發中，<br />目前將先建立無預定時間的空班頁面。</p>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-3 pt-4">
        <Button
          label="取消"
          text
          severity="secondary"
          @click="closeDialog"
          class="text-base px-6"
        />
        <Button
          label="確認建立班級"
          icon="pi pi-check"
          @click="handleSave"
          :loading="isCreating"
          class="text-base px-8 py-3 font-bold"
        />
      </div>
    </template>
  </Dialog>
</template>
