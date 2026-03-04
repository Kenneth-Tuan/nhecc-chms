<script setup lang="ts">
/**
 * Member Course Records Component
 * Tab 2 content for Quick View Modal.
 */
import type { MemberCourseRecord } from '~/types/member';

defineProps<{
  courseRecords: MemberCourseRecord[];
}>();

const statusSeverity: Record<string, string> = {
  Completed: 'success',
  Failed: 'danger',
  InProgress: 'info',
};

const statusLabel: Record<string, string> = {
  Completed: '畢業',
  Failed: '未通過',
  InProgress: '進行中',
};
</script>

<template>
  <div>
    <DataTable
      v-if="courseRecords.length > 0"
      :value="courseRecords"
      stripedRows
      class="!border-none"
    >
      <Column field="courseName" header="課程名稱">
        <template #body="{ data }">
          <span class="text-sm font-medium">{{ data.courseName }}</span>
        </template>
      </Column>

      <Column field="completionDate" header="完成日期">
        <template #body="{ data }">
          <span class="text-sm text-slate-500">{{ data.completionDate || '-' }}</span>
        </template>
      </Column>

      <Column field="status" header="狀態">
        <template #body="{ data }">
          <Tag
            :value="statusLabel[data.status] || data.status"
            :severity="(statusSeverity[data.status] as any) || 'info'"
            class="!text-xs"
          />
        </template>
      </Column>
    </DataTable>

    <div v-else class="text-center py-8 text-slate-400">
      <i class="pi pi-book text-4xl mb-3" />
      <p>尚無修課紀錄</p>
    </div>
  </div>
</template>
