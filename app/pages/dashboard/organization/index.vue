<script setup lang="ts">
/**
 * Organization Management Page (ST006/ST007)
 * Tabs layout: 待分發 + 各牧區 Tab，DataTable 以小組為 group row
 */
import type { MemberStatus } from "~/types/member";
import type { ZoneWithGroups } from "~/types/organization";
import AssignDialog from "./_components/AssignDialog.vue";
import ZoneDialog from "./_components/ZoneDialog.vue";
import GroupDialog from "./_components/GroupDialog.vue";
import BasePageContainer from "@/pages/dashboard/_components/BasePageContainer.vue";
import BasePageHeader from "@/pages/dashboard/_components/BasePageHeader.vue";

definePageMeta({ layout: "dashboard" as const });
useHead({ title: "組織架構管理 - NHECC ChMS" });

const router = useRouter();
const toast = useToast();
const auth = useAuth();
const confirm = useConfirm();
const {
  pendingMembers,
  isLoadingPending,
  isAssigning,
  assignMember,
  initialize,
  isSavingZone,
  saveZone,
  deleteZone,
  isSavingGroup,
  saveGroup,
  deleteGroup,
  fetchLeaderCandidates,
  organizationStructure,
  activeZoneId,
  loadMembersByZoneId,
  membersByZoneId,
  getGroupInfosByGroupId,
  isLoadingTree,
} = useOrganizationManagement();

// 處理有 zoneId 但 groupId 為 null 的會友，歸類為未分小組
const processedMembersByZoneId = computed(() => {
  return membersByZoneId.value.map((m) => {
    if (!m.groupId) {
      return {
        ...m,
        groupId: "unassigned",
        groupName: "牧區直屬 / 未分小組",
      };
    }
    return m;
  });
});

// ── Tab 狀態 ──────────────────────────────────────────────
// 'pending' = 待分發 Tab；其他值為 zoneId
const PENDING_TAB = "pending";
const activeTab = ref<string>(PENDING_TAB);

function onTabChange(value: unknown): void {
  const v = value as string;
  activeTab.value = v;
  if (v !== PENDING_TAB) {
    activeZoneId.value = v;
    loadMembersByZoneId(v);
  }
}

// 切到第一個 zone tab（initialize 後呼叫）
function goToFirstZoneTab(): void {
  const first = organizationStructure.value[0];
  if (first) {
    activeTab.value = first.id;
    activeZoneId.value = first.id;
    loadMembersByZoneId(first.id);
  }
}

// ── 當前牧區資訊（Tab Content 頂部 info bar 使用）──────────
const currentZone = computed<ZoneWithGroups | null>(
  () =>
    organizationStructure.value.find((z) => z.id === activeTab.value) ?? null,
);

// ── DataTable 展開狀態 ──────────────────────────────────────
const expandedRowGroups = ref();

// ── Assignment Dialog ──────────────────────────────────────
const showAssignDialog = ref(false);
const assignTarget = ref<{ uuid: string; fullName: string } | null>(null);

function openAssignDialog(member: { uuid: string; fullName: string }): void {
  assignTarget.value = member;
  showAssignDialog.value = true;
}

async function handleConfirmAssign(
  targetId: string,
  groupId: string,
): Promise<void> {
  const result = await assignMember(targetId, groupId);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "分配成功" : "分配失敗",
    detail: result.message,
    life: 3000,
  });
  if (result.success) {
    showAssignDialog.value = false;
    // 若當前在 pending tab，重新整理後如果待分發清空則跳到第一個 zone
    if (activeTab.value === PENDING_TAB && pendingMembers.value.length === 0) {
      goToFirstZoneTab();
    }
  }
}

// ── Zone Dialog ────────────────────────────────────────────
const showZoneDialog = ref(false);
const zoneInitialData = ref<any>(null);
const zoneLeaderCandidates = ref<{ id: string; name: string }[]>([]);

async function openZoneDialog(zone?: any): Promise<void> {
  zoneLeaderCandidates.value = await fetchLeaderCandidates("zone");
  zoneInitialData.value = zone || null;
  showZoneDialog.value = true;
}

async function onSaveZone(data: any): Promise<void> {
  const result = await saveZone(data);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "儲存成功" : "儲存失敗",
    detail: result.message,
    life: 3000,
  });
  if (result.success) showZoneDialog.value = false;
}

function handleDeleteZone(zoneId: string): void {
  confirm.require({
    message: "確定要刪除此牧區嗎？刪除後其下的小組也將一併移除。",
    header: "確認刪除牧區",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "取消",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "確定刪除",
      severity: "danger",
    },
    accept: async () => {
      const result = await deleteZone(zoneId);
      toast.add({
        severity: result.success ? "success" : "error",
        summary: result.success ? "刪除成功" : "刪除失敗",
        detail: result.message,
        life: 3000,
      });
      if (result.success && activeTab.value === zoneId) {
        activeTab.value = PENDING_TAB;
      }
    },
  });
}

