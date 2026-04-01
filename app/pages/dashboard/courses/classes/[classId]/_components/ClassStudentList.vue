<script setup lang="ts">
const props = defineProps<{
  classId: string;
  // TODO: type should be Student/Member
  students: any[];
}>();
</script>

<template>
  <div class="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
    <div class="flex justify-between items-center mb-8 pb-4 border-b">
      <h3 class="text-xl font-bold text-slate-800 flex items-center gap-3">
        <i class="pi pi-users text-blue-600 text-2xl"></i>
        學生名單 ({{ students.length }})
      </h3>
      <Button label="指派學生" icon="pi pi-user-plus" outlined class="text-base px-6" />
    </div>

    <DataTable :value="students" stripedRows :paginator="true" :rows="10" class="text-base">
      <template #empty>
        <div class="text-center py-12 text-slate-500 text-base">
          目前尚未指派任何學生。
        </div>
      </template>
      <Column field="name" header="姓名" class="text-base font-bold text-slate-800"></Column>
      <Column field="mobile" header="聯絡電話" class="text-base text-slate-600"></Column>
      <Column field="status" header="狀態" class="text-base">
        <template #body="{ data }">
          <Tag
            :value="data.status === 'ASSIGNED' ? '已指派' : data.status"
            severity="info"
            class="text-base px-3 py-1"
          />
        </template>
      </Column>
      <Column header="操作" class="text-base">
        <template #body>
          <Button
            icon="pi pi-times"
            text
            severity="danger"
            rounded
            class="p-2"
            aria-label="移除"
          />
        </template>
      </Column>
    </DataTable>
  </div>
</template>
