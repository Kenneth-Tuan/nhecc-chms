<script setup lang="ts">
/**
 * Member Basic Info Component
 * Tab 1 content for Quick View Modal.
 */
import type { MemberDetail } from "~/types/member";

const props = defineProps<{
  member: MemberDetail;
}>();

const genderLabel = computed(() =>
  props.member.gender === "Male" ? "男" : "女",
);
const genderIcon = computed(() =>
  props.member.gender === "Male" ? "pi pi-mars" : "pi pi-venus",
);
const genderColor = computed(() =>
  props.member.gender === "Male" ? "text-blue-500" : "text-pink-500",
);

const statusSeverity: Record<string, string> = {
  Active: "success",
  Inactive: "secondary",
  Suspended: "danger",
};

const statusLabel: Record<string, string> = {
  Active: "啟用",
  Inactive: "停用",
  Suspended: "停權",
};
</script>

<template>
  <div class="flex flex-col lg:flex-row gap-8 p-4">
    <!-- Left Panel: Profile Summary Card -->
    <div
      class="flex flex-col items-center gap-4 lg:w-64 shrink-0 p-6 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-100 dark:border-slate-800"
    >
      <div class="relative">
        <Avatar
          :label="member.fullName?.charAt(0)"
          :image="member.avatar"
          shape="circle"
          class="!w-24 !h-24 !text-3xl !bg-primary-100 dark:!bg-primary-900/40 !text-primary !border-4 !border-white dark:!border-slate-800 shadow-sm"
        />
        <div class="absolute -bottom-1 -right-1">
          <Tag
            :value="statusLabel[member.status]"
            :severity="statusSeverity[member.status] as any"
            class="!text-xs !px-2 shadow-sm"
          />
        </div>
      </div>

      <div class="text-center space-y-1">
        <h2 class="font-bold text-xl text-slate-900 dark:text-white">
          {{ member.fullName }}
        </h2>
        <div class="flex flex-wrap gap-1.5 justify-center">
          <Tag
            v-for="role in member.roleNames"
            :key="role"
            :value="role"
            severity="info"
            class="!text-[10px] !bg-sky-50 dark:!bg-sky-900/20 !text-sky-600 dark:!text-sky-400 !border-sky-100 dark:!border-sky-800"
          />
        </div>
      </div>
    </div>

    <!-- Right Panel: Detailed Info -->
    <div class="flex-1 space-y-8">
      <!-- Section: Basic Info -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center"
          >
            <i class="pi pi-user text-blue-600 dark:text-blue-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">
            基本資訊
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 px-2">
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >姓名</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.fullName }}
            </p>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >性別</span
            >
            <div
              class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"
            >
              <i :class="[genderIcon, genderColor]" />
              {{ genderLabel }}
            </div>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >出生年月日 (年齡)</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.dob }}
              <span
                class="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
                >({{ member.age }} 歲)</span
              >
            </p>
          </div>
        </div>
      </section>

      <Divider />

      <!-- Section: Contact Info -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center"
          >
            <i class="pi pi-phone text-orange-600 dark:text-orange-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">
            聯絡資訊
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 px-2">
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >手機</span
            >
            <p class="text-sm text-slate-900 dark:text-white">{{ member.mobile }}</p>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >Email</span
            >
            <p class="text-sm text-slate-900 dark:text-white">{{ member.email }}</p>
          </div>
          <div v-if="member.lineId" class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >Line ID</span
            >
            <p class="text-sm text-slate-900 dark:text-white">{{ member.lineId }}</p>
          </div>
          <div v-if="member.address" class="space-y-2">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >通訊地址</span
            >
            <p class="text-sm text-slate-900 dark:text-white">{{ member.address }}</p>
          </div>
        </div>
      </section>

      <Divider />

      <!-- Section: Emergency Contact -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center"
          >
            <i
              class="pi pi-exclamation-triangle text-red-600 dark:text-red-400"
            />
          </div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">
            緊急聯絡人
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 px-2">
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >姓名</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.emergencyContactName || "-" }}
            </p>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >關係</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.emergencyContactRelationship || "-" }}
            </p>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >電話</span
            >
            <p class="text-sm text-slate-900 dark:text-white">
              {{ member.emergencyContactPhone || "-" }}
            </p>
          </div>
        </div>
      </section>

      <Divider />

      <!-- Section: Church Info -->
      <section>
        <div class="flex items-center gap-3 mb-4">
          <div
            class="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center"
          >
            <i class="pi pi-building text-green-600 dark:text-green-400" />
          </div>
          <h3 class="text-lg font-bold text-slate-800 dark:text-slate-200">
            教會資訊
          </h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 px-2">
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >受洗狀態</span
            >
            <div
              class="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white"
            >
              <i
                :class="[
                  member.baptismStatus
                    ? 'pi pi-check-circle text-green-500'
                    : 'pi pi-minus-circle text-slate-300',
                ]"
              />
              {{ member.baptismStatus ? "已受洗" : "未受洗" }}
              <span
                v-if="member.baptismDate"
                class="text-sm font-medium text-slate-500 dark:text-slate-400 ml-1"
                >({{ member.baptismDate }})</span
              >
            </div>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >牧區</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.zoneName || "未分配" }}
            </p>
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >小組</span
            >
            <p class="text-base font-bold text-slate-900 dark:text-white">
              {{ member.groupName || "待分發" }}
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
