<script setup lang="ts">
const route = useRoute();
const id = route.params.id as string;
const { userContext } = useAuth();
const { showSuccess, showError } = useAppDialog();

const { data, pending, error, refresh } = useFetch<{
  course: any;
  userStatus: {
    completedCodes: string[];
    isBaptised: boolean;
    isNewcomer: boolean;
  };
}>(`/api/explore/courses/${id}`);

const enrolling = ref(false);

const course = computed(() => data.value?.course);
const userStatus = computed(
  () =>
    data.value?.userStatus || {
      completedCodes: [],
      isBaptised: false,
      isNewcomer: false,
    },
);

// 檢查是否已額滿
const isFull = computed(
  () => course.value?.enrollmentCount >= course.value?.maxCapacity,
);

// 檢查是否已報名
const isAlreadyEnrolled = computed(() => {
  return course.value?.studentIds?.includes(userContext.value?.userId || "");
});

// 先修條件檢查
const failedPrerequisites = computed(() => {
  const failed: string[] = [];
  if (!course.value?.prerequisites) return failed;

  for (const p of course.value.prerequisites) {
    if (p.type === "COURSE") {
      if (!userStatus.value.completedCodes.includes(p.value)) {
        failed.push(`課程代號 ${p.value}`);
      }
    } else if (p.type === "STATUS") {
      if (p.value === "BAPTISED" && !userStatus.value.isBaptised) {
        failed.push("需已受洗");
      }
      if (p.value === "IS_NEWCOMER" && !userStatus.value.isNewcomer) {
        failed.push("需為新進教友");
      }
    }
  }
  return failed;
});

const hasFailedPrereq = computed(() => failedPrerequisites.value.length > 0);

const canEnroll = computed(() => {
  return !isFull.value && !hasFailedPrereq.value && !isAlreadyEnrolled.value;
});

const handleEnroll = async () => {
  if (!canEnroll.value) return;

  enrolling.value = true;
  try {
    await $fetch("/api/explore/enroll", {
      method: "POST",
      body: { classId: id },
    });
    showSuccess({
      title: "報名成功",
      message: "系統已成功將您的資料與此課程關聯。請注意後續開課通知。",
    });
    await refresh();
  } catch (error: any) {
    showError({
      title: "報名失敗",
      message: error.data?.message || "報名失敗，請稍後再試",
    });
  } finally {
    enrolling.value = false;
  }
};

const formattedStartDate = computed(() => {
  if (!course.value?.startDate) return "未定";
  return new Date(course.value.startDate).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});

