<script setup lang="ts">
/**
 * Member Basic Info Component
 * Tab 1 content for Quick View Modal.
 */
import type { MemberDetail } from '~/types/member';

const props = defineProps<{
  member: MemberDetail;
}>();

const auth = useAuth();

const { revealAll, isRevealing: isRevealingAll } = useRevealSensitiveData();

const genderLabel = computed(() => props.member.gender === 'Male' ? '男' : '女');
const genderIcon = computed(() => props.member.gender === 'Male' ? 'pi pi-mars' : 'pi pi-venus');
const genderColor = computed(() => props.member.gender === 'Male' ? 'text-blue-500' : 'text-pink-500');

const statusSeverity: Record<string, string> = {
  Active: 'success',
  Inactive: 'secondary',
  Suspended: 'danger',
};

const statusLabel: Record<string, string> = {
  Active: '啟用',
  Inactive: '停用',
  Suspended: '停權',
};

// Show "Reveal All" dialog
const showRevealAllDialog = ref(false);

async function confirmRevealAll(): Promise<void> {
  await revealAll(props.member.uuid);
  showRevealAllDialog.value = false;
}
</script>

<template>
  <div class="flex flex-col md:flex-row gap-6">
    <!-- Left Panel: Avatar + Status -->
    <div class="flex flex-col items-center gap-3 md:w-48 shrink-0">
      <Avatar
        :label="member.fullName?.charAt(0)"
        :image="member.avatar"
        shape="circle"
        class="!w-20 !h-20 !text-2xl !bg-primary-100 dark:!bg-primary-900/30 !text-primary"
      />
      <p class="font-bold text-lg text-center">{{ member.fullName }}</p>
      <Tag
        :value="statusLabel[member.status]"
        :severity="(statusSeverity[member.status] as any)"
        class="!text-xs"
      />
      <!-- Role Tags -->
      <div class="flex flex-wrap gap-1 justify-center">
        <Tag
          v-for="role in member.roleNames"
          :key="role"
          :value="role"
          severity="info"
          class="!text-xs"
        />
      </div>

      <!-- Reveal All Button -->
      <Button
        v-if="auth.canReveal('mobile')"
        label="顯示所有敏感資料"
        icon="pi pi-eye"
        size="small"
        severity="warn"
        outlined
        class="mt-2 !text-xs"
        @click="showRevealAllDialog = true"
      />
    </div>

    <!-- Right Panel: Details -->
    <div class="flex-1 space-y-5">
      <!-- Basic Info -->
      <div>
        <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <i class="pi pi-user" />
          基本資訊
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400">姓名</p>
            <p class="text-sm font-medium">{{ member.fullName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">性別</p>
            <p class="text-sm font-medium flex items-center gap-1">
              <i :class="[genderIcon, genderColor, 'text-xs']" />
              {{ genderLabel }}
            </p>
          </div>
          <div>
            <p class="text-xs text-slate-400">出生年月日（年齡）</p>
            <p class="text-sm font-medium">{{ member.dob }} （{{ member.age }} 歲）</p>
          </div>
        </div>
      </div>

      <!-- Contact Info (sensitive) -->
      <div>
        <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <i class="pi pi-phone" />
          聯絡資訊
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400">手機</p>
            <MemberRevealButton
              :member-id="member.uuid"
              field="mobile"
              :masked-value="member.mobile"
              :can-reveal="member.mobileMeta.canReveal"
            />
          </div>
          <div>
            <p class="text-xs text-slate-400">Email</p>
            <MemberRevealButton
              :member-id="member.uuid"
              field="email"
              :masked-value="member.email"
              :can-reveal="member.emailMeta.canReveal"
            />
          </div>
          <div v-if="member.lineId">
            <p class="text-xs text-slate-400">Line ID</p>
            <MemberRevealButton
              :member-id="member.uuid"
              field="lineId"
              :masked-value="member.lineId"
              :can-reveal="member.lineIdMeta.canReveal"
            />
          </div>
          <div v-if="member.address">
            <p class="text-xs text-slate-400">地址</p>
            <MemberRevealButton
              :member-id="member.uuid"
              field="address"
              :masked-value="member.address"
              :can-reveal="member.addressMeta.canReveal"
            />
          </div>
        </div>
      </div>

      <!-- Emergency Contact (sensitive) -->
      <div>
        <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <i class="pi pi-exclamation-triangle" />
          緊急聯絡人
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <p class="text-xs text-slate-400">姓名</p>
            <p class="text-sm font-medium">{{ member.emergencyContactName }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">關係</p>
            <p class="text-sm font-medium">{{ member.emergencyContactRelationship }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">電話</p>
            <MemberRevealButton
              :member-id="member.uuid"
              field="emergencyContactPhone"
              :masked-value="member.emergencyContactPhone"
              :can-reveal="member.emergencyContactPhoneMeta.canReveal"
            />
          </div>
        </div>
      </div>

      <!-- Church Info -->
      <div>
        <h3 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
          <i class="pi pi-building" />
          教會資訊
        </h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <p class="text-xs text-slate-400">受洗狀態</p>
            <p class="text-sm font-medium flex items-center gap-1">
              <i
                :class="[
                  member.baptismStatus ? 'pi pi-check-circle text-green-500' : 'pi pi-minus-circle text-slate-300',
                  'text-sm',
                ]"
              />
              {{ member.baptismStatus ? '已受洗' : '未受洗' }}
            </p>
          </div>
          <div v-if="member.baptismDate">
            <p class="text-xs text-slate-400">受洗日期</p>
            <p class="text-sm font-medium">{{ member.baptismDate }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">牧區</p>
            <p class="text-sm font-medium">{{ member.zoneName || '未分配' }}</p>
          </div>
          <div>
            <p class="text-xs text-slate-400">小組</p>
            <p class="text-sm font-medium">{{ member.groupName || '待分發' }}</p>
          </div>
        </div>
      </div>
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
        <Button label="取消" severity="secondary" outlined @click="showRevealAllDialog = false" />
        <Button label="確認顯示" severity="warn" :loading="isRevealingAll" @click="confirmRevealAll" />
      </template>
    </Dialog>
  </div>
</template>
