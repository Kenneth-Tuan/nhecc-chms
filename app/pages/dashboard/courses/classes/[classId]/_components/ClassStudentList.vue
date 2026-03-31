<script setup lang="ts">
const props = defineProps<{
  classId: string;
  // TODO: type should be Student/Member
  students: any[];
}>();
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
    <div class="flex justify-between items-center mb-6">
      <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
        <i class="pi pi-users text-emerald-600"></i>
        學生名單 ({{ students.length }})
      </h3>
      <Button label="指派學生" icon="pi pi-user-plus" outlined size="small" />
    </div>

    <DataTable :value="students" stripedRows :paginator="true" :rows="10">
      <template #empty>
        <div class="text-center p-8 text-slate-500 text-lg">
          目前尚未指派任何學生。
        </div>
      </template>
      <Column field="name" header="姓名" class="text-lg"></Column>
      <Column field="mobile" header="聯絡電話" class="text-lg"></Column>
      <Column field="status" header="狀態">
        <template #body="{ data }">
          <Tag
            :value="data.status === 'ASSIGNED' ? '已指派' : data.status"
            severity="info"
          />
        </template>
      </Column>
      <Column header="操作">
        <template #body>
          <Button
            icon="pi pi-times"
            text
            severity="danger"
            rounded
            aria-label="移除"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