// ── Group Dialog ───────────────────────────────────────────
const showGroupDialog = ref(false);
const groupInitialData = ref<any>(null);
const groupLeaderCandidates = ref<{ id: string; name: string }[]>([]);

async function openGroupDialog(zoneId: string, group?: any): Promise<void> {
  activeZoneId.value = zoneId;
  groupLeaderCandidates.value = await fetchLeaderCandidates("group", {
    zoneId,
    groupId: group?.id,
  });
  groupInitialData.value = group || null;
  showGroupDialog.value = true;
}

async function onSaveGroup(data: any): Promise<void> {
  const result = await saveGroup(data);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "儲存成功" : "儲存失敗",
    detail: result.message,
    life: 3000,
  });
  if (result.success) {
    showGroupDialog.value = false;
    // 重新整理當前牧區的成員列表
    if (activeTab.value !== PENDING_TAB) {
      loadMembersByZoneId(activeTab.value);
    }
  }
}

function handleDeleteGroup(groupId: string): void {
  confirm.require({
    message: "確定要刪除此小組嗎？",
    header: "確認刪除小組",
    icon: "pi pi-exclamation-triangle",
    rejectProps: {
      label: "取消",
      severity: "secondary",
      outlined: true,
    },
    acceptProps: {
      label: "確定刪除",
      severity: "danger",
    },
    accept: async () => {
      const result = await deleteGroup(groupId);
      toast.add({
        severity: result.success ? "success" : "error",
        summary: result.success ? "刪除成功" : "刪除失敗",
        detail: result.message,
        life: 3000,
      });
      if (result.success && activeTab.value !== PENDING_TAB) {
        loadMembersByZoneId(activeTab.value);
      }
    },
  });
}

// ── 工具函數 ───────────────────────────────────────────────
const getSeverity = (
  status: MemberStatus,
): "success" | "warn" | "secondary" => {
  const map: Record<MemberStatus, "success" | "warn" | "secondary"> = {
    Active: "success",
    Inactive: "secondary",
    Suspended: "warn",
  };
  return map[status] ?? "secondary";
};

const statusLabel: Record<string, string> = {
  Active: "活躍",
  Inactive: "停用",
  Suspended: "請假中",
};

// ── Init ───────────────────────────────────────────────────
onMounted(async () => {
  await initialize();
  // 預設先停在 pending tab，若無待分發則跳第一個 zone
  if (pendingMembers.value.length === 0) {
    goToFirstZoneTab();
  }
});
</script>

