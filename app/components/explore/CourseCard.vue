<script setup lang="ts">
import type { CourseClass } from "~/types/course-class";
import type { Prerequisite } from "~/types/course";

const props = defineProps<{
  course: CourseClass & {
    templateName: string;
    templateCode: string;
    prerequisites: Prerequisite[];
  };
  userStatus: {
    completedCodes: string[];
    isBaptised: boolean;
    isNewcomer: boolean;
  };
}>();

// 檢查是否已額滿
const isFull = computed(
  () => props.course.enrollmentCount >= props.course.maxCapacity,
);

// 檢查是否已報名
const isAlreadyEnrolled = computed(() => {
  return props.course.studentIds?.includes(
    useAuth().userContext.value?.userId || "",
  );
});
</script>

<template>
  <NuxtLink
    :to="`/explore/${course.id}`"
    class="block h-full no-underline group"
  >
    <Card
      class="h-full border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col transition-all duration-500 transform group-hover:-translate-y-2 group-hover:shadow-2xl dark:group-hover:shadow-blue-900/20 group-hover:border-blue-400 dark:group-hover:border-blue-500 rounded-3xl bg-white dark:bg-slate-900 relative"
    >
      <template #content>
        <div class="flex flex-col h-full p-2">
          <!-- 上方標籤區 -->
          <div class="flex justify-between items-center mb-6">
            <span
              class="text-[13px] font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full uppercase border border-blue-100 dark:border-blue-800/50"
            >
              {{ course.templateCode }}
            </span>
            <div class="flex gap-2">
              <Badge
                v-if="isAlreadyEnrolled"
                value="已報名"
                severity="success"
                class="font-black !px-3 !py-1 !rounded-full text-xs"
              />
              <Badge
                v-else-if="isFull"
                value="已額滿"
                severity="danger"
                class="font-black !px-3 !py-1 !rounded-full text-xs"
              />
            </div>
          </div>

          <!-- 課程名稱 (SAT.cool Style: 大標題、粗體、高對比) -->
          <h2
            class="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-3 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2"
          >
            {{ course.templateName }}
          </h2>

          <!-- 班級名稱 -->
          <p
            class="text-gray-400 dark:text-gray-500 font-bold text-base mb-8 flex items-center gap-1.5"
          >
            <i class="pi pi-tag text-xs" />
            {{ course.name }}
          </p>

          <div class="mt-auto pt-6 border-t border-gray-50 dark:border-slate-800">
            <!-- 報名進度 (極簡化) -->
            <div class="flex justify-between items-center mb-3">
              <span
                class="text-xs text-gray-400 dark:text-gray-500 font-black uppercase tracking-wider"
              >
                報名進度
              </span>
              <span class="text-sm font-black text-gray-800 dark:text-gray-200">
                <span :class="isFull ? 'text-red-500' : 'text-blue-600 dark:text-blue-400'">{{
                  course.enrollmentCount
                }}</span>
                <span class="text-gray-300 dark:text-gray-600 mx-1">/</span>
                <span>{{ course.maxCapacity }}</span>
              </span>
            </div>
            <ProgressBar
              :value="
                Math.min(
                  (course.enrollmentCount / course.maxCapacity) * 100,
                  100,
                )
              "
              :show-value="false"
              class="!h-2 !bg-gray-100 dark:!bg-slate-800 !rounded-full overflow-hidden"
            />
          </div>
        </div>
      </template>
    </Card>
  </NuxtLink>
</template>

<style scoped>
:deep(.p-card-body) {
  padding: 2rem;
  height: 100%;
}
:deep(.p-card-content) {
  padding: 0;
  height: 100%;
}

/* SAT.cool 風格微調 */
h2 {
  letter-spacing: -0.03em;
}

:deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--p-blue-400), var(--p-blue-600));
}

:deep(.p-badge) {
  font-size: 0.75rem;
}
</style>
