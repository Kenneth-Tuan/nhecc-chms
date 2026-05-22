<script setup lang="ts">
/**
 * Organization Management Page (ST006/ST007)
 * 3-panel layout: Structure Tree + Pending Pool + Group Member List
 */
import type { TreeNode } from "primevue/treenode";
import { useToast } from "primevue/usetoast";

import type { MemberStatus } from "~/types/member";
import AssignDialog from "./_components/AssignDialog.vue";
import ZoneDialog from "./_components/ZoneDialog.vue";
import GroupDialog from "./_components/GroupDialog.vue";
import PendingMemberCard from "./_components/PendingMemberCard.vue";
import GroupMemberCard from "./_components/GroupMemberCard.vue";

definePageMeta({ layout: "dashboard" as const });
useHead({ title: "組織架構管理 - NHECC ChMS" });

const toast = useToast();
const auth = useAuth();
const {
  treeNodes,
  pendingTreeNodes,
  pendingMembers,
  selectedGroupMembers,
  groupMemberTreeNodes,
  selectedGroup,
  expandedKeys,
  isLoadingTree,
  isLoadingPending,
  isLoadingMembers,
  isAssigning,
  loadGroupMembers,
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
} = useOrganizationManagement();

// Zone dialog state
const showZoneDialog = ref(false);
const zoneInitialData = ref<any>(null);
const zoneLeaderCandidates = ref<{ id: string; name: string }[]>([]);

// Group dialog state
const showGroupDialog = ref(false);
const groupInitialData = ref<any>(null);

const groupLeaderCandidates = ref<{ id: string; name: string }[]>([]);

// Assignment dialog state
const showAssignDialog = ref(false);
const assignTarget = ref<{ uuid: string; fullName: string } | null>(null);

/** Handle tree node select — show group members */
function onNodeSelect(node: TreeNode): void {
  if (node.data?.type === "group") {
    loadGroupMembers(node.data.id, node.label || "", node.data.zoneName || "");
  }
}

async function onNodeDrop(event: any): Promise<void> {
  const { dragNode, dropNode } = event;

  if (!dragNode || !dropNode) return;

  // Only allow pending members and group members to be dropped onto groups
  if (
    (dragNode.data?.type !== "pending-member" &&
      dragNode.data?.type !== "group-member") ||
    dropNode.data?.type !== "group"
  ) {
    toast.add({
      severity: "error",
      summary: "無法分配",
      detail: "請將會友拖曳至小組",
      life: 3000,
    });
    // Revert invalid tree drop
    initialize();
    return;
  }

  console.log("test: ", dragNode.data.uuid, dropNode.data.id);

  try {
    const result = await assignMember(dragNode.data.uuid, dropNode.data.id);
    toast.add({
      severity: result.success ? "success" : "error",
      summary: result.success ? "分配成功" : "分配失敗",
      detail: result.message,
      life: 3000,
    });

    if (!result.success) {
      // Revert if assignment failed
      initialize();
    }
  } catch (error) {
    console.error("Assignment error", error);
    // Revert on error
    initialize();
  }
}

/** Open assignment dialog (click-based assignment) */
function openAssignDialog(member: { uuid: string; fullName: string }): void {
  assignTarget.value = member;
  showAssignDialog.value = true;
}

/** Confirm click-based assignment */
async function handleConfirmAssign(
  targetId: string,
  groupId: string,
): Promise<void> {
  console.log("handleConfirmAssign", targetId, groupId);
  const result = await assignMember(targetId, groupId);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "分配成功" : "分配失敗",
    detail: result.message,
    life: 3000,
  });

  if (result.success) {
    showAssignDialog.value = false;
  }
}
async function openZoneDialog(zone?: any): Promise<void> {
  zoneLeaderCandidates.value = await fetchLeaderCandidates("zone");
  zoneInitialData.value = zone || null;
  showZoneDialog.value = true;
}

async function onSaveZone(data: any) {
  const result = await saveZone(data);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "儲存成功" : "儲存失敗",
    detail: result.message,
    life: 3000,
  });
  if (result.success) showZoneDialog.value = false;
}

async function handleDeleteZone(zoneId: string) {
  if (!confirm("確定要刪除此牧區嗎？")) return;
  const result = await deleteZone(zoneId);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "刪除成功" : "刪除失敗",
    detail: result.message,
    life: 3000,
  });
}

async function openGroupDialog(zoneId: string, group?: any): Promise<void> {
  activeZoneId.value = zoneId;
  groupLeaderCandidates.value = await fetchLeaderCandidates("group", {
    zoneId,
    groupId: group?.id,
  });
  groupInitialData.value = group || null;
  showGroupDialog.value = true;
}

