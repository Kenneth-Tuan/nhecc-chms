<script setup lang="ts">
/**
 * Member List Page (ST003 + ST004 Integration)
 */
import type { MemberListItem, MemberDetail } from '~/types/member';

definePageMeta({
  layout: 'dashboard',
});

const auth = useAuth();
const router = useRouter();
const toast = useToast();
const {
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
} = useMemberList();

// Quick View Modal
const showQuickView = ref(false);
const selectedMember = ref<MemberDetail | null>(null);
const isLoadingDetail = ref(false);

async function openQuickView(member: MemberListItem): Promise<void> {
  showQuickView.value = true;
  isLoadingDetail.value = true;

  try {
    const detail = await $fetch<MemberDetail>(`/api/members/${member.uuid}`);
    selectedMember.value = detail;
  } catch {
    toast.add({ severity: 'error', summary: '錯誤', detail: '載入會友詳情失敗', life: 3000 });
    showQuickView.value = false;
  } finally {
    isLoadingDetail.value = false;
  }
}

function closeQuickView(): void {
  showQuickView.value = false;
  selectedMember.value = null;
}

// Delete confirmation (ST004)
const showDeleteDialog = ref(false);
const memberToDelete = ref<MemberListItem | null>(null);

function confirmDelete(member: MemberListItem): void {
  memberToDelete.value = member;
  showDeleteDialog.value = true;
}

function onMemberDeleted(): void {
  memberToDelete.value = null;
  fetchMembers();
}

// Edit navigation (ST004)
function editMember(member: MemberListItem): void {
  router.push(`/dashboard/members/${member.uuid}/edit`);
}

// Page size options
const pageSizeOptions = [10, 20, 50, 100];

// Initialize
onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">會友管理</h1>
        <p class="text-sm text-slate-500 mt-1">
          共 {{ pagination.totalItems }} 位會友
        </p>
      </div>
      <Button
        v-if="auth.hasPermission('member:create')"
        label="新增會友"
        icon="pi pi-plus"
        @click="router.push('/dashboard/members/create')"
      />
    </div>

    <!-- Filters -->
    <div class="mb-4">
      <MemberListFilters
        v-model:filters="filters"
        :is-loading="isLoading"
        @search="search"
        @clear-search="clearSearch"
        @apply-filters="applyFilters"
        @reset-filters="resetFilters"
      />
    </div>

    <!-- Search result hint -->
    <div v-if="filters.search && !isLoading" class="mb-3">
      <p class="text-sm text-slate-500">
        找到 <strong>{{ pagination.totalItems }}</strong> 筆符合「<strong>{{ filters.search }}</strong>」的資料
      </p>
    </div>

    <!-- Error -->
    <Message v-if="error" severity="error" :closable="false" class="mb-4">
      {{ error }}
      <Button label="重試" size="small" text class="ml-2" @click="fetchMembers" />
    </Message>

    <!-- Table -->
    <MemberListTable
      :members="members"
      :is-loading="isLoading"
      :sort-by="sortBy"
      :sort-order="sortOrder"
      @row-click="openQuickView"
      @edit="editMember"
      @delete="confirmDelete"
      @sort="changeSort"
    />

    <!-- Pagination -->
    <div v-if="pagination.totalPages > 0" class="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
      <div class="flex items-center gap-2 text-sm text-slate-500">
        <span>
          顯示 {{ (pagination.page - 1) * pagination.pageSize + 1 }}–{{
            Math.min(pagination.page * pagination.pageSize, pagination.totalItems)
          }} 筆，共 {{ pagination.totalItems }} 筆
        </span>
        <Select
          :modelValue="pagination.pageSize"
          :options="pageSizeOptions.map((s) => ({ label: `${s} 筆/頁`, value: s }))"
          optionLabel="label"
          optionValue="value"
          size="small"
          class="w-28"
          @update:modelValue="changePageSize($event)"
        />
      </div>
      <Paginator
        :rows="pagination.pageSize"
        :totalRecords="pagination.totalItems"
        :first="(pagination.page - 1) * pagination.pageSize"
        :rowsPerPageOptions="pageSizeOptions"
        template="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink"
        @page="goToPage($event.page + 1)"
      />
    </div>

    <!-- Quick View Modal -->
    <MemberQuickViewModal
      :visible="showQuickView"
      :member="selectedMember"
      :is-loading="isLoadingDetail"
      @close="closeQuickView"
    />

    <!-- Delete Confirmation Dialog (ST004) -->
    <MemberDeleteDialog
      v-if="memberToDelete"
      v-model:visible="showDeleteDialog"
      :member-name="memberToDelete.fullName"
      :member-uuid="memberToDelete.uuid"
      @deleted="onMemberDeleted"
    />
  </div>
</template>
