<script setup lang="ts">
/**
 * Member List Table Component (ST003)
 * PrimeVue DataTable with all required columns.
 */
import type { MemberListItem } from '~/types/member';

const props = defineProps<{
  members: MemberListItem[];
  isLoading: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}>();

const emit = defineEmits<{
  rowClick: [member: MemberListItem];
  edit: [member: MemberListItem];
  delete: [member: MemberListItem];
  sort: [field: string];
}>();

const auth = useAuth();

const statusSeverity: Record<string, string> = {
  Active: 'success',
  Inactive: 'secondary',
  Suspended: 'danger',
};

const statusLabel: Record<string, string> = {
  Active: '啟用',
  Inactive: '停用',
  Suspended: '停權',
};

function onRowClick(event: { data: MemberListItem }): void {
  emit('rowClick', event.data);
}
</script>

<template>
  <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    <DataTable
      :value="members"
      :loading="isLoading"
      stripedRows
      rowHover
      class="!border-none cursor-pointer"
      @row-click="onRowClick"
    >
      <!-- Avatar + Name -->
      <Column header="會友" :style="{ minWidth: '200px' }">
        <template #body="{ data }">
          <div class="flex items-center gap-3">
            <Avatar
              :label="data.fullName?.charAt(0)"
              :image="data.avatar"
              shape="circle"
              class="!bg-primary-100 dark:!bg-primary-900/30 !text-primary !text-sm shrink-0"
            />
            <div>
              <p class="font-semibold text-sm">{{ data.fullName }}</p>
              <div class="flex items-center gap-1.5 mt-0.5">
                <i
                  :class="[
                    data.gender === 'Male' ? 'pi pi-mars text-blue-500' : 'pi pi-venus text-pink-500',
                    'text-xs',
                  ]"
                />
                <span class="text-xs text-slate-400">{{ data.age }} 歲</span>
              </div>
            </div>
          </div>
        </template>
      </Column>

      <!-- Contact (masked) -->
      <Column header="聯絡資訊" :style="{ minWidth: '150px' }">
        <template #body="{ data }">
          <div class="text-sm">
            <p class="text-slate-500">{{ data.mobile }}</p>
          </div>
        </template>
      </Column>

      <!-- Roles -->
      <Column header="角色" :style="{ minWidth: '140px' }">
        <template #body="{ data }">
          <div class="flex items-center gap-1 flex-wrap">
            <Tag
              v-if="data.roleNames.length > 0"
              :value="data.roleNames[0]"
              severity="info"
              class="!text-xs"
            />
            <Tag
              v-if="data.roleNames.length > 1"
              :value="`+${data.roleNames.length - 1}`"
              severity="secondary"
              class="!text-xs"
              v-tooltip.top="data.roleNames.slice(1).join(', ')"
            />
          </div>
        </template>
      </Column>

      <!-- Group -->
      <Column header="歸屬小組" :style="{ minWidth: '120px' }">
        <template #body="{ data }">
          <Tag
            v-if="data.groupName"
            :value="data.groupName"
            severity="info"
            class="!text-xs"
          />
          <Tag
            v-else
            value="待分發"
            severity="warn"
            class="!text-xs cursor-pointer"
          />
        </template>
      </Column>

      <!-- Baptism -->
      <Column header="受洗" :style="{ width: '80px' }">
        <template #body="{ data }">
          <i
            :class="[
              data.baptismStatus ? 'pi pi-check-circle text-green-500' : 'pi pi-minus-circle text-slate-300',
              'text-base',
            ]"
          />
        </template>
      </Column>

      <!-- Status -->
      <Column header="狀態" :style="{ width: '80px' }">
        <template #body="{ data }">
          <Tag
            :value="statusLabel[data.status] || data.status"
            :severity="(statusSeverity[data.status] as any) || 'info'"
            class="!text-xs"
          />
        </template>
      </Column>

      <!-- Actions -->
      <Column header="操作" :style="{ width: '100px' }">
        <template #body="{ data }">
          <div class="flex items-center gap-1" @click.stop>
            <Button
              v-if="auth.hasPermission('member:edit')"
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              @click.stop="$emit('edit', data)"
            />
            <Button
              v-if="auth.hasPermission('member:delete')"
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click.stop="$emit('delete', data)"
            />
          </div>
        </template>
      </Column>

      <!-- Empty State -->
      <template #empty>
        <div class="text-center py-12 text-slate-400">
          <i class="pi pi-users text-5xl mb-4" />
          <p class="text-lg font-medium mb-1">沒有找到會友資料</p>
          <p class="text-sm">請調整搜尋條件或篩選條件</p>
        </div>
      </template>

      <!-- Loading -->
      <template #loading>
        <div class="text-center py-12">
          <ProgressSpinner />
          <p class="text-sm text-slate-400 mt-2">載入中...</p>
        </div>
      </template>
    </DataTable>
  </div>
</template>