async function onSaveGroup(data: any) {
  const result = await saveGroup(data);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "儲存成功" : "儲存失敗",
    detail: result.message,
    life: 3000,
  });
  if (result.success) showGroupDialog.value = false;
}

async function handleDeleteGroup(groupId: string) {
  if (!confirm("確定要刪除此小組嗎？")) return;
  const result = await deleteGroup(groupId);
  toast.add({
    severity: result.success ? "success" : "error",
    summary: result.success ? "刪除成功" : "刪除失敗",
    detail: result.message,
    life: 3000,
  });
}

// Initialize on mount
onMounted(() => {
  initialize();
});

const customers = ref([
  {
    id: 1000,
    name: "James Butt",
    country: {
      name: "Algeria",
      code: "dz",
    },
    company: "Benton, John B Jr",
    date: "2015-09-13",
    status: "unqualified",
    verified: true,
    activity: 17,
    representative: {
      name: "Ioni Bowcher",
      image: "ionibowcher.png",
    },
    balance: 70663,
  },
]);
const expandedRowGroups = ref();

const calculateMemberTotal = (groupId: string) => {
  let total = 0;

  return membersByZoneId.value.filter((member) => member.groupId === groupId)
    .length;
};
const getSeverity = (status: MemberStatus) => {
  switch (status) {
    case "Active":
      return "success";

    case "Inactive":
      return "secondary";

    case "Suspended":
      return "warn";
  }
};

const scrollableTabs = ref(
  Array.from({ length: 50 }, (_, i) => ({
    title: `Tab ${i + 1}`,
    content: `Tab ${i + 1} Content`,
    value: `${i}`,
  })),
);

function onTabChange(value: unknown): void {
  loadMembersByZoneId(value);
}
</script>

