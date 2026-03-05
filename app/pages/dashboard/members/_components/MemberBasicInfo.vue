<script setup lang="ts">
/**
 * Member Basic Info Component
 * Tab 1 content for Quick View Modal.
 */
import type { MemberDetail } from "~/types/member";
import MemberRevealButton from "./MemberRevealButton.vue";

const props = defineProps<{
  member: MemberDetail;
}>();

const auth = useAuth();

const { revealAll, isRevealing: isRevealingAll } = useRevealSensitiveData();

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

// Show "Reveal All" dialog
const showRevealAllDialog = ref(false);

async function confirmRevealAll(): Promise<void> {
  await revealAll(props.member.uuid);
  showRevealAllDialog.value = false;
}
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

      <!-- Reveal All Button integrated into sidebar -->
      <Button
        v-if="auth.can('reveal', 'Member', 'mobile')"
        label="顯示敏感資料"
        icon="pi pi-eye"
        size="small"
        severity="warn"
        text
        class="mt-4 !text-xs w-full"
        @click="showRevealAllDialog = true"
      />
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
            <MemberRevealButton
              :member-id="member.uuid"
              field="mobile"
              :masked-value="member.mobile"
              :can-reveal="member.mobileMeta.canReveal"
            />
          </div>
          <div class="space-y-1">
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >Email</span
            >
            <MemberRevealButton
              :member-id="member.uuid"
              field="email"
              :masked-value="member.email"
              :can-reveal="member.emailMeta.canReveal"
            />
          </div>
          <div
            v-if="member.lineId || member.lineIdMeta.canReveal"
            class="space-y-1"
          >
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >Line ID</span
            >
            <MemberRevealButton
              :member-id="member.uuid"
              field="lineId"
              :masked-value="member.lineId || '未提供'"
              :can-reveal="member.lineIdMeta.canReveal"
            />
          </div>
          <div
            v-if="member.address || member.addressMeta.canReveal"
            class="space-y-2"
          >
            <span
              class="text-xs sm:text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase"
              >通訊地址</span
            >
            <MemberRevealButton
              :member-id="member.uuid"
              field="address"
              :masked-value="member.address || '未提供'"
              :can-reveal="member.addressMeta.canReveal"
            />
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
            <MemberRevealButton
              :member-id="member.uuid"
              field="emergencyContactPhone"
              :masked-value="member.emergencyContactPhone || '-'"
              :can-reveal="member.emergencyContactPhoneMeta.canReveal"
            />
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

    <!-- Reveal All Confirmation Dialog -->
    <Dialog
      v-model:visible="showRevealAllDialog"
      header="確認顯示所有敏感資料"
      :modal="true"
      :style="{ width: '400px' }"
    >
      <div class="flex items-center gap-3">
        <i class="pi pi-eye text-amber-500 text-3xl" />
        <p class="text-sm">
          確定要顯示此會友的所有敏感資料嗎？
          <br />
          <span class="text-slate-500">此操作將會記錄於審計日誌中。</span>
        </p>
      </div>
      <template #footer>
        <Button
          label="取消"
          severity="secondary"
          outlined
          @click="showRevealAllDialog = false"
        />
        <Button
          label="確認顯示"
          severity="warn"
          :loading="isRevealingAll"
          @click="confirmRevealAll"
        />
      </template>
    </Dialog>
  </div>
</template>
