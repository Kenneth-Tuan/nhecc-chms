/**
 * Organization Store (ST004)
 * Caches organization structure (zones/groups) and courses data with TTL.
 */
import { defineStore } from 'pinia';
import type { Zone, Group, Course, ZoneWithGroups } from '~/types/organization';
import type { Role } from '~/types/role';

const STRUCTURE_CACHE_TTL = 10 * 60 * 1000; // 10 minutes
const COURSES_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const ROLES_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

export const useOrganizationStore = defineStore('organization', () => {
  const zones = ref<Zone[]>([]);
  const groups = ref<Group[]>([]);
  const courses = ref<Course[]>([]);
  const roles = ref<Role[]>([]);

  const structureFetchedAt = ref<number>(0);
  const coursesFetchedAt = ref<number>(0);
  const rolesFetchedAt = ref<number>(0);

  const isLoadingStructure = ref(false);
  const isLoadingCourses = ref(false);
  const isLoadingRoles = ref(false);

  /** Check if structure cache is valid */
  function isStructureCacheValid(): boolean {
    return structureFetchedAt.value > 0
      && Date.now() - structureFetchedAt.value < STRUCTURE_CACHE_TTL;
  }

  /** Check if courses cache is valid */
  function isCoursesCacheValid(): boolean {
    return coursesFetchedAt.value > 0
      && Date.now() - coursesFetchedAt.value < COURSES_CACHE_TTL;
  }

  /** Check if roles cache is valid */
  function isRolesCacheValid(): boolean {
    return rolesFetchedAt.value > 0
      && Date.now() - rolesFetchedAt.value < ROLES_CACHE_TTL;
  }

  /** Fetch organization structure (zones + groups) */
  async function fetchStructure(forceRefresh = false): Promise<void> {
    if (!forceRefresh && isStructureCacheValid()) return;

    isLoadingStructure.value = true;
    try {
      const response = await $fetch<{ zones: ZoneWithGroups[]; functionalGroups: Group[] }>(
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

      const allGroups: Group[] = [];
      for (const zone of response.zones) {
        if (zone.groups) {
          for (const group of zone.groups) {
            allGroups.push(group);
          }
        }
      }
      // Include functional groups
      if (response.functionalGroups) {
        allGroups.push(...response.functionalGroups);
      }
      groups.value = allGroups;
      structureFetchedAt.value = Date.now();
    } catch (error) {
      console.error('Failed to fetch organization structure:', error);
      throw error;
    } finally {
      isLoadingStructure.value = false;
    }
  }

  /** Fetch course list */
  async function fetchCourses(forceRefresh = false): Promise<void> {
    if (!forceRefresh && isCoursesCacheValid()) return;

    isLoadingCourses.value = true;
    try {
      const response = await $fetch<{ data: Course[] }>('/api/courses');
      courses.value = response.data || [];
      coursesFetchedAt.value = Date.now();
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      // Non-critical: don't throw, courses are optional
      courses.value = [];
    } finally {
      isLoadingCourses.value = false;
    }
  }

  /** Fetch active roles for dropdown */
  async function fetchRoles(forceRefresh = false): Promise<void> {
    if (!forceRefresh && isRolesCacheValid()) return;

    isLoadingRoles.value = true;
    try {
      const response = await $fetch<{ data: Role[] }>('/api/roles');
      roles.value = response.data || [];
      rolesFetchedAt.value = Date.now();
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      roles.value = [];
    } finally {
      isLoadingRoles.value = false;
    }
  }

  /** Get groups filtered by zone ID */
  function getGroupsByZone(zoneId: string): Group[] {
    return groups.value.filter(
      (g) => g.type === 'Pastoral' && g.zoneId === zoneId,
    );
  }

  /** Invalidate all caches */
  function invalidateAll(): void {
    structureFetchedAt.value = 0;
    coursesFetchedAt.value = 0;
    rolesFetchedAt.value = 0;
  }

  return {
    zones,
    groups,
    courses,
    roles,
    isLoadingStructure,
    isLoadingCourses,
    isLoadingRoles,
    fetchStructure,
    fetchCourses,
    fetchRoles,
    getGroupsByZone,
    invalidateAll,
  };
});
