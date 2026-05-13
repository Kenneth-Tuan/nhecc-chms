<script setup lang="ts">
import LearnHeroBanner from "./_component/LearnHeroBanner.vue";
import type {
  ClassAttachment,
  ClassSession,
  CourseClassStatus,
  CourseTeacher,
} from "~/types/course-class";
import type { CourseEnrollmentStatus } from "~/types/course-enrollment";

type LearnViewerRole = "student" | "teacher";
type LearnStatusTab = "current" | "upcoming" | "history";

interface LearnClass {
  id: string;
  templateId: string;
  templateName: string;
  templateCode: string;
  name: string;
  viewerRole: LearnViewerRole;
  enrollmentStatus: CourseEnrollmentStatus | null;
  status: CourseClassStatus;
  teachers: CourseTeacher[];
  startDate: string;
  endDate: string;
  scheduleDescription?: string;
  sessions: ClassSession[];
  currentSessionId: string | null;
  location: string;
  meetingLink?: string;
  description: string;
  attachments: ClassAttachment[];
  maxCapacity: number;
  enrollmentCount: number;
  createdAt: string;
  updatedAt: string;
}

const { currentUserName } = useAuth();

const { data, pending, error, refresh } = useFetch<{ data: LearnClass[] }>(
  "/api/learn/classes"
);

const selectedTab = ref<LearnStatusTab>("current");

const classes = computed(() => data.value?.data || []);
const currentClasses = computed(() =>
  classes.value.filter((item) => item.status === "IN_PROGRESS")
);
const upcomingClasses = computed(() =>
  classes.value.filter((item) => item.status === "SETUP")
);
const historyClasses = computed(() =>
  classes.value.filter((item) => item.status === "COMPLETED")
);
const teacherClasses = computed(() =>
  classes.value.filter((item) => item.viewerRole === "teacher")
);
const studentClasses = computed(() =>
  classes.value.filter((item) => item.viewerRole === "student")
);
const heroStats = computed(() => [
  { label: "上課中", value: currentClasses.value.length },
  { label: "授課", value: teacherClasses.value.length },
  { label: "紀錄", value: historyClasses.value.length },
]);

const visibleClasses = computed(() => {
  if (selectedTab.value === "upcoming") return upcomingClasses.value;
  if (selectedTab.value === "history") return historyClasses.value;
  return currentClasses.value;
});

const tabs = computed(() => [
  {
    key: "current" as const,
    label: "上課中",
    count: currentClasses.value.length,
  },
  {
    key: "upcoming" as const,
    label: "已報名",
    count: upcomingClasses.value.length,
  },
  {
    key: "history" as const,
    label: "紀錄",
    count: historyClasses.value.length,
  },
]);

const nextClass = computed(() => {
  const candidates = [...currentClasses.value, ...upcomingClasses.value];
  return candidates.sort(
    (a, b) => getNextSessionTimestamp(a) - getNextSessionTimestamp(b)
  )[0];
});

function getNextSessionTimestamp(courseClass: LearnClass) {
  const now = Date.now();
  const sortedSessions = [...courseClass.sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );
  const nextSession = sortedSessions.find(
    (session) => new Date(session.startTime).getTime() >= now
  );

  return new Date(
    nextSession?.startTime || courseClass.startDate || courseClass.createdAt
  ).getTime();
}

function getStatusLabel(status: CourseClassStatus) {
  if (status === "SETUP") return "已報名";
  if (status === "IN_PROGRESS") return "上課中";
  return "已完成";
}

function getEnrollmentLabel(status: CourseEnrollmentStatus | null) {
  if (status === "PENDING_WAITLIST") return "等候中";
  if (status === "ASSIGNED") return "已排班";
  if (status === "IN_PROGRESS") return "修課中";
  if (status === "COMPLETED") return "已結業";
  if (status === "DROPPED") return "已退出";
  return "授課";
}

function getRoleLabel(role: LearnViewerRole) {
  return role === "teacher" ? "授課老師" : "學員";
}

function formatDate(value?: string) {
  if (!value) return "尚未排定";

  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(new Date(value));
}