const formattedEndDate = computed(() => {
  if (!course.value?.endDate) return "未定";
  return new Date(course.value.endDate).toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
});
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300">
    <div v-if="pending" class="flex items-center justify-center min-h-[60vh]">
      <ProgressSpinner />
    </div>

    <div
      v-else-if="error || !course"
      class="max-w-2xl mx-auto py-20 px-6 text-center"
    >
      <i class="pi pi-exclamation-circle text-6xl text-red-500 mb-6" />
      <h1 class="text-3xl font-black text-gray-900 dark:text-white mb-4">
        找不到此課程
      </h1>
      <p class="text-gray-500 dark:text-gray-400 text-lg mb-8">
        課程可能已經截止報名或是連結已失效。
      </p>
      <Button
        label="返回探索課程"
        icon="pi pi-arrow-left"
        link
        @click="navigateTo('/explore')"
      />
    </div>

    <div v-else>
      <!-- Hero Section -->
      <section
        class="bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 py-4 md:py-6"
      >
        <div class="max-w-[1200px] mx-auto px-6">
          <Button
            label="返回探索"
            icon="pi pi-arrow-left"
            link
            class="!p-0 !text-gray-400 dark:!text-gray-500 !font-bold mb-8 hover:!text-blue-600 transition-colors"
            @click="navigateTo('/explore')"
          />
          <div
            class="flex flex-col md:flex-row md:items-end justify-between gap-8"
          >
            <div class="flex-1">
              <span
                class="inline-block text-sm font-black tracking-widest text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/30 px-4 py-1.5 rounded-full uppercase mb-6"
              >
                {{ course.templateCode }}
              </span>
              <h1
                class="text-4xl md:text-6xl font-black text-gray-900 dark:text-white leading-tight mb-4"
              >
                {{ course.templateName }}
              </h1>
              <p class="text-2xl font-bold text-blue-500 dark:text-blue-400">
                {{ course.name }}
              </p>
            </div>
            <div class="md:w-64">
              <div
                class="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700"
              >
                <div class="flex justify-between items-center mb-3">
                  <span
                    class="text-xs text-gray-400 dark:text-gray-500 font-black uppercase"
                    >報名狀況</span
                  >
                  <span class="text-sm font-black text-gray-900 dark:text-white">
                    {{ course.enrollmentCount }} / {{ course.maxCapacity }}
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
                  class="!h-2 !bg-gray-50 dark:!bg-slate-900 !rounded-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Main Content -->
      <main class="max-w-[1200px] mx-auto px-6 py-16 md:py-24">
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <!-- Left: Details -->
          <div class="lg:col-span-2 space-y-16">
            <section>
              <h3
                class="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"
              >
                <span class="w-2 h-8 bg-blue-600 rounded-full" />
                課程介紹
              </h3>
              <div
                class="prose prose-blue dark:prose-invert max-w-none text-xl leading-relaxed text-gray-600 dark:text-gray-300"
              >
                {{ course.description || "暫無課程詳細介紹。" }}
              </div>
            </section>

            <section>
              <h3
                class="text-2xl font-black text-gray-900 dark:text-white mb-8 flex items-center gap-3"
              >
                <span class="w-2 h-8 bg-blue-600 rounded-full" />
                上課資訊
              </h3>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div
                  class="bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800"
                >
                  <div class="flex items-center gap-4 mb-2">
                    <div
                      class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white"
                    >
                      <i class="pi pi-calendar" />
                    </div>
                    <span
                      class="text-sm text-gray-400 dark:text-gray-500 font-black uppercase"
                      >課程週期</span
                    >
                  </div>
                  <p class="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {{ formattedStartDate }} ~ {{ formattedEndDate }}
                  </p>
                </div>

                <div
                  class="bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800"
                >
                  <div class="flex items-center gap-4 mb-2">
                    <div
                      class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white"
                    >
                      <i class="pi pi-clock" />
                    </div>
                    <span
                      class="text-sm text-gray-400 dark:text-gray-500 font-black uppercase"
                      >上課時間</span
                    >
                  </div>
                  <p class="text-lg font-bold text-gray-800 dark:text-gray-200">
                    {{ course.scheduleDescription || "請洽詢開課單位" }}
                  </p>
                </div>

                <div
                  class="bg-gray-50 dark:bg-slate-900 p-6 rounded-3xl border border-gray-100 dark:border-slate-800 md:col-span-2"
                >
                  <div class="flex items-center gap-4 mb-2">
                    <div
                      class="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white"
                    >
                      <i class="pi pi-map-marker" />
                    </div>
                    <span
                      class="text-sm text-gray-400 dark:text-gray-500 font-black uppercase"
                      >授課地點</span
                    >
                  </div>
                  <p
                    class="text-lg font-bold text-gray-800 dark:text-gray-200 uppercase"
                  >
                    {{ course.location || "實體課程 (地點未定/請洽詢)" }}
                  </p>
                </div>
              </div>
            </section>
          </div>

          <!-- Right: Action Sidebar -->
          <div class="lg:sticky lg:top-8 h-fit">
            <div
              class="bg-white dark:bg-slate-900 border-2 border-gray-100 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-gray-200/50 dark:shadow-none"
            >
              <div v-if="isAlreadyEnrolled" class="text-center py-6">
                <div
                  class="w-20 h-20 bg-green-50 dark:bg-green-900/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <i class="pi pi-check text-4xl font-black" />
                </div>
                <h4 class="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  您已完成報名
                </h4>
                <p class="text-gray-500 dark:text-gray-400 mb-8">
                  請留意電子郵件或後續開課通知。
                </p>
                <Button
                  label="返回探索其他課程"
                  icon="pi pi-arrow-left"
                  severity="secondary"
                  class="w-full !rounded-2xl py-4 font-black"
                  @click="navigateTo('/explore')"
                />
              </div>

              <div v-else>
                <h4 class="text-2xl font-black text-gray-900 dark:text-white mb-8">
                  課程報名
                </h4>

                <!-- Prerequisites Card -->
                <div
                  v-if="hasFailedPrereq"
                  class="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 rounded-2xl p-6 mb-8"
                >
                  <div
                    class="flex items-center gap-2 text-amber-700 dark:text-amber-500 font-black mb-4"
                  >
                    <i class="pi pi-exclamation-triangle" />
                    未符合先修條件
                  </div>
                  <ul class="space-y-3">
                    <li
                      v-for="fail in failedPrerequisites"
                      :key="fail"
                      class="flex items-start gap-3 text-amber-600 dark:text-amber-600/80 font-medium"
                    >
                      <i class="pi pi-times-circle mt-1" />
                      <span>{{ fail }}</span>
                    </li>
                  </ul>
                  <div
                    class="mt-6 pt-6 border-t border-amber-100/50 dark:border-amber-800/20 text-sm text-amber-700 dark:text-amber-600 flex items-center gap-2"
                  >
                    <i class="pi pi-info-circle" />
                    若有疑慮請聯繫教會同工
                  </div>
                </div>

                <div v-else class="space-y-6 mb-8">
                  <div
                    class="flex items-center gap-4 text-green-600 dark:text-green-500 bg-green-50 dark:bg-green-900/10 p-4 rounded-2xl"
                  >
                    <i class="pi pi-check-circle text-xl" />
                    <span class="font-black">符合資格，歡迎報名</span>
                  </div>
                </div>

                <Button
                  :label="
                    isFull
                      ? '名額已額滿'
                      : isAlreadyEnrolled
                        ? '已報名'
                        : '立即送出報名'
                  "
                  :disabled="!canEnroll || enrolling"
                  :loading="enrolling"
                  size="large"
                  class="w-full !py-6 !text-xl !rounded-2xl shadow-lg transition-all !font-black transform hover:scale-[1.02] active:scale-[0.98]"
                  :severity="canEnroll ? 'primary' : 'secondary'"
                  @click="handleEnroll"
                />

                <p
                  v-if="!canEnroll && !isFull && !isAlreadyEnrolled"
                  class="text-center text-sm text-gray-400 dark:text-gray-500 mt-6 px-4"
                >
                  很抱歉，您暫時不符合報名此課程的先修條件。
                </p>
                <p
                  v-if="isFull"
                  class="text-center text-sm text-red-400 dark:text-red-500/80 mt-6 px-4 font-bold"
                >
                  本班級非常熱門，目前已額滿，期待下次與您相見！
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-progressbar-value) {
  background: linear-gradient(90deg, var(--p-blue-500), var(--p-blue-600));
}

.prose {
  line-height: 1.8;
  letter-spacing: 0.01em;
}

h1,
h2,
h3,
h4 {
  letter-spacing: -0.04em;
}
</style>