<template>
  <div class="contents">
    <div class="flex flex-col h-full">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h1 class="text-2xl font-bold">組織架構管理</h1>
          <p class="text-sm text-slate-500 mt-1">管理系統組織架構</p>
        </div>
      </div>

      <!-- testing -->

      <Tabs :value="activeZoneId" scrollable @update:value="onTabChange">
        <TabList>
          <Tab
            v-for="zone in organizationStructure"
            :key="zone.id"
            :value="zone.id"
          >
            {{ zone.name }}
          </Tab>
        </TabList>
      </Tabs>

      <!-- <Button class="w-50%" label="Add Tab" @click="() => {}" /> -->

      <DataTable
        v-model:expandedRowGroups="expandedRowGroups"
        :value="membersByZoneId"
        tableStyle="min-width: 50rem"
        expandableRowGroups
        rowGroupMode="subheader"
        groupRowsBy="groupId"
        class="mb-6"
        scrollable
      >
        <template #groupheader="slotProps">
          <span class="font-bold leading-normal">{{
            slotProps.data.groupName
          }}</span>
          <span class="font-bold leading-normal">{{
            getGroupInfosByGroupId(slotProps.data.groupId)?.leaders
          }}</span>
        </template>
        <!-- 要保留一格給 groupId -->
        <Column field="groupId" header="groupId"></Column>
        <Column field="fullName" header="姓名" style="width: 20%"></Column>
        <Column field="mobile" header="手機" style="width: 20%">
          <template #body="slotProps">
            <div class="flex items-center gap-2">
              <span>{{ slotProps.data.mobile }}</span>
            </div>
          </template>
        </Column>
        <Column field="email" header="信箱" style="width: 20%"></Column>
        <Column field="status" header="狀態" style="width: 20%">
          <template #body="slotProps">
            <Tag
              :value="slotProps.data.status"
              :severity="getSeverity(slotProps.data.status)"
            />
          </template>
        </Column>

        <template #groupfooter="slotProps">
          <div class="flex justify-end font-bold w-full">
            Total Members:
            {{ calculateMemberTotal(slotProps.data.groupId) }}
          </div>
        </template>
      </DataTable>

      <!-- 3-Panel Layout -->
      <div class="flex justify-between gap-4 flex-1 min-h-0">
        <!-- Panel 1: Pending Pool -->
        <div
          v-if="pendingMembers.length > 0"
          class="flex min-w-0 flex-col overflow-hidden bg-amber-50/60 dark:bg-amber-900/10 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800/50"
        >
          <div class="p-4 flex items-center justify-between gap-2">
            <i class="pi pi-inbox text-lg text-amber-600" />
            <div class="flex flex-col">
              <p class="text-slate-800 dark:text-white font-bold">待分發區</p>
              <span class="text-xs text-slate-400 italic hidden sm:block">
                拖曳卡片至右側小組以分配
              </span>
            </div>
            <Tag
              :value="`共 ${pendingMembers.length} 人`"
              severity="secondary"
              class="!text-xs"
            />
          </div>

          <div class="flex-1 overflow-y-auto">
            <ProgressSpinner
              v-if="isLoadingPending"
              class="!w-6 !h-6 mx-auto"
            />

            <Tree
              v-else
              :value="pendingTreeNodes"
              dragdropScope="member-assign"
              :draggableNodes="true"
              :droppableNodes="true"
              class="pending-tree !bg-transparent !border-0"
              :pt="{
                nodelabel: {
                  class: 'flex-1',
                },
              }"
              @nodeDrop="onNodeDrop"
            >
              <template #pending-member="slotProps">
                <PendingMemberCard
                  :member="slotProps.node.data"
                  @assign="openAssignDialog"
                />
              </template>
            </Tree>
          </div>
        </div>

        <!-- Panel 2: Structure Tree -->
        <div
          class="flex min-w-0 flex-col overflow-hidden bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-slate-200 dark:border-surface-700"
        >
          <div
            class="p-4 border-b border-slate-100 dark:border-surface-700 flex items-center justify-between bg-slate-50/50 dark:bg-surface-800/30"
          >
            <h3
              class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm"
            >
              <i class="pi pi-sitemap text-slate-500" />
              組織架構樹
            </h3>
            <div class="flex items-center gap-1">
              <Button
                icon="pi pi-plus"
                label="新增牧區"
                size="small"
                outlined
                @click="openZoneDialog()"
              />
              <Button
                icon="pi pi-refresh"
                text
                rounded
                size="small"
                :loading="isLoadingTree"
                @click="initialize()"
              />
            </div>
          </div>

          <div class="flex-1 overflow-y-auto">
            <ProgressSpinner
              v-if="isLoadingTree"
              class="!w-8 !h-8 mx-auto mt-8"
            />
            <Tree
              v-else
              v-model:expandedKeys="expandedKeys"
              :value="treeNodes"
              selectionMode="single"
              dragdropScope="member-assign"
              :draggableNodes="true"
              :droppableNodes="true"
              class="!border-0 !bg-transparent p-1"
              @nodeSelect="onNodeSelect"
              @nodeDrop="onNodeDrop"
              :pt="{
                nodelabel: {
                  class: 'flex-1',
                },
              }"
            >
              <!-- Zone Node Template -->
              <template #zone="slotProps">
                <div class="flex items-center gap-3 py-1 group">
                  <!-- <div
                    class="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center"
                  >
                    <i class="pi pi-folder-open text-sm" />
                  </div> -->
                  <div class="min-w-0 flex-1">
                    <p
                      class="font-bold text-sm text-slate-800 dark:text-surface-100 group-hover:text-primary transition-colors"
                    >
                      {{ slotProps.node.label }}
                    </p>
                    <p class="text-xs text-slate-500">
                      牧區長: {{ slotProps.node.data.leaderName }} ·
                      {{ slotProps.node.data.groupCount }} 個小組 ·
                      {{ slotProps.node.data.memberCount }} 人
                    </p>
                  </div>

                  <div
                    class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Button
                      icon="pi pi-plus"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'新增小組'"
                      @click.stop="openGroupDialog(slotProps.node.data.id)"
                    />
                    <Button
                      severity="info"
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'編輯牧區'"
                      @click.stop="openZoneDialog(slotProps.node.data)"
                    />
                    <Button
                      severity="danger"
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'刪除牧區'"
                      @click.stop="handleDeleteZone(slotProps.node.data.id)"
                    />
                  </div>
                </div>
              </template>

              <!-- Group Node Template -->
              <template #group="slotProps">
                <div
                  class="flex items-center gap-3 py-1 cursor-pointer transition-colors group"
                  @click.stop="onNodeSelect(slotProps.node)"
                >
                  <!-- <div
                    class="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                  >
                    <i class="pi pi-users text-xs" />
                  </div> -->
                  <div class="min-w-0 flex-1">
                    <p
                      class="font-semibold text-sm text-slate-700 dark:text-surface-200 group-hover:text-primary transition-colors"
                    >
                      {{ slotProps.node.label }}
                    </p>
                    <p class="text-xs text-slate-400">
                      小組長: {{ slotProps.node.data.leaderName }} ·
                      {{ slotProps.node.data.memberCount }} 人
                    </p>
                  </div>

                  <div
                    class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Button
                      icon="pi pi-pencil"
                      text
                      rounded
                      size="small"
                      v-tooltip.top="'編輯小組'"
                      @click.stop="
                        openGroupDialog(
                          slotProps.node.data.zoneId,
                          slotProps.node.data,
                        )
                      "
                    />
                    <Button
                      icon="pi pi-trash"
                      text
                      rounded
                      size="small"
                      severity="danger"
                      v-tooltip.top="'刪除小組'"
                      @click.stop="handleDeleteGroup(slotProps.node.data.id)"
                    />
                  </div>
                </div>
              </template>
            </Tree>
          </div>
        </div>

        <!-- Panel 3: Group Member List -->
        <div
          class="flex-1 flex flex-col overflow-hidden bg-white dark:bg-surface-900 rounded-xl shadow-sm border border-slate-200 dark:border-surface-700"
        >
          <!-- Header -->
          <div
            class="p-4 border-b border-slate-100 dark:border-surface-700 flex items-center justify-between"
          >
            <h3
              class="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm"
            >
              <i class="pi pi-list text-slate-400" />
              {{
                selectedGroup
                  ? `${selectedGroup.name} 成員列表`
                  : "請選擇一個小組"
              }}
            </h3>
          </div>

          <!-- No selection state -->
          <div
            v-if="!selectedGroup"
            class="flex-1 flex flex-col items-center justify-center text-slate-400"
          >
            <i class="pi pi-arrow-left text-4xl mb-3 opacity-30" />
            <p class="text-sm">點擊左側小組以查看成員</p>
          </div>

          <!-- Loading state -->
          <div
            v-else-if="isLoadingMembers"
            class="flex-1 flex items-center justify-center"
          >
            <ProgressSpinner class="!w-8 !h-8" />
          </div>

          <!-- Member Tree -->
          <div
            v-else
            class="member-list-scroll flex-1 min-h-0 overflow-x-auto overflow-y-auto p-4"
          >
            <Tree
              :value="groupMemberTreeNodes"
              dragdropScope="member-assign"
              :draggableNodes="true"
              :droppableNodes="true"
              class="member-tree !p-0 !bg-transparent !border-0"
              @nodeDrop="onNodeDrop"
              :pt="{
                nodelabel: {
                  // class: 'w-fit',
                },
              }"
            >
              <!-- Empty state handled by check above -->

              <template #group-member="slotProps">
                <GroupMemberCard :member="slotProps.node.data" />
              </template>
            </Tree>
          </div>
        </div>
      </div>
    </div>

    <!-- Dialogs -->
    <AssignDialog
      v-model:visible="showAssignDialog"
      :assign-target="assignTarget"
      :tree-nodes="treeNodes"
      :is-assigning="isAssigning"
      @confirm="handleConfirmAssign"
    />

    <ZoneDialog
      v-model:visible="showZoneDialog"
      :initial-data="zoneInitialData"
      :candidates="zoneLeaderCandidates"
      :is-saving="isSavingZone"
      @save="onSaveZone"
    />

    <GroupDialog
      v-model:visible="showGroupDialog"
      :zone-id="activeZoneId"
      :initial-data="groupInitialData"
      :candidates="groupLeaderCandidates"
      :is-saving="isSavingGroup"
      @save="onSaveGroup"
    />
  </div>