function formatDateTime(value?: string) {
  if (!value) return "尚未排定";

  return new Intl.DateTimeFormat("zh-TW", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getNextSession(courseClass: LearnClass) {
  const now = Date.now();
  const sortedSessions = [...courseClass.sessions].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  );

  return (
    sortedSessions.find(
      (session) => new Date(session.startTime).getTime() >= now
    ) || sortedSessions[0]
  );
}

function getProgress(courseClass: LearnClass) {
  if (courseClass.status === "COMPLETED") return 100;
  if (!courseClass.sessions.length)
    return courseClass.status === "IN_PROGRESS" ? 5 : 0;

  const now = Date.now();
  const finishedCount = courseClass.sessions.filter(
    (session) => new Date(session.startTime).getTime() <= now
  ).length;

  return Math.min(
    Math.max(
      Math.round((finishedCount / courseClass.sessions.length) * 100),
      0
    ),
    100
  );
}
</script>

<template>
  <main
    class="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-24 md:gap-8 md:pb-10"
  >
    <LearnHeroBanner
      :title="`${currentUserName || '我的'}學習中心`"
      description="查看你報名、上課與授課的班級。之後簽到、作業、教材與課堂互動都會集中在這裡。"
      :stats="heroStats"
    />

    <section
      v-if="nextClass"
      class="rounded-[1.75rem] border border-blue-100 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:p-6"
    >
      <div
        class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
      >
        <div>
          <div class="mb-2 flex items-center gap-2">
            <span
              class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-950 dark:text-blue-300"
            >
              下一堂
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800"
            >
              {{ getRoleLabel(nextClass.viewerRole) }}
            </span>
          </div>
          <h2
            class="text-2xl font-black tracking-tight text-slate-950 dark:text-white"
          >
            {{ nextClass.templateName }}
          </h2>
          <p class="mt-1 font-bold text-slate-400">{{ nextClass.name }}</p>
        </div>

        <NuxtLink
          :to="`/learn/${nextClass.id}`"
          class="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white no-underline transition hover:bg-blue-700"
        >
          進入課程
          <i class="pi pi-arrow-right ml-2" />
        </NuxtLink>
      </div>

      <div
        class="mt-5 grid gap-3 text-sm font-bold text-slate-500 md:grid-cols-3"
      >
        <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <i class="pi pi-calendar mr-2 text-blue-500" />
          {{
            formatDateTime(
              getNextSession(nextClass)?.startTime || nextClass.startDate
            )
          }}
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <i class="pi pi-map-marker mr-2 text-emerald-500" />
          {{ nextClass.location || "尚未設定地點" }}
        </div>
        <div class="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800">
          <i class="pi pi-users mr-2 text-amber-500" />
          {{ nextClass.enrollmentCount }} 位學員
        </div>
      </div>
    </section>

    <nav
      class="sticky top-0 z-20 rounded-2xl bg-slate-100 p-1 dark:bg-slate-900"
    >
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="w-1/3 rounded-xl px-3 py-3 text-sm font-black transition"
        :class="
          selectedTab === tab.key
            ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
            : 'text-slate-500'
        "
        @click="selectedTab = tab.key"
      >
        {{ tab.label }}
        <span class="ml-1 text-xs opacity-70">{{ tab.count }}</span>
      </button>
    </nav>

    <div v-if="pending" class="flex flex-col items-center justify-center py-24">
      <ProgressSpinner />
      <p class="mt-5 text-lg font-black text-slate-400">正在載入學習資料...</p>
    </div>

    <div
      v-else-if="error"
      class="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500" />
      <h2 class="mt-4 text-2xl font-black">載入失敗</h2>
      <p class="mt-2 font-semibold text-slate-500">請稍後再試一次。</p>
      <Button label="重新載入" class="mt-6" @click="refresh()" />
    </div>

    <div
      v-else-if="visibleClasses.length === 0"
      class="rounded-[2rem] border-2 border-dashed border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900"
    >
      <i class="pi pi-book text-5xl text-slate-300" />
      <h2 class="mt-5 text-2xl font-black">這裡目前沒有課程</h2>
      <p class="mx-auto mt-2 max-w-sm font-semibold text-slate-400">
        {{
          studentClasses.length === 0
            ? "可以先到探索頁面找適合的課程。"
            : "切換其他分類看看你的課程。"
        }}
      </p>
      <NuxtLink
        v-if="studentClasses.length === 0"
        to="/explore"
        class="mt-6 inline-block"
      >
        <Button label="探索課程" icon="pi pi-compass" />
      </NuxtLink>
    </div>

    <section v-else class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      <NuxtLink
        v-for="courseClass in visibleClasses"
        :key="courseClass.id"
        :to="`/learn/${courseClass.id}`"
        class="group block no-underline"
      >
        <article
          class="flex h-full flex-col rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          <div class="mb-5 flex items-start justify-between gap-3">
            <div>
              <p
                class="text-xs font-black tracking-[0.2em] text-blue-600 dark:text-blue-400"
              >
                {{ courseClass.templateCode }}
              </p>
              <h3
                class="mt-2 line-clamp-2 text-2xl font-black leading-tight text-slate-950 dark:text-white"
              >
                {{ courseClass.templateName }}
              </h3>
              <p class="mt-2 font-bold text-slate-400">
                {{ courseClass.name }}
              </p>
            </div>

            <Badge
              :value="getRoleLabel(courseClass.viewerRole)"
              :severity="
                courseClass.viewerRole === 'teacher' ? 'info' : 'success'
              "
              class="shrink-0"
            />
          </div>

          <div class="mb-5 flex flex-wrap gap-2">
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800"
            >
              {{ getStatusLabel(courseClass.status) }}
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-slate-800"
            >
              {{ getEnrollmentLabel(courseClass.enrollmentStatus) }}
            </span>
          </div>

          <div class="mt-auto space-y-3">
            <div
              class="flex items-center gap-3 text-sm font-bold text-slate-500"
            >
              <i class="pi pi-calendar text-blue-500" />
              <span
                >{{ formatDate(courseClass.startDate) }} -
                {{ formatDate(courseClass.endDate) }}</span
              >
            </div>

            <div
              class="flex items-center gap-3 text-sm font-bold text-slate-500"
            >
              <i class="pi pi-map-marker text-emerald-500" />
              <span>{{ courseClass.location || "尚未設定地點" }}</span>
            </div>

            <div class="pt-4">
              <div
                class="mb-2 flex items-center justify-between text-xs font-black text-slate-400"
              >
                <span>課程進度</span>
                <span>{{ getProgress(courseClass) }}%</span>
              </div>
              <ProgressBar
                :value="getProgress(courseClass)"
                :show-value="false"
                class="!h-2 !rounded-full"
              />
            </div>
          </div>
        </article>
      </NuxtLink>
    </section>
  </main>
</template>

<style scoped>
:deep(.p-progressbar-value) {
  background: linear-gradient(90deg, #2563eb, #10b981);
}
</style>