<template>
  <BasePageContainer>
    <!-- Page Header -->
    <BasePageHeader title="組織架構管理" description="管理牧區、小組及會友歸屬">
      <template #actions>
        <Button v-if="auth.can('manage', 'Organization')" icon="pi pi-plus" label="新增牧區" @click="openZoneDialog()" />
      </template>
    </BasePageHeader>


    <div class="flex flex-col gap-4">
      <!-- Tabs -->
      <Tabs :value="activeTab" scrollable @update:value="onTabChange">
        <TabList class="rounded-xl border border-slate-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden p-0.5">
          <!-- 待分發 Tab -->
          <Tab :value="PENDING_TAB">
            <div class="flex items-center gap-2">
              <i class="pi pi-inbox text-amber-500" />
              <span>待分發</span>
              <Badge v-if="pendingMembers.length > 0" :value="pendingMembers.length" severity="warn" class="!text-xs" />
            </div>
          </Tab>

          <!-- 各牧區 Tab -->
          <Tab v-for="zone in organizationStructure" :key="zone.id" :value="zone.id">
            {{ zone.name }}
          </Tab>
        </TabList>
      </Tabs>

      <!-- ── 待分發 Tab Content ─────────────────────────────── -->
      <template v-if="activeTab === PENDING_TAB">
        <!-- 空狀態 -->
        <div v-if="!isLoadingPending && pendingMembers.length === 0"
          class="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3">
          <i class="pi pi-check-circle text-5xl text-green-400" />
          <p class="text-base font-medium">所有會友都已分配完畢</p>
        </div>

        <!-- Loading -->
        <div v-else-if="isLoadingPending" class="flex justify-center pt-12">
          <ProgressSpinner class="!w-8 !h-8" />
        </div>

        <!-- DataTable -->
        <div v-else class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 shadow-sm overflow-hidden">
          <DataTable :value="pendingMembers" :loading="isLoadingPending" tableStyle="min-width: 36rem" scrollable
            class="flex-1">
            <template #header>
              <div class="flex items-center gap-2 text-amber-600">
                <i class="pi pi-info-circle" />
                <span class="text-sm">以下會友尚未分配到任何小組</span>
              </div>
            </template>

            <Column field="fullName" header="姓名">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Avatar :label="data.fullName?.charAt(0)" shape="circle" size="normal" :class="data.gender === 'Male'
                    ? '!bg-blue-100 !text-blue-600'
                    : '!bg-pink-100 !text-pink-600'
                    " />
                  <span class="font-medium text-slate-800 dark:text-surface-100">{{
                    data.fullName
                  }}</span>
                </div>
              </template>
            </Column>

            <Column field="createdAt" header="註冊日期" style="width: 20%">
              <template #body="{ data }">
                <span class="text-slate-500 text-sm">{{
                  data.createdAt
                    ? new Date(data.createdAt).toLocaleDateString("zh-TW")
                    : "—"
                }}</span>
              </template>
            </Column>

            <Column field="baptismStatus" header="受洗" style="width: 10%">
              <template #body="{ data }">
                <i :class="data.baptismStatus
                  ? 'pi pi-check text-green-500'
                  : 'pi pi-minus text-slate-300'
                  " />
              </template>
            </Column>

            <Column header="操作" class="w-1 whitespace-nowrap">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button icon="pi pi-arrow-right-arrow-left" label="分配小組" size="small" outlined severity="warn"
                    @click="openAssignDialog({ uuid: data.uuid, fullName: data.fullName })" />
                  <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'編輯會友資料'"
                    @click="router.push(`/dashboard/members/edit/${data.uuid}`)" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>

      <!-- ── 牧區 Tab Content ───────────────────────────────── -->
      <template v-else-if="currentZone">
        <!-- 牧區資訊列 -->
        <div
          class="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 bg-blue-50/50 dark:bg-surface-800/40 rounded-2xl border border-blue-100 dark:border-surface-700 flex-shrink-0 gap-4"
        >
          <div class="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
            <div class="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <i class="pi pi-folder-open text-xl c-white" />
            </div>
            <div class="space-y-1 min-w-0 flex-1">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl sm:text-2xl font-bold text-slate-800 dark:text-surface-50 break-words leading-tight">
                  {{ currentZone.name }}
                </h2>
                <Tag severity="info" class="!text-xs sm:!text-sm font-semibold flex-shrink-0">
                  共 {{ membersByZoneId.length }} 位會友
                </Tag>
              </div>
              <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm sm:text-base text-slate-600 dark:text-surface-300">
                <span class="break-all">
                  牧區長：<strong class="text-slate-800 dark:text-surface-100">{{
                    currentZone.leaders?.map((l) => l.name).join("、") ||
                    currentZone.leaderName ||
                    "未指派"
                  }}</strong>
                </span>
                <span class="text-slate-300 dark:text-surface-700 hidden sm:inline">•</span>
                <span>{{ currentZone.groups.length }} 個小組</span>
              </div>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end border-t sm:border-t-0 border-slate-200/60 dark:border-surface-700/60 pt-3 sm:pt-0">
            <Button v-if="auth.can('manage', 'Organization')" icon="pi pi-plus" label="新增小組" size="small"
              class="font-bold flex-1 sm:flex-initial" @click="openGroupDialog(currentZone.id)" />
            <div class="flex items-center gap-1 border-l border-slate-200 dark:border-surface-700 pl-2 ml-auto sm:ml-0"
              v-if="auth.can('manage', 'Organization')">
              <Button icon="pi pi-pencil" text rounded size="small" severity="info" v-tooltip.top="'編輯牧區'"
                @click="openZoneDialog(currentZone)" />
              <Button icon="pi pi-trash" text rounded size="small" severity="danger" v-tooltip.top="'刪除牧區'"
                @click="handleDeleteZone(currentZone.id)" />
            </div>
          </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoadingTree" class="flex justify-center pt-12">
          <ProgressSpinner class="!w-8 !h-8" />
        </div>

        <!-- DataTable 按小組分組 -->
        <div v-else class="bg-surface-0 dark:bg-surface-900 rounded-xl border border-slate-200 dark:border-surface-700 shadow-sm overflow-hidden">
          <DataTable v-model:expandedRowGroups="expandedRowGroups" :value="processedMembersByZoneId"
            tableStyle="min-width: 40rem" expandableRowGroups rowGroupMode="subheader" groupRowsBy="groupId" scrollable
            class="flex-1" :pt="{
              rowGroupHeaderCell: {
                class: ['align-middle', '[&>*]:align-middle']
              }
            }">
            <!-- 小組 Group Header -->
            <template #groupheader="{ data }">
              <div class="inline-flex items-center justify-between w-[calc(100%-2.5rem)] py-1 gap-4 align-middle">
                <div class="flex items-center gap-3">
                  <div
                    class="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                    <i class="pi pi-users text-xs" />
                  </div>
                  <div>
                    <span class="font-bold text-slate-800 dark:text-surface-100">{{
                      data.groupName
                    }}</span>
                    <span class="text-xs text-slate-400 ml-2" v-if="data.groupId !== 'unassigned'">
                      組長：{{
                        getGroupInfosByGroupId(data.groupId)?.groupInfo?.leaders
                          ?.map((l: { name: string }) => l.name)
                          .join("、") ||
                        getGroupInfosByGroupId(data.groupId)?.groupInfo
                          ?.leaderName ||
                        "未指派"
                      }}
                    </span>
                  </div>
                </div>

                <div class="flex items-center gap-1"
                  v-if="data.groupId !== 'unassigned' && auth.can('manage', 'Organization')">
                  <Button icon="pi pi-pencil" text rounded size="small" severity="info" v-tooltip.top="'編輯小組'"
                    @click.stop="
                      openGroupDialog(
                        currentZone!.id,
                        getGroupInfosByGroupId(data.groupId)?.groupInfo,
                      )
                      " />
                  <Button icon="pi pi-trash" text rounded size="small" severity="danger" v-tooltip.top="'刪除小組'"
                    @click.stop="handleDeleteGroup(data.groupId)" />
                </div>
              </div>
            </template>

            <!-- Group Footer -->
            <template #groupfooter="{ data }">
              <div class="text-xs text-slate-400 py-1 pl-2">
                小計：{{processedMembersByZoneId.filter((m) => m.groupId === data.groupId).length}} 人
              </div>
            </template>

            <Column field="groupId" header="groupId"></Column>

            <Column field="fullName" header="姓名" style="width: 25%">
              <template #body="{ data }">
                <div class="flex items-center gap-2">
                  <Avatar :label="data.fullName?.charAt(0)" shape="circle" size="normal" :class="data.gender === 'Male'
                    ? '!bg-blue-100 !text-blue-600'
                    : '!bg-pink-100 !text-pink-600'
                    " />
                  <span class="font-medium text-slate-800 dark:text-surface-100">{{
                    data.fullName
                  }}</span>
                </div>
              </template>
            </Column>

            <Column field="mobile" header="手機" style="width: 20%">
              <template #body="{ data }">
                <span class="text-slate-600 dark:text-surface-300 text-sm">{{
                  data.mobile || "—"
                }}</span>
              </template>
            </Column>

            <Column field="email" header="信箱">
              <template #body="{ data }">
                <span class="text-slate-600 dark:text-surface-300 text-sm truncate">{{
                  data.email || "—"
                }}</span>
              </template>
            </Column>

            <Column field="status" header="狀態" style="width: 10%">
              <template #body="{ data }">
                <Tag :value="statusLabel[data.status] || data.status" :severity="getSeverity(data.status)" />
              </template>
            </Column>

            <Column header="操作" class="w-1 whitespace-nowrap">
              <template #body="{ data }">
                <div class="flex items-center gap-1">
                  <Button icon="pi pi-pencil" text rounded size="small" v-tooltip.top="'編輯會友資料'"
                    @click="router.push(`/dashboard/members/edit/${data.uuid}`)" />
                  <Button icon="pi pi-arrow-right-arrow-left" text rounded size="small" v-tooltip.top="'移動到其他小組'"
                    @click="openAssignDialog({ uuid: data.uuid, fullName: data.fullName })" />
                </div>
              </template>
            </Column>
          </DataTable>
        </div>
      </template>

      <!-- 空組織狀態 -->
      <template v-else-if="!isLoadingTree && organizationStructure.length === 0">
        <div class="flex flex-col items-center justify-center flex-1 text-slate-400 gap-3">
          <i class="pi pi-sitemap text-5xl opacity-30" />
          <p class="text-base font-medium">尚未建立任何牧區</p>
          <Button icon="pi pi-plus" label="建立第一個牧區" @click="openZoneDialog()" />
        </div>
      </template>
    </div>

    <!-- Dialogs -->
    <AssignDialog v-model:visible="showAssignDialog" :assign-target="assignTarget" :zones="organizationStructure"
      :is-assigning="isAssigning" @confirm="handleConfirmAssign" />

    <ZoneDialog v-model:visible="showZoneDialog" :initial-data="zoneInitialData" :candidates="zoneLeaderCandidates"
      :is-saving="isSavingZone" @save="onSaveZone" />

    <GroupDialog v-model:visible="showGroupDialog" :zone-id="activeZoneId" :initial-data="groupInitialData"
      :candidates="groupLeaderCandidates" :is-saving="isSavingGroup" @save="onSaveGroup" />

    <ConfirmDialog />
  </BasePageContainer>
</template>
