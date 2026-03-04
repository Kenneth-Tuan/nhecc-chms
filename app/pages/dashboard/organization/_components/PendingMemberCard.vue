<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{ member: any }>();
const emit = defineEmits<{ (e: "assign", member: any): void }>();

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("YYYY/MM/DD");
}
</script>

<template>
  <div
    class="inline-flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 cursor-grab select-none transition-all active:cursor-grabbing w-full"
  >
    <Avatar
      :label="member.fullName?.charAt(0)"
      shape="circle"
      size="normal"
      :class="
        member.gender === 'Male'
          ? '!bg-blue-100 !text-blue-600'
          : '!bg-pink-100 !text-pink-600'
      "
    />
    <div class="min-w-0 flex-1">
      <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
        {{ member.fullName }}
      </p>
      <p class="text-[10px] text-slate-400 truncate">
        加入: {{ formatDate(member.createdAt) }}
      </p>
    </div>
    <Button
      icon="pi pi-arrow-right"
      text
      rounded
      size="small"
      class="!ml-1"
      v-tooltip.top="'點擊分配'"
      @click.stop="emit('assign', member)"
    />
  </div>
</template>