</template>

<style scoped>
/* Tree customization for org structure */
:deep(.org-tree .p-tree-node-content) {
  padding: 0.25rem 0.5rem;
  border-radius: 0.5rem;
  transition: all 0.15s;
}
:deep(.org-tree .p-tree-node-content:hover) {
  background: var(--p-surface-100) !important;
}
:deep(.org-tree .p-tree-node-content.p-tree-node-selected) {
  background: var(--p-primary-50) !important;
}

/* Pending tree: horizontal flow */
:deep(.pending-tree .p-tree-node-list) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  padding: 0;
}
:deep(.pending-tree .p-tree-node) {
  padding: 0;
}
:deep(.pending-tree .p-tree-node-content) {
  padding: 0;
  background: transparent !important;
}
:deep(.pending-tree .p-tree-node-toggle-button) {
  display: none !important;
}

/* Drop zone highlight */
:deep(.p-tree-node-droppoint-active) {
  background: var(--p-green-100) !important;
  border-radius: 0.5rem;
}

/* Member tree: content-width cards, horizontal scroll in panel */
:deep(.member-list-scroll .member-tree) {
  width: max-content;
  min-width: 100%;
}
:deep(.member-tree .p-tree-node-content),
:deep(.member-tree .p-tree-node-label) {
  width: fit-content;
}
:deep(.member-tree .p-tree-node-list) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

:deep(.member-tree .p-tree-node-toggle-button) {
  display: none !important;
}
:deep(.member-tree .p-tree-node-droppoint) {
  display: none !important;
}
</style>
