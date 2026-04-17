<script setup lang="ts">
/**
 * Access Control Dashboard Page
 * 使用者權限看板：顯示所有員工及其管轄範圍。
 */
import type { MemberListItem } from "~/types/member";
import type { DataAccess } from "~/types/data-access";
import AccessEditModal from "./_components/AccessEditModal.vue";

definePageMeta({
  layout: "dashboard",
});

const auth = useAuth();
const toast = useToast();

const members = ref<MemberListItem[]>([]);
const accessMap = ref<Record<string, DataAccess | null>>({});
const isLoading = ref(false);

async function fetchMembers(): Promise<void> {
  isLoading.value = true;
  try {
    const res = await $fetch<{ data: MemberListItem[]; pagination: any }>(
      "/api/members",
      {
        params: { pageSize: 100 },
      }
    );
    members.value = res.data;
  } catch {
    toast.add({
      severity: "error",
      summary: "錯誤",
      detail: "載入會友清單失敗",
      life: 3000,
    });
  } finally {
    isLoading.value = false;
  }
}

function getScopeSummary(userId: string): string {
  const da = accessMap.value[userId];
  if (!da) return "Self";

  const parts: string[] = [];
  if (da.admin.isGlobal) parts.push("全域行政");
  else {
    if (da.admin.zone.length > 0) parts.push(`${da.admin.zone.length} 牧區`);
    if (da.admin.group.length > 0) parts.push(`${da.admin.group.length} 小組`);
  }
  if (da.functions.isGlobal) parts.push("全域功能");
  else {
    const count = Object.values(da.functions.targets).flat().length;
    if (count > 0) parts.push(`${count} 功能目標`);
  }

  return parts.length > 0 ? parts.join(", ") : "Self";
}

function getScopeSeverity(userId: string): string {
  const da = accessMap.value[userId];
  if (!da) return "secondary";
  if (da.admin.isGlobal || da.functions.isGlobal) return "danger";
  if (da.admin.zone.length > 0) return "warn";
  if (
    da.admin.group.length > 0 ||
    Object.values(da.functions.targets).flat().length > 0
  )
    return "info";
  return "secondary";
}

// Modal state
const showEditModal = ref(false);
const editUserId = ref("");
const editUserName = ref("");
const editUserRoleNames = ref<string[]>([]);

function openEditModal(member: MemberListItem): void {
  editUserId.value = member.uuid;
  editUserName.value = member.fullName;
  editUserRoleNames.value = member.roleNames ?? [];
  showEditModal.value = true;
}

function onModalSaved(): void {
  fetchMembers();
}

onMounted(() => {
  fetchMembers();
});
</script>

<template>
  <div class="contents">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">存取權限管理</h1>
        <p class="text-sm text-slate-500 mt-1">
          管理員工的資料存取範圍（Admin / Functions）
        </p>
      </div>
    </div>

    <!-- Table -->
    <div
      class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800"
    >
      <DataTable
        :value="members"
        :loading="isLoading"
        stripedRows
        class="!border-none"
        :paginator="true"
        :rows="20"
        :rowsPerPageOptions="[10, 20, 50]"
      >
        <Column field="fullName" header="姓名" :style="{ minWidth: '160px' }">
          <template #body="{ data }">
            <div class="flex items-center gap-3">
              <Avatar
                :label="data.fullName?.charAt(0)"
                :image="data.avatar"
                shape="circle"
                class="!w-8 !h-8 !text-xs !bg-primary-100 dark:!bg-primary-900/40 !text-primary"
              />
              <span class="font-semibold">{{ data.fullName }}</span>
            </div>
          </template>
        </Column>

        <Column header="角色" :style="{ minWidth: '120px' }">
          <template #body="{ data }">
            <div class="flex flex-wrap gap-1">
              <Tag
                v-for="name in data.roleNames"
                :key="name"
                :value="name"
                severity="info"
                class="!text-[10px]"
              />
            </div>
          </template>
        </Column>

        <Column header="資料範圍" :style="{ minWidth: '180px' }">
          <template #body="{ data }">
            <Tag
              :value="getScopeSummary(data.uuid)"
              :severity="getScopeSeverity(data.uuid) as any"
              class="!text-xs"
            />
          </template>
        </Column>

        <Column header="操作" :style="{ width: '100px' }">
          <template #body="{ data }">
            <Button
              v-if="auth.can('manage', 'System')"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              v-tooltip.top="'編輯授權'"
              @click="openEditModal(data)"
            />
          </template>
        </Column>

        <template #empty>
          <div class="text-center py-8 text-slate-400">
            <i class="pi pi-shield text-4xl mb-3" />
            <p>尚無資料</p>
          </div>
        </template>
      </DataTable>
    </div>

    <!-- Edit Modal -->
    <AccessEditModal
      :visible="showEditModal"
      :user-id="editUserId"
      :user-name="editUserName"
      :role-names="editUserRoleNames"
      @close="showEditModal = false"
      @saved="onModalSaved"
    />
  </div>
</template>
