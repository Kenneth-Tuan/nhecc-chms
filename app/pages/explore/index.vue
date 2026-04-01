<script setup lang="ts">
import { useAuth } from "~/composables/useAuth";

definePageMeta({
  // middleware: ['auth'] // auth.global.ts 已全域處理身分驗證，此處宣告會導致 Unknown middleware 錯誤
});

const { userContext } = useAuth();

const { data, pending } = useFetch<{
  courses: any[];
  categories: { id: string; name: string }[];
  userStatus: {
    completedCodes: string[];
    isBaptised: boolean;
    isNewcomer: boolean;
  };
}>("/api/explore/courses");

const selectedCategoryId = ref("all");

const categoryOptions = computed(() => {
  const options = [{ id: "all", name: "全部" }];
  if (data.value?.categories) {
    // 濾掉重複或無效的分類，並依照名稱排序
    const uniqueCategories = data.value.categories
      .filter(
        (c, index, self) => self.findIndex((t) => t.id === c.id) === index,
      )
      .sort((a, b) => a.name.localeCompare(b.name, "zh-TW"));
    options.push(...uniqueCategories);
  }
  return options;
});

const filteredCourses = computed(() => {
  const all = data.value?.courses || [];
  if (selectedCategoryId.value === "all") return all;
  return all.filter((c: any) => c.categoryId === selectedCategoryId.value);
});

const userStatus = computed(
  () =>
    data.value?.userStatus || {
      completedCodes: [],
      isBaptised: false,
      isNewcomer: false,
    },
);
</script>

<template>
  <div class="contents">
    <main class="max-w-[1400px] mx-auto pb-20 px-4 sm:px-6">
      <div
        class="py-4 md:py-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8"
      >
        <div>
          <h1
            class="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-4"
          >
            探索課程
          </h1>
          <p
            class="text-gray-400 dark:text-gray-500 mt-2 text-xl md:text-2xl font-medium tracking-tight"
          >
            發現適合您的成長路徑，開啟屬靈新視角
          </p>
        </div>
      </div>

      <!-- Categories Filter -->
      <div class="mb-16">
        <SelectButton
          v-model="selectedCategoryId"
          :options="categoryOptions"
          option-label="name"
          option-value="id"
          aria-labelledby="basic"
          class="flex-wrap gap-3"
        />
      </div>

      <!-- Loading State -->
      <div
        v-if="pending && !data"
        class="flex flex-col items-center justify-center py-32"
      >
        <ProgressSpinner />
        <p class="mt-6 text-gray-400 dark:text-gray-500 text-xl font-bold">
          正在探索精彩課程...
        </p>
      </div>

      <!-- Empty State -->
      <div
        v-else-if="filteredCourses.length === 0"
        class="flex flex-col items-center justify-center py-32 bg-gray-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-slate-800"
      >
        <div
          class="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-8 shadow-sm"
        >
          <i class="pi pi-search text-4xl text-gray-300 dark:text-gray-600" />
        </div>
        <p class="text-gray-900 dark:text-white text-3xl font-black mb-3">
          此分類暫無開放課程
        </p>
        <p class="text-gray-400 dark:text-gray-500 text-xl mb-10">
          您可以試試看其他分類，或稍後再回來查看
        </p>
        <Button
          label="查看全部課程"
          icon="pi pi-filter-slash"
          severity="secondary"
          class="!rounded-2xl !px-8 !py-4 font-black"
          @click="selectedCategoryId = 'all'"
        />
      </div>

      <!-- Course Grid (4 columns) -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10"
      >
        <ExploreCourseCard
          v-for="course in filteredCourses"
          :key="course.id"
          :course="course"
          :user-status="userStatus"
        />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* SAT.cool 風格標題 */
h1 {
  letter-spacing: -0.05em;
}

:deep(.p-selectbutton) {
  background: transparent;
  border: none;
  gap: 0.75rem;
}

:deep(.p-selectbutton .p-button) {
  border-radius: 1rem !important;
  border: 1px solid #f1f5f9 !important;
  background: white;
  color: #64748b;
  font-weight: 800;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.dark :deep(.p-selectbutton .p-button) {
  border-color: #1e293b !important;
  background: #0f172a;
  color: #94a3b8;
}

:deep(.p-selectbutton .p-button.p-highlight) {
  background: #2563eb !important;
  border-color: #2563eb !important;
  color: white !important;
  box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.2);
}

.dark :deep(.p-selectbutton .p-button.p-highlight) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: white !important;
}

:deep(.p-selectbutton .p-button:not(.p-highlight):hover) {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  color: #2563eb;
}

.dark :deep(.p-selectbutton .p-button:not(.p-highlight):hover) {
  background: #1e293b !important;
  border-color: #334155 !important;
  color: #60a5fa;
}
</style>
