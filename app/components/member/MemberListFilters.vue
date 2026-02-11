<script setup lang="ts">
/**
 * Member List Filters Component
 * Search bar + advanced filters (status, baptism, zone/group).
 */
import type { MemberFilters } from '~/types/member';
import type { OrganizationStructure } from '~/types/organization';

const props = defineProps<{
  filters: MemberFilters;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  search: [];
  clearSearch: [];
  applyFilters: [];
  resetFilters: [];
  'update:filters': [filters: MemberFilters];
}>();

const localFilters = computed({
  get: () => props.filters,
  set: (val) => emit('update:filters', val),
});

// Fetch organization structure for zone/group dropdowns
const orgStructure = ref<OrganizationStructure | null>(null);

onMounted(async () => {
  try {
    orgStructure.value = await $fetch<OrganizationStructure>('/api/organization/structure');
  } catch {
    console.error('Failed to load org structure');
  }
});

const zoneOptions = computed(() => {
  if (!orgStructure.value) return [];
  return [
    { label: '全部牧區', value: undefined },
    ...orgStructure.value.zones.map((z) => ({ label: z.name, value: z.id })),
  ];
});

const groupOptions = computed(() => {
  if (!orgStructure.value) return [];
  if (!localFilters.value.zoneId) {
    return [{ label: '請先選擇牧區', value: undefined }];
  }
  const zone = orgStructure.value.zones.find((z) => z.id === localFilters.value.zoneId);
  if (!zone) return [];
  return [
    { label: '全部小組', value: undefined },
    { label: '待分發', value: '__unassigned__' },
    ...zone.groups.map((g) => ({ label: g.name, value: g.id })),
  ];
});

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '啟用', value: 'Active' },
  { label: '停用', value: 'Inactive' },
  { label: '停權', value: 'Suspended' },
];

const baptismOptions = [
  { label: '全部', value: 'all' },
  { label: '已受洗', value: 'baptized' },
  { label: '未受洗', value: 'notBaptized' },
];

const searchFieldOptions = [
  { label: '姓名', value: 'fullName' },
  { label: '手機', value: 'mobile' },
];

function handleGroupChange(value: string | undefined): void {
  if (value === '__unassigned__') {
    localFilters.value.groupId = undefined;
    localFilters.value.unassigned = true;
  } else {
    localFilters.value.groupId = value;
    localFilters.value.unassigned = false;
  }
  emit('applyFilters');
}

function handleZoneChange(value: string | undefined): void {
  localFilters.value.zoneId = value;
  localFilters.value.groupId = undefined;
  localFilters.value.unassigned = false;
  emit('applyFilters');
}

function onSearchKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    emit('search');
  }
}
</script>

<template>
  <div class="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4">
    <!-- Search Row -->
    <div class="flex flex-col sm:flex-row gap-3">
      <div class="flex-1 flex gap-2">
        <Select
          :modelValue="localFilters.searchField"
          :options="searchFieldOptions"
          optionLabel="label"
          optionValue="value"
          class="w-24 shrink-0"
          size="small"
          @update:modelValue="localFilters.searchField = $event"
        />
        <InputText
          v-model="localFilters.search"
          :placeholder="localFilters.searchField === 'fullName' ? '搜尋姓名...' : '搜尋手機號碼 (完整號碼)'"
          class="flex-1"
          size="small"
          @keydown="onSearchKeydown"
        />
      </div>
      <div class="flex gap-2 shrink-0">
        <Button
          label="搜尋"
          icon="pi pi-search"
          size="small"
          :loading="isLoading"
          @click="$emit('search')"
        />
        <Button
          v-if="localFilters.search"
          label="清除"
          icon="pi pi-times"
          size="small"
          severity="secondary"
          outlined
          @click="$emit('clearSearch')"
        />
      </div>
    </div>

    <!-- Filter Row -->
    <div class="flex flex-wrap gap-3">
      <Select
        :modelValue="localFilters.status"
        :options="statusOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="會籍狀態"
        size="small"
        class="w-32"
        @update:modelValue="localFilters.status = $event; $emit('applyFilters')"
      />

      <Select
        :modelValue="localFilters.baptismStatus"
        :options="baptismOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="受洗狀態"
        size="small"
        class="w-32"
        @update:modelValue="localFilters.baptismStatus = $event; $emit('applyFilters')"
      />

      <Select
        :modelValue="localFilters.zoneId"
        :options="zoneOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="牧區"
        size="small"
        class="w-36"
        @update:modelValue="handleZoneChange($event)"
      />

      <Select
        v-if="localFilters.zoneId"
        :modelValue="localFilters.unassigned ? '__unassigned__' : localFilters.groupId"
        :options="groupOptions"
        optionLabel="label"
        optionValue="value"
        placeholder="小組"
        size="small"
        class="w-36"
        @update:modelValue="handleGroupChange($event)"
      />

      <Button
        label="重設"
        icon="pi pi-refresh"
        size="small"
        severity="secondary"
        text
        @click="$emit('resetFilters')"
      />
    </div>
  </div>
</template>
