/**
 * 牧區-小組級聯 Composable (ST004)
 * 處理牧區 -> 小組選擇的級聯下拉選單邏輯。
 */
import type { Ref } from "vue";
import type { Zone, Group } from "~/types/organization";

export function useZoneGroupCascade() {
  const zones = ref<Zone[]>([]);
  const allGroups = ref<Group[]>([]);
  const filteredGroups = ref<Group[]>([]);
  const isLoading = ref(false);

  /** 獲取組織架構（牧區 + 小組） */
  async function fetchOrganizationStructure(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch<{
        zones: Zone[];
        functionalGroups: Group[];
      }>("/api/organization/structure");

      zones.value = response.zones.map((z) => ({
        id: z.id,
        name: z.name,
        leaderId: z.leaderId,
        leaderName: z.leaderName,
        status: z.status,
        createdAt: z.createdAt,
        updatedAt: z.updatedAt,
      }));

      // 從牧區結構中提取平坦的小組清單
      const pastoralGroups: Group[] = [];
      for (const zone of response.zones) {
        if (
          "groups" in zone &&
          Array.isArray((zone as Record<string, unknown>).groups)
        ) {
          for (const group of (zone as { groups: Group[] }).groups) {
            pastoralGroups.push(group);
          }
        }
      }
      allGroups.value = pastoralGroups;
    } catch (error) {
      console.error("Failed to fetch organization structure:", error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /** 根據選取的牧區 ID 過濾小組 */
  function filterGroupsByZone(zoneId: string | null | undefined): void {
    if (!zoneId) {
      filteredGroups.value = [];
      return;
    }
    filteredGroups.value = allGroups.value.filter(
      (group) => group.type === "Pastoral" && group.zoneId === zoneId,
    );
  }

  /** 監聽牧區變動並自動清除已選取的小組 */
  function watchZoneChange(
    zoneIdRef: Ref<string | null | undefined>,
    groupIdRef: Ref<string | null | undefined>,
  ): void {
    watch(zoneIdRef, (newZoneId) => {
      groupIdRef.value = null;
      filterGroupsByZone(newZoneId);
    });
  }

  /** 檢查牧區與小組組合是否不匹配（用於編輯模式警告） */
  function isZoneGroupMismatch(
    zoneId: string | undefined,
    groupId: string | undefined,
  ): boolean {
    if (!zoneId || !groupId) return false;

    const group = allGroups.value.find((g) => g.id === groupId);
    if (!group) return true;
    if (group.type === "Functional") return false;

    return group.zoneId !== zoneId;
  }

  return {
    zones,
    allGroups,
    filteredGroups,
    isLoading,
    fetchOrganizationStructure,
    filterGroupsByZone,
    watchZoneChange,
    isZoneGroupMismatch,
  };
}
