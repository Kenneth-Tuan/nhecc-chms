<script setup lang="ts">
/**
 * 課程模板列表 DataTable (ST015)
 */
import type { CourseTemplateListItem } from '~/types/course'

defineProps<{
  templates: CourseTemplateListItem[]
  isLoading: boolean
  getFormatLabel: (value?: string) => string
  getFrequencyLabel: (value?: string) => string
}>()

const emit = defineEmits<{
  edit: [template: CourseTemplateListItem]
  viewClasses: [template: CourseTemplateListItem]
  createClass: [template: CourseTemplateListItem]
  toggleStatus: [template: CourseTemplateListItem]
}>()
</script>

<template>
  <DataTable
    :value="templates"
    :loading="isLoading"
    striped-rows
    responsive-layout="scroll"
    class="text-base"
  >
    <Column field="code" header="課程代號" sortable style="min-width: 120px" class="text-base">
      <template #body="{ data }">
        <span class="font-mono font-bold text-slate-600">{{ data.code }}</span>
      </template>
    </Column>

    <Column field="name" header="課程名稱" sortable style="min-width: 250px" class="font-bold text-slate-800 text-base" />

    <Column field="format" header="授課方式" style="min-width: 140px" class="text-base">
      <template #body="{ data }">
        {{ getFormatLabel(data.format) }}
      </template>
    </Column>

    <Column field="frequency" header="開課頻率" style="min-width: 140px" class="text-base">
      <template #body="{ data }">
        {{ getFrequencyLabel(data.frequency) }}
      </template>
    </Column>

    <Column
      field="prerequisiteCount"
      header="擋修條件"
      style="min-width: 120px"
      class="text-base"
    >
      <template #body="{ data }">
        <Tag
          v-if="data.prerequisiteCount > 0"
          :value="`${data.prerequisiteCount} 項`"
          severity="info"
          class="text-base px-3 py-1"
        />
        <span v-else class="text-slate-400">無</span>
      </template>
    </Column>

    <Column field="status" header="狀態" style="min-width: 120px" class="text-base">
      <template #body="{ data }">
        <ToggleSwitch
          :model-value="data.status === 'ACTIVE'"
          @update:model-value="emit('toggleStatus', data)"
        />
      </template>
    </Column>

    <Column header="操作" style="min-width: 150px" class="text-base">
      <template #body="{ data }">
        <div class="flex gap-3">
          <Button
            icon="pi pi-calendar-plus"
            text
            rounded
            class="p-2"
            v-tooltip.top="'建立班級'"
            @click="emit('createClass', data)"
          />
          <Button
            icon="pi pi-book"
            text
            rounded
            class="p-2"
            v-tooltip.top="'管理實體班級'"
            @click="emit('viewClasses', data)"
          />
          <Button
            icon="pi pi-pencil"
            text
            rounded
            class="p-2"
            v-tooltip.top="'編輯模板'"
            @click="emit('edit', data)"
          />
        </div>
      </template>
    </Column>

    <template #empty>
      <div class="text-center py-12 text-slate-400">
        <i class="pi pi-book text-5xl mb-4 block" />
        <p class="text-base font-medium">尚無課程模板資料</p>
      </div>
    </template>
  </DataTable>
</template>
