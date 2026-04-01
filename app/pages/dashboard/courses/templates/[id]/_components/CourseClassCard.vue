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
    class="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full group"
    @click="$emit('click')"
  >
    <div class="flex justify-between items-start mb-4">
      <h3 class="text-xl font-bold text-slate-800 leading-tight group-hover:text-blue-600 transition-colors">
        {{ courseClass.name }}
      </h3>
      <Tag :value="statusLabel" :severity="statusSeverity" class="text-base px-3 py-1 font-bold" rounded></Tag>
    </div>

    <div class="flex-grow space-y-3">
      <div class="text-slate-600 text-base flex items-center gap-3">
        <i class="pi pi-users text-slate-400 text-lg"></i>
        <span>
          授課老師:
          <span class="font-bold text-slate-700">
            {{
              courseClass.teachers && courseClass.teachers.length > 0
                ? courseClass.teachers.length + " 位"
                : "未指派"
            }}
          </span>
        </span>
      </div>
      <div class="text-slate-600 text-base flex items-center gap-3">
        <i class="pi pi-calendar text-slate-400 text-lg"></i>
        <span>總堂數: <span class="font-bold text-slate-700">{{ courseClass.sessions.length }}</span></span>
      </div>
    </div>

    <div class="mt-6 pt-5 border-t border-slate-100 flex justify-end">
      <Button
        label="管理班級"
        icon="pi pi-arrow-right"
        iconPos="right"
        text
        class="text-base font-bold text-blue-600"
      />
    </div>
  </div>
</template>
