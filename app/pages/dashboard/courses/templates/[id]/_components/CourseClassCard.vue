<script setup lang="ts">
import { ref, computed } from "vue";
import type { CourseClass } from "~/types/course-class";

const props = defineProps<{
  courseClass: CourseClass;
}>();

const statusLabel = computed(() => {
  switch (props.courseClass.status) {
    case "SETUP":
      return "準備中";
    case "IN_PROGRESS":
      return "進行中";
    case "COMPLETED":
      return "已結業";
    default:
      return "未知";
  }
});

const statusSeverity = computed(() => {
  switch (props.courseClass.status) {
    case "SETUP":
      return "secondary";
    case "IN_PROGRESS":
      return "success";
    case "COMPLETED":
      return "info";
    default:
      return "secondary";
  }
});
</script>

<template>
  <div
    class="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col h-full"
    @click="$emit('click')"
  >
    <div class="flex justify-between items-start mb-3">
      <h3 class="text-xl font-bold text-slate-800 leading-tight">
        {{ courseClass.name }}
      </h3>
      <Tag :value="statusLabel" :severity="statusSeverity" rounded></Tag>
    </div>

    <div class="flex-grow">
      <div class="text-slate-600 text-base mb-2 flex items-center gap-2">
        <i class="pi pi-users text-slate-400"></i>
        <!-- TODO: Replace with real teacher names if populated from API -->
        <span
          >老師:
          {{
            courseClass.teacherIds.length > 0
              ? courseClass.teacherIds.length + " 位"
              : "未指派"
          }}</span
        >
      </div>
      <div class="text-slate-600 text-base flex items-center gap-2">
        <i class="pi pi-calendar text-slate-400"></i>
        <span>總堂數: {{ courseClass.sessions.length }}</span>
      </div>
    </div>

    <div class="mt-4 pt-4 border-t border-slate-100 flex justify-end">
      <Button
        label="管理班級"
        icon="pi pi-arrow-right"
        iconPos="right"
        text
        size="small"
      />
    </div>
  </div>
</template>
