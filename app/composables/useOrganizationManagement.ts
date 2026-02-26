/**
 * 組織管理 Composable (ST006/ST007)
 * 管理樹狀結構、待分配池以及成員分配功能。
 */
import type { ZoneWithGroups } from "~/types/organization";
import type { TreeNode } from "primevue/treenode";

interface PendingMember {
  uuid: string;
  fullName: string;
  gender: "Male" | "Female";
  baptismStatus: boolean;
  status: string;
  createdAt: string;
}

interface GroupMember {
  uuid: string;
  fullName: string;
  gender: "Male" | "Female";
  mobile: string;
  roleLabel: string;
  baptismStatus: boolean;
  status: string;
  createdAt: string;
}

/**
 * 將 OrganizationStructure 轉換為 PrimeVue TreeNode[] 格式。
 */
function buildTreeNodes(
  zones: ZoneWithGroups[],
  memberCounts: Record<string, number>,
): TreeNode[] {
  return zones.map((zone) => ({
    key: zone.id,
    label: zone.name,
    data: {
      type: "zone",
      id: zone.id,
      leaderName: zone.leaderName || "未指派",
      memberCount: zone.groups.reduce(
        (sum, g) => sum + (memberCounts[g.id] || 0),
        0,
      ),
      groupCount: zone.groups.length,
      status: zone.status,
    },
    type: "zone",
    droppable: false,
    draggable: false,
    children: zone.groups.map((group) => ({
      key: group.id,
      label: group.name,
      data: {
        type: "group",
        id: group.id,
        zoneId: zone.id,
        zoneName: zone.name,
        leaderName: group.leaderName || "未指派",
        memberCount: memberCounts[group.id] || 0,
        status: group.status,
      },
      type: "group",
      droppable: true,
      draggable: false,
    })),
  }));
}

/**
 * 為待分配池建立 PrimeVue TreeNode[]（將清單轉換為可拖動的小節點）。
 */
function buildPendingTreeNodes(members: PendingMember[]): TreeNode[] {
  return members.map((m) => ({
    key: m.uuid,
    label: m.fullName,
    data: {
      type: "pending-member",
      id: m.uuid,
      fullName: m.fullName,
      gender: m.gender,
      baptismStatus: m.baptismStatus,
      createdAt: m.createdAt,
    },
    type: "pending-member",
    leaf: true,
    draggable: true,
    droppable: false,
  }));
}

export function useOrganizationManagement() {
  const treeNodes = ref<TreeNode[]>([]);
  const pendingTreeNodes = ref<TreeNode[]>([]);
  const pendingMembers = ref<PendingMember[]>([]);
  const selectedGroupMembers = ref<GroupMember[]>([]);
  const selectedGroup = ref<{
    id: string;
    name: string;
    zoneName: string;
  } | null>(null);
  const expandedKeys = ref<Record<string, boolean>>({});
  const isLoadingTree = ref(false);
  const isLoadingPending = ref(false);
  const isLoadingMembers = ref(false);
  const isAssigning = ref(false);

  /** 獲取各小組的成員人數以顯示於樹狀圖標記 (Badge) */
  const memberCounts = ref<Record<string, number>>({});

  /** 獲取組織架構並建立樹狀圖 */
  async function loadStructure(): Promise<void> {
    isLoadingTree.value = true;
    try {
      const [structure, counts] = await Promise.all([
        $fetch<ZoneWithGroups[]>("/api/organization/zones"),
        $fetch<Record<string, number>>("/api/organization/member-counts"),
      ]);

      memberCounts.value = counts;
      treeNodes.value = buildTreeNodes(structure, counts);

      // 自動展開第一個牧區
      const firstZone = structure[0];
      if (firstZone) {
        expandedKeys.value = { [firstZone.id]: true };
      }
    } catch (error) {
      console.error("Failed to load organization structure:", error);
    } finally {
      isLoadingTree.value = false;
    }
  }

  /** 獲取待分配（未指派小組）的會友 */
  async function loadPendingMembers(): Promise<void> {
    isLoadingPending.value = true;
    try {
      const data = await $fetch<PendingMember[]>(
        "/api/organization/pending-members",
      );
      pendingMembers.value = data;
      pendingTreeNodes.value = buildPendingTreeNodes(data);
    } catch (error) {
      console.error("Failed to load pending members:", error);
    } finally {
      isLoadingPending.value = false;
    }
  }

  /** 載入所選小組的成員清單 */
  async function loadGroupMembers(
    groupId: string,
    groupName: string,
    zoneName: string,
  ): Promise<void> {
    isLoadingMembers.value = true;
    selectedGroup.value = { id: groupId, name: groupName, zoneName };
    try {
      selectedGroupMembers.value = await $fetch<GroupMember[]>(
        "/api/organization/group-members",
        {
          params: { groupId },
        },
      );
    } catch (error) {
      console.error("Failed to load group members:", error);
    } finally {
      isLoadingMembers.value = false;
    }
  }

  /** 將待分配會友指派至特定小組 */
  async function assignMember(
    memberId: string,
    groupId: string,
  ): Promise<{ success: boolean; message: string }> {
    isAssigning.value = true;
    try {
      const result = await $fetch<{ success: boolean; message: string }>(
        "/api/organization/assign-member",
        {
          method: "POST",
          body: { memberId, groupId },
        },
      );

      // 指派後重新整理資料
      await Promise.all([loadStructure(), loadPendingMembers()]);

      // 若當前正選取目標小組，則重新整理該小組的成員清單
      const currentGroup = selectedGroup.value;
      if (currentGroup && currentGroup.id === groupId) {
        await loadGroupMembers(
          groupId,
          currentGroup.name,
          currentGroup.zoneName,
        );
      }

      return result;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "分配失敗";
      return { success: false, message };
    } finally {
      isAssigning.value = false;
    }
  }

  /** 初始化所有資料 */
  async function initialize(): Promise<void> {
    await Promise.all([loadStructure(), loadPendingMembers()]);
  }

  return {
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
    memberCounts,
    loadStructure,
    loadPendingMembers,
    loadGroupMembers,
    assignMember,
    initialize,
  };
}
