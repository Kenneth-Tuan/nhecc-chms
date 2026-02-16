/**
 * Zone-Group Cascade Composable (ST004)
 * Handles cascading dropdown logic for zone -> group selection.
 */
import type { Ref } from 'vue';
import type { Zone, Group } from '~/types/organization';

export function useZoneGroupCascade() {
  const zones = ref<Zone[]>([]);
  const allGroups = ref<Group[]>([]);
  const filteredGroups = ref<Group[]>([]);
  const isLoading = ref(false);

  /** Fetch organization structure (zones + groups) */
  async function fetchOrganizationStructure(): Promise<void> {
    isLoading.value = true;
    try {
      const response = await $fetch<{ zones: Zone[]; functionalGroups: Group[] }>(
        '/api/organization/structure',
      );

      zones.value = response.zones.map((z) => ({
        id: z.id,
        name: z.name,
        leaderId: z.leaderId,
        leaderName: z.leaderName,
        status: z.status,
        createdAt: z.createdAt,
        updatedAt: z.updatedAt,
      }));

      // Flatten groups from zone structure
      const pastoralGroups: Group[] = [];
      for (const zone of response.zones) {
        if ('groups' in zone && Array.isArray((zone as Record<string, unknown>).groups)) {
          for (const group of (zone as { groups: Group[] }).groups) {
            pastoralGroups.push(group);
          }
        }
      }
      allGroups.value = pastoralGroups;
    } catch (error) {
      console.error('Failed to fetch organization structure:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  }

  /** Filter groups by the selected zone ID */
  function filterGroupsByZone(zoneId: string | null | undefined): void {
    if (!zoneId) {
      filteredGroups.value = [];
      return;
    }
    filteredGroups.value = allGroups.value.filter(
      (group) => group.type === 'Pastoral' && group.zoneId === zoneId,
    );
  }

  /** Watch zone changes and auto-clear the group selection */
  function watchZoneChange(
    zoneIdRef: Ref<string | null | undefined>,
    groupIdRef: Ref<string | null | undefined>,
  ): void {
    watch(zoneIdRef, (newZoneId) => {
      groupIdRef.value = null;
      filterGroupsByZone(newZoneId);
    });
  }

  /** Check if a zone-group combination is mismatched (for edit mode warning) */
  function isZoneGroupMismatch(
    zoneId: string | undefined,
    groupId: string | undefined,
  ): boolean {
    if (!zoneId || !groupId) return false;

    const group = allGroups.value.find((g) => g.id === groupId);
    if (!group) return true;
    if (group.type === 'Functional') return false;

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
