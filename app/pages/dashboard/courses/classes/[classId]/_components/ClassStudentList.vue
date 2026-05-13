<script setup lang="ts">
import type { CourseEnrollmentStatus } from "~/types/course-enrollment";

type TagSeverity = "success" | "info" | "warn" | "danger" | "secondary";

interface ClassStudentListItem {
  id: string;
  userId: string;
  name: string;
  mobile: string;
  status: CourseEnrollmentStatus;
  completedDate?: string;
}

const props = defineProps<{
  classId: string;
  students: ClassStudentListItem[];
  canManage?: boolean;
}>();

function getEnrollmentStatusLabel(status: CourseEnrollmentStatus): string {
  switch (status) {
    case "PENDING_WAITLIST":
      return "等候中";
    case "ASSIGNED":
      return "已指派";
    case "IN_PROGRESS":
      return "修課中";
    case "COMPLETED":
      return "已完成";
    case "DROPPED":
      return "已退出";
    default:
      return status satisfies never;
  }
}

function getEnrollmentStatusSeverity(status: CourseEnrollmentStatus): TagSeverity {
  switch (status) {
    case "PENDING_WAITLIST":
      return "warn";
    case "ASSIGNED":
      return "info";
    case "IN_PROGRESS":
      return "success";
    case "COMPLETED":
      return "secondary";
    case "DROPPED":
      return "danger";
    default:
      return status satisfies never;
  }
}
</script>

<template>
  <div
    class="bg-surface-0 dark:bg-surface-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-sm"
  >
    <div class="flex justify-between items-center mb-8 pb-4 border-b">
      <h3
        class="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3"
      >
        <i class="pi pi-users text-blue-600 text-2xl"></i>
        學生名單 ({{ students.length }})
      </h3>
      <Button
        v-if="canManage"
        label="指派學生"
        icon="pi pi-user-plus"
        outlined
        class="text-base px-6 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700"
      />
    </div>

    <DataTable
      :value="students"
      stripedRows
      :paginator="true"
      :rows="10"
      class="text-base"
    >
      <template #empty>
        <div class="text-center py-12 text-slate-500 text-base">
          目前尚未指派任何學生。
        </div>
      </template>
      <Column field="name" header="姓名"></Column>
      <Column field="mobile" header="聯絡電話"></Column>
      <Column field="status" header="狀態">
        <template #body="{ data }">
          <Tag
            :value="getEnrollmentStatusLabel(data.status)"
            :severity="getEnrollmentStatusSeverity(data.status)"
            class="text-base px-3 py-1"
          />
        </template>
      </Column>
      <Column v-if="canManage" header="操作">
        <template #body>
          <Button
            icon="pi pi-times"
            text
            severity="danger"
            rounded
            class="p-2"
            aria-label="移除"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
