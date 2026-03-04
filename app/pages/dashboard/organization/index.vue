<script setup lang="ts">
/**
 * Organization Management Page (ST006/ST007)
 * 3-panel layout: Structure Tree + Pending Pool + Group Member List
 */
import type { TreeNode } from "primevue/treenode";
import { useToast } from "primevue/usetoast";

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
} = useOrganizationManagement();

import AssignDialog from "./_components/AssignDialog.vue";
import ZoneDialog from "./_components/ZoneDialog.vue";
import GroupDialog from "./_components/GroupDialog.vue";
import PendingMemberCard from "./_components/PendingMemberCard.vue";
import GroupMemberCard from "./_components/GroupMemberCard.vue";

// Zone dialog state
const showZoneDialog = ref(false);
const zoneInitialData = ref<any>(null);
const zoneLeaderCandidates = ref<{ id: string; name: string }[]>([]);

// Group dialog state
const showGroupDialog = ref(false);
const groupInitialData = ref<any>(null);
const activeZoneId = ref<string>("");
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

  try {
    const result = await assignMember(dragNode.data.id, dropNode.data.id);
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
</script>

<template>
  <div class="contents">
    <Toast />
    <div class="flex flex-col h-full">
      <!-- Page Header -->
      <div class="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <Breadcrumb
            :model="[
              { label: '首頁', to: '/dashboard' },
              { label: '組織架構' },
            ]"
            class="!p-0 !bg-transparent"
          />
          <h2 class="text-xl font-bold text-slate-900 dark:text-white mt-1">
            組織架構管理
          </h2>
        </div>
      </div>

      <!-- 3-Panel Layout -->
      <div class="grid grid-cols-12 gap-4 flex-1 min-h-0">
        <!-- Panel 1: Structure Tree (4 cols) -->
        <div
          class="col-span-12 lg:col-span-4 flex flex-col bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden"
        >
          <div
            class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30"
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
              class="!border-0 !bg-transparent"
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
                      class="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary transition-colors"
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
                      class="font-semibold text-sm text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors"
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

        <!-- Panel 2+3: Right Side (8 cols) -->
        <div class="col-span-12 lg:col-span-8 flex flex-col gap-4 min-h-0">
          <!-- Panel 2: Pending Pool -->
          <div
            class="flex-shrink-0 bg-amber-50/60 dark:bg-amber-900/10 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-800/50 p-4"
          >
            <div class="flex items-center justify-between mb-3">
              <h3
                class="font-bold text-slate-800 dark:text-white flex items-center gap-2 text-sm"
              >
                <i class="pi pi-inbox text-amber-600" />
                待分發區 (Pending Pool)
                <Tag
                  :value="`共 ${pendingMembers.length} 人`"
                  severity="secondary"
                  class="!text-xs"
                />
              </h3>
              <span class="text-xs text-slate-400 italic hidden sm:block">
                拖曳卡片至左側小組以分配
              </span>
            </div>

            <ProgressSpinner
              v-if="isLoadingPending"
              class="!w-6 !h-6 mx-auto"
            />

            <div
              v-else-if="pendingMembers.length === 0"
              class="text-center py-4 text-sm text-slate-400"
            >
              <i class="pi pi-check-circle text-2xl mb-2 text-green-400" />
              <p>所有會友已分配完畢</p>
            </div>

            <div v-else>
              <Tree
                :value="pendingTreeNodes"
                dragdropScope="member-assign"
                :draggableNodes="true"
                :droppableNodes="true"
                class="pending-tree !p-0 !bg-transparent !border-0"
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

          <!-- Panel 3: Group Member List -->
          <div
            class="flex-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden"
          >
            <!-- Header -->
            <div
              class="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
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
            <div v-else class="flex-1 overflow-auto p-4">
              <Tree
                :value="groupMemberTreeNodes"
                dragdropScope="member-assign"
                :draggableNodes="true"
                :droppableNodes="true"
                class="member-tree !p-0 !bg-transparent !border-0 w-full"
                @nodeDrop="onNodeDrop"
                :pt="{
                  nodelabel: {
                    class: 'w-full',
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

/* Member tree: simple vertical list */
:deep(.member-tree .p-tree-node-list) {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0;
}
:deep(.member-tree .p-tree-node) {
  padding: 0;
}
:deep(.member-tree .p-tree-node-content) {
  padding: 0;
  background: transparent !important;
}
:deep(.member-tree .p-tree-node-toggle-button) {
  display: none !important;
}
:deep(.member-tree .p-tree-node-droppoint) {
  display: none !important;
}
</style>
