<script setup lang="ts">
/**
 * Member Quick View Modal (ST003)
 * Two tabs: Basic Info + Course Records
 * Responsive: Modal on desktop, bottom sheet on mobile.
 */
import type { MemberDetail } from '~/types/member';

const props = defineProps<{
  visible: boolean;
  member: MemberDetail | null;
  isLoading: boolean;
}>();

const emit = defineEmits<{
  close: [];
}>();

const activeTab = ref(0);

// Reset tab when opening
watch(() => props.visible, (val) => {
  if (val) activeTab.value = 0;
});
</script>

<template>
  <Dialog
    :visible="visible"
    :modal="true"
    :dismissableMask="true"
    :style="{ width: '800px', maxWidth: '95vw' }"
    :breakpoints="{ '640px': '100vw' }"
    position="center"
    :draggable="false"
    :closable="true"
    @update:visible="!$event && $emit('close')"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <i class="pi pi-user text-primary" />
        <span class="font-semibold">
          {{ member?.fullName || '載入中...' }}
        </span>
      </div>
    </template>

    <!-- Loading -->
    <div v-if="isLoading" class="flex justify-center py-12">
      <ProgressSpinner />
    </div>

    <!-- Content -->
    <div v-else-if="member" class="min-h-[400px]">
      <TabView v-model:activeIndex="activeTab">
        <TabPanel header="基本資料">
          <MemberBasicInfo :member="member" />
        </TabPanel>
        <TabPanel header="修課紀錄">
          <MemberCourseRecords :course-records="member.courseRecords" />
        </TabPanel>
      </TabView>
    </div>

    <!-- Error / No Data -->
    <div v-else class="text-center py-12 text-slate-400">
      <i class="pi pi-exclamation-circle text-4xl mb-3" />
      <p>無法載入會友資料</p>
    </div>
  </Dialog>
</template>
