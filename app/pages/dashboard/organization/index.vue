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
  selectedGroup,
  expandedKeys,
  isLoadingTree,
  isLoadingPending,
  isLoadingMembers,
  isAssigning,
  loadGroupMembers,
  assignMember,
  initialize,
} = useOrganizationManagement();

// Assignment dialog state
const showAssignDialog = ref(false);
const assignTarget = ref<{ uuid: string; fullName: string } | null>(null);
const assignSelectedZone = ref<string | null>(null);
const assignSelectedGroup = ref<string | null>(null);

// Computed: available zones from tree
const availableZones = computed(() =>
  treeNodes.value.map((z) => ({
    label: z.label,
    value: z.key as string,
  })),
);

// Computed: available groups for selected zone
const availableGroups = computed(() => {
  if (!assignSelectedZone.value) return [];
  const zone = treeNodes.value.find((z) => z.key === assignSelectedZone.value);
  if (!zone?.children) return [];
  return zone.children.map((g) => ({
    label: g.label,
    value: g.key as string,
  }));
});

/** Handle tree node select — show group members */
function onNodeSelect(node: TreeNode): void {
  if (node.data?.type === "group") {
    loadGroupMembers(node.data.id, node.label || "", node.data.zoneName || "");
  }
}

/**
 * Handle drag-drop between pending pool tree and structure tree.
 * PrimeVue fires @node-drop on the receiving tree with the dropped node(s).
 */
async function onPendingNodeDrop(event: {
  dragNode: TreeNode;
  dropNode: TreeNode;
  dropIndex: number;
}): Promise<void> {
  const { dragNode, dropNode } = event;

  // Only allow dropping onto group nodes
  if (dropNode?.data?.type !== "group") {
    toast.add({
      severity: "error",
      summary: "無法分配",
      detail: "請將會友拖曳至小組節點",
      life: 3000,
    });
    // Reload to revert tree state
    await initialize();
    return;
  }

  if (dragNode?.data?.type === "pending-member") {
    const result = await assignMember(dragNode.data.id, dropNode.data.id);
    toast.add({
      severity: result.success ? "success" : "error",
      summary: result.success ? "分配成功" : "分配失敗",
      detail: result.message,
      life: 3000,
    });
  }
}

/** Open assignment dialog (click-based assignment) */
function openAssignDialog(member: { uuid: string; fullName: string }): void {
  assignTarget.value = member;
  assignSelectedZone.value = null;
  assignSelectedGroup.value = null;
  showAssignDialog.value = true;
}

