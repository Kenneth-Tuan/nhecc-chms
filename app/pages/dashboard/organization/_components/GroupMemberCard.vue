<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{ member: any }>();

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("YYYY/MM/DD");
}

function statusSeverity(
  status: string
): "success" | "warn" | "danger" | "secondary" {
  const map: Record<string, "success" | "warn" | "danger" | "secondary"> = {
    Active: "success",
    Inactive: "secondary",
    Suspended: "warn",
    Deleted: "danger",
  };
  return map[status] || "secondary";
}

const statusLabel: Record<string, string> = {
  Active: "活躍",
  Inactive: "停用",
  Suspended: "請假中",
  Deleted: "已刪除",
};
</script>

<template>
  <div
    class="inline-flex w-fit max-w-full items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 cursor-grab select-none transition-all active:cursor-grabbing text-nowrap"
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
    <div class="inline-flex items-center gap-4">
      <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
        {{ member.fullName }}
      </p>
      <span class="hidden text-sm text-slate-600 sm:inline">{{
        member.roleLabel
      }}</span>
      <!-- <span class="hidden text-sm text-slate-500 md:inline">{{
        member.mobile
      }}</span>
      <span class="hidden text-sm text-slate-500 lg:inline">{{
        formatDate(member.createdAt)
      }}</span> -->
      <Tag
        :value="statusLabel[member.status] || member.status"
        :severity="statusSeverity(member.status)"
      />
    </div>
  </div>
</template>
