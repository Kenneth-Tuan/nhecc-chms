/**
 * Member List Composable
 * Handles fetching, filtering, sorting, and pagination of members.
 */
import type { MemberListItem, MemberFilters } from '~/types/member';
import type { PaginatedResponse } from '~/types/api';

export function useMemberList() {
  const members = ref<MemberListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  const pagination = ref({
    page: 1,
    pageSize: 20,
    totalItems: 0,
    totalPages: 0,
  });

  const filters = ref<MemberFilters>({
    search: '',
    searchField: 'fullName',
    status: 'Active',
    baptismStatus: 'all',
    zoneId: undefined,
    groupId: undefined,
    unassigned: false,
  });

  const sortBy = ref('createdAt');
  const sortOrder = ref<'asc' | 'desc'>('desc');

  /** Fetch members from API */
  async function fetchMembers(): Promise<void> {
    isLoading.value = true;
    error.value = null;

    try {
      const query: Record<string, string | number | boolean | undefined> = {
        page: pagination.value.page,
        pageSize: pagination.value.pageSize,
        sortBy: sortBy.value,
        sortOrder: sortOrder.value,
      };

      // Add filters
      if (filters.value.search) {
        query.search = filters.value.search;
        query.searchField = filters.value.searchField;
      }
      if (filters.value.status && filters.value.status !== 'all') {
        query.status = filters.value.status;
      }
      if (filters.value.baptismStatus && filters.value.baptismStatus !== 'all') {
        query.baptismStatus = filters.value.baptismStatus;
      }
      if (filters.value.zoneId) {
        query.zoneId = filters.value.zoneId;
      }
      if (filters.value.groupId) {
        query.groupId = filters.value.groupId;
      }
      if (filters.value.unassigned) {
        query.unassigned = 'true';
      }

      const response = await $fetch<PaginatedResponse<MemberListItem>>(
        '/api/members',
        { query },
      );

      members.value = response.data;
      pagination.value = response.pagination;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '載入會友列表失敗';
      error.value = message;
      console.error('Failed to fetch members:', err);
    } finally {
      isLoading.value = false;
    }
  }

  /** Change page */
  function goToPage(page: number): void {
    pagination.value.page = page;
    fetchMembers();
  }

  /** Change page size */
  function changePageSize(size: number): void {
    pagination.value.pageSize = size;
    pagination.value.page = 1;
    fetchMembers();
  }

  /** Apply search */
  function search(): void {
    pagination.value.page = 1;
    fetchMembers();
  }

  /** Clear search */
  function clearSearch(): void {
    filters.value.search = '';
    pagination.value.page = 1;
    fetchMembers();
  }

  /** Apply filters */
  function applyFilters(): void {
    pagination.value.page = 1;
    fetchMembers();
  }

  /** Reset all filters */
  function resetFilters(): void {
    filters.value = {
      search: '',
      searchField: 'fullName',
      status: 'Active',
      baptismStatus: 'all',
      zoneId: undefined,
      groupId: undefined,
      unassigned: false,
    };
    pagination.value.page = 1;
    fetchMembers();
  }

  /** Change sort */
  function changeSort(field: string): void {
    if (sortBy.value === field) {
      sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
    } else {
      sortBy.value = field;
      sortOrder.value = 'desc';
    }
    fetchMembers();
  }

  return {
    members,
    isLoading,
    error,
    pagination,
    filters,
    sortBy,
    sortOrder,
    fetchMembers,
    goToPage,
    changePageSize,
    search,
    clearSearch,
    applyFilters,
    resetFilters,
    changeSort,
  };
}
