<script setup lang="ts">
import { ref } from "vue";
import type { CreateCourseClassPayload } from "~/types/course-class";

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
  teacherIds: [] as string[],
  sessions: [] as any[],
});

// TODO: Replace with actual member fetch
const dummyTeachers = [
  { label: "王牧師", value: "teacher_1" },
  { label: "李執事", value: "teacher_2" },
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
    const payload: CreateCourseClassPayload = {
      templateId: props.templateId,
      name: formData.value.name,
      teacherIds: formData.value.teacherIds,
      sessions: formData.value.sessions,
      status: "SETUP",
      currentSessionId: null,
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
    :style="{ width: '500px' }"
    class="p-fluid"
  >
    <div class="flex flex-col gap-6 py-2">
      <!-- 班級名稱 -->
      <div class="flex flex-col gap-2">
        <label for="className" class="font-bold text-slate-700 text-lg"
          >班級名稱 <span class="text-red-500">*</span></label
        >
        <InputText
          id="className"
          v-model="formData.name"
          placeholder="例如：2026 春季啟發小組"
          class="text-lg p-3"
        />
      </div>

      <!-- 授課老師 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-lg">授課老師</label>
        <MultiSelect
          v-model="formData.teacherIds"
          :options="dummyTeachers"
          optionLabel="label"
          optionValue="value"
          placeholder="請選擇老師"
          class="text-lg"
        />
        <small class="text-slate-500">可不選，或之後再指派</small>
      </div>

      <!-- 課表設定 (簡化版) -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-lg">課表設定</label>
        <div
          class="bg-slate-50 p-4 rounded-lg border border-slate-200 text-center text-slate-500"
        >
          <i class="pi pi-calendar-plus mb-2 text-2xl"></i>
          <p>排課系統開發中，目前將建立無預定時間的班級。</p>
        </div>
      </div>
    </div>

    <template #footer>
      <Button
        label="取消"
        icon="pi pi-times"
        text
        @click="closeDialog"
        class="text-lg"
      />
      <Button
        label="建立班級"
        icon="pi pi-check"
        @click="handleSave"
        :loading="isCreating"
        class="text-lg"
      />
    </template>
  </Dialog>
</template>