/** Confirm click-based assignment */
async function confirmAssign(): Promise<void> {
  if (!assignTarget.value || !assignSelectedGroup.value) return;

  const result = await assignMember(
    assignTarget.value.uuid,
    assignSelectedGroup.value,
  );
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

/** Format date for display */
function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

/** Status label map */
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

// Initialize on mount
onMounted(() => {
  initialize();
});
</script>

<template>
  <Toast />
  <div class="flex flex-col h-full">
    <!-- Page Header -->
    <div class="flex items-center justify-between mb-4 flex-shrink-0">
      <div>
        <Breadcrumb
          :model="[{ label: '首頁', to: '/dashboard' }, { label: '組織架構' }]"
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
          <Button
            icon="pi pi-refresh"
            text
            rounded
            size="small"
            :loading="isLoadingTree"
            @click="initialize()"
          />
        </div>

        <div class="flex-1 overflow-y-auto p-3">
          <ProgressSpinner
            v-if="isLoadingTree"
            class="!w-8 !h-8 mx-auto mt-8"
          />
          <Tree
            v-else
            v-model:expandedKeys="expandedKeys"
            :value="treeNodes"
            selectionMode="single"
            droppableNodes
            :droppableScope="['pending']"
            class="!border-0 !bg-transparent org-tree"
            @nodeSelect="onNodeSelect"
            @nodeDrop="onPendingNodeDrop"
          >
            <!-- Zone Node Template -->
            <template #zone="slotProps">
              <div class="flex items-center gap-3 py-1">
                <div
                  class="size-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center"
                >
                  <i class="pi pi-folder-open text-sm" />
                </div>
                <div class="min-w-0">
                  <p
                    class="font-bold text-sm text-slate-800 dark:text-slate-200"
                  >
                    {{ slotProps.node.label }}
                  </p>
                  <p class="text-xs text-slate-500">
                    牧區長: {{ slotProps.node.data.leaderName }} ·
                    {{ slotProps.node.data.groupCount }} 個小組 ·
                    {{ slotProps.node.data.memberCount }} 人
                  </p>
                </div>
              </div>
            </template>

            <!-- Group Node Template -->
            <template #group="slotProps">
              <div
                class="flex items-center gap-3 py-1 cursor-pointer"
                @click.stop="onNodeSelect(slotProps.node)"
              >
                <div
                  class="size-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center"
                >
                  <i class="pi pi-users text-xs" />
                </div>
                <div class="min-w-0">
                  <p
                    class="font-semibold text-sm text-slate-700 dark:text-slate-300 hover:text-primary transition-colors"
                  >
                    {{ slotProps.node.label }}
                  </p>
                  <p class="text-xs text-slate-400">
                    {{ slotProps.node.data.memberCount }} 人
                  </p>
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

          <ProgressSpinner v-if="isLoadingPending" class="!w-6 !h-6 mx-auto" />

          <div
            v-else-if="pendingMembers.length === 0"
            class="text-center py-4 text-sm text-slate-400"
          >
            <i class="pi pi-check-circle text-2xl mb-2 text-green-400" />
            <p>所有會友已分配完畢</p>
          </div>

          <div v-else>
            <!-- Draggable pending pool as Tree for PrimeVue drag-drop -->
            <Tree
              v-model:value="pendingTreeNodes"
              draggableNodes
              draggableScope="pending"
              class="!border-0 !bg-transparent pending-tree"
            >
              <template #default="slotProps">
                <div
                  class="inline-flex items-center gap-3 px-3 py-2 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-primary/50 cursor-grab select-none transition-all"
                >
                  <Avatar
                    :label="slotProps.node.data.fullName?.charAt(0)"
                    shape="circle"
                    size="normal"
                    :class="
                      slotProps.node.data.gender === 'Male'
                        ? '!bg-blue-100 !text-blue-600'
                        : '!bg-pink-100 !text-pink-600'
                    "
                  />
                  <div class="min-w-0">
                    <p
                      class="font-bold text-sm text-slate-800 dark:text-slate-200"
                    >
                      {{ slotProps.node.data.fullName }}
                    </p>
                    <p class="text-[10px] text-slate-400 truncate">
                      加入: {{ formatDate(slotProps.node.data.createdAt) }}
                    </p>
                  </div>
                  <Button
                    icon="pi pi-arrow-right"
                    text
                    rounded
                    size="small"
                    class="!ml-1"
                    v-tooltip.top="'點擊分配'"
                    @click.stop="
                      openAssignDialog({
                        uuid: slotProps.node.data.id,
                        fullName: slotProps.node.data.fullName,
                      })
                    "
                  />
                </div>
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

          <!-- Member Table -->
          <div v-else class="flex-1 overflow-auto">
            <DataTable
              :value="selectedGroupMembers"
              :rows="20"
              stripedRows
              class="!text-sm"
              emptyMessage="此小組尚無成員"
            >
              <Column field="fullName" header="姓名">
                <template #body="slotProps">
                  <div class="flex items-center gap-2">
                    <Avatar
                      :label="slotProps.data.fullName?.charAt(0)"
                      shape="circle"
                      size="normal"
                      :class="
                        slotProps.data.gender === 'Male'
                          ? '!bg-blue-100 !text-blue-600'
                          : '!bg-pink-100 !text-pink-600'
                      "
                    />
                    <span class="font-medium">{{
                      slotProps.data.fullName
                    }}</span>
                  </div>
                </template>
              </Column>
              <Column field="roleLabel" header="職分" />
              <Column field="mobile" header="聯絡電話">
                <template #body="slotProps">
                  <span class="text-slate-500">{{
                    slotProps.data.mobile
                  }}</span>
                </template>
              </Column>
              <Column field="createdAt" header="加入日期">
                <template #body="slotProps">
                  {{ formatDate(slotProps.data.createdAt) }}
                </template>
              </Column>
              <Column field="status" header="狀態">
                <template #body="slotProps">
                  <Tag
                    :value="
                      statusLabel[slotProps.data.status] ||
                      slotProps.data.status
                    "
                    :severity="statusSeverity(slotProps.data.status)"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Assignment Dialog -->
  <Dialog
    v-model:visible="showAssignDialog"
    :modal="true"
    :closable="true"
    :style="{ width: '450px', maxWidth: '95vw' }"
    header="分配會友"
  >
    <div v-if="assignTarget" class="space-y-4">
      <!-- Member Info -->
      <div
        class="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
      >
        <Avatar
          :label="assignTarget.fullName?.charAt(0)"
          shape="circle"
          size="large"
          class="!bg-primary/10 !text-primary"
        />
        <div>
          <p class="font-bold text-slate-800 dark:text-slate-200">
            {{ assignTarget.fullName }}
          </p>
          <p class="text-xs text-slate-400">待分配</p>
        </div>
      </div>

      <!-- Zone Select -->
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          牧區 <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="assignSelectedZone"
          :options="availableZones"
          optionLabel="label"
          optionValue="value"
          placeholder="請選擇牧區"
          class="w-full"
          @change="assignSelectedGroup = null"
        />
      </div>

      <!-- Group Select -->
      <div>
        <label
          class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1"
        >
          小組 <span class="text-red-500">*</span>
        </label>
        <Select
          v-model="assignSelectedGroup"
          :options="availableGroups"
          optionLabel="label"
          optionValue="value"
          placeholder="請先選擇牧區"
          class="w-full"
          :disabled="!assignSelectedZone"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end gap-2">
        <Button label="取消" outlined @click="showAssignDialog = false" />
        <Button
          label="確定分配"
          icon="pi pi-check"
          :loading="isAssigning"
          :disabled="!assignSelectedGroup"
          @click="confirmAssign"
        />
      </div>
    </template>
  </Dialog>
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
</style>
