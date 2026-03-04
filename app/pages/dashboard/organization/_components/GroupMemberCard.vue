<script setup lang="ts">
import dayjs from "dayjs";

const props = defineProps<{ member: any }>();

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return dayjs(dateStr).format("YYYY/MM/DD");
}

function statusSeverity(
  status: string,
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
    <div class="grid grid-cols-12 gap-4 flex-1 items-center w-full min-w-0">
      <!-- Name -->
      <div class="col-span-12 sm:col-span-3">
        <p class="font-bold text-sm text-slate-800 dark:text-slate-200">
          {{ member.fullName }}
        </p>
      </div>

      <!-- Role -->
      <div class="col-span-12 sm:col-span-2 hidden sm:block">
        <span class="text-sm text-slate-600">{{ member.roleLabel }}</span>
      </div>

      <!-- Mobile -->
      <div class="col-span-12 sm:col-span-3 hidden md:block">
        <span class="text-sm text-slate-500">{{ member.mobile }}</span>
      </div>

      <!-- Date -->
      <div class="col-span-12 sm:col-span-2 hidden lg:block">
        <span class="text-sm text-slate-500">{{
          formatDate(member.createdAt)
        }}</span>
      </div>

      <!-- Status -->
      <div class="col-span-12 sm:col-span-2 flex justify-end">
        <Tag
          :value="statusLabel[member.status] || member.status"
          :severity="statusSeverity(member.status)"
        />
      </div>
    </div>
  </div>
</template>
