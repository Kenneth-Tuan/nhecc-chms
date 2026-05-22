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

interface LearnClassDetail {
  id: string;
  templateId: string;
  templateName: string;
  templateCode: string;
  templateSyllabus: string;
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

const route = useRoute();
const classId = computed(() => route.params.classId as string);

const { data, pending, error, refresh } = useFetch<{ data: LearnClassDetail }>(
  () => `/api/learn/classes/${classId.value}`
);

const courseClass = computed(() => data.value?.data);
const isTeacher = computed(() => courseClass.value?.viewerRole === "teacher");
const heroStats = computed(() => {
  const target = courseClass.value;
  if (!target) return [];

  return [
    {
      label: `${formatDate(target.startDate)} - ${formatDate(target.endDate)}`,
      icon: "pi pi-calendar",
      iconClass: "text-blue-500 dark:text-blue-300",
    },
    {
      label: target.location || "尚未設定地點",
      icon: "pi pi-map-marker",
      iconClass: "text-emerald-500 dark:text-emerald-300",
    },
    {
      label: `${target.enrollmentCount} / ${target.maxCapacity} 位學員`,
      icon: "pi pi-users",
      iconClass: "text-amber-500 dark:text-amber-300",
    },
  ];
});

const sortedSessions = computed(() =>
  [...(courseClass.value?.sessions || [])].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )
);

const currentOrNextSession = computed(() => {
  const now = Date.now();
  return (
    sortedSessions.value.find(
      (session) => new Date(session.endTime).getTime() >= now
    ) || sortedSessions.value[0]
  );
});

const progress = computed(() => {
  const target = courseClass.value;
  if (!target) return 0;
  if (target.status === "COMPLETED") return 100;
  if (!target.sessions.length) return target.status === "IN_PROGRESS" ? 5 : 0;

  const now = Date.now();
  const finishedCount = target.sessions.filter(
    (session) => new Date(session.startTime).getTime() <= now
  ).length;

  return Math.min(
    Math.max(Math.round((finishedCount / target.sessions.length) * 100), 0),
    100
  );
});

const actionCards = computed(() => {
  if (isTeacher.value) {
    return [
      {
        title: "課堂簽到",
        description: "開啟 QR Code、查看出席狀態",
        icon: "pi pi-qrcode",
        tone: "blue",
        disabled: true,
      },
      {
        title: "批改作業",
        description: "查看學員繳交狀態與回饋",
        icon: "pi pi-pencil",
        tone: "emerald",
        disabled: true,
      },
      {
        title: "學員名單",
        description: "快速掌握本班學員與進度",
        icon: "pi pi-users",
        tone: "amber",
        disabled: true,
      },
    ];
  }

  return [
    {
      title: "我要簽到",
      description: "課堂開始後可進行簽到",
      icon: "pi pi-check-circle",
      tone: "blue",
      disabled: true,
    },
    {
      title: "繳交作業",
      description: "上傳作業與查看老師回饋",
      icon: "pi pi-upload",
      tone: "emerald",
      disabled: true,
    },
    {
      title: "課堂教材",
      description: "查看講義、連結與課後資源",
      icon: "pi pi-folder-open",
      tone: "amber",
        disabled: true,
    },
  ];
});

function formatDate(value?: string) {
  if (!value) return "尚未排定";

  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
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

function getStatusLabel(status?: CourseClassStatus) {
  if (status === "SETUP") return "已報名";
  if (status === "IN_PROGRESS") return "上課中";
  if (status === "COMPLETED") return "已完成";
  return "未知狀態";
}

function getEnrollmentLabel(status: CourseEnrollmentStatus | null | undefined) {
  if (status === "PENDING_WAITLIST") return "等候中";
  if (status === "ASSIGNED") return "已排班";
  if (status === "IN_PROGRESS") return "修課中";
  if (status === "COMPLETED") return "已結業";
  if (status === "DROPPED") return "已退出";
  return "授課老師";
}

function getAttachmentIcon(type: ClassAttachment["type"]) {
  if (type === "PDF") return "pi pi-file-pdf";
  if (type === "DOCUMENT") return "pi pi-file-word";
  if (type === "IMAGE") return "pi pi-image";
  if (type === "RECORDING") return "pi pi-video";
  return "pi pi-link";
}

function getActionToneClass(tone: string) {
  if (tone === "emerald") {
    return "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300";
  }
  if (tone === "amber") {
    return "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300";
  }

  return "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300";
}
</script>

<template>
  <main class="mx-auto flex w-full max-w-[1180px] flex-col gap-5 pb-24 md:gap-8 md:pb-10">
    <NuxtLink
      to="/learn"
      class="inline-flex w-fit items-center gap-2 text-sm font-black text-slate-500 no-underline transition hover:text-blue-600"
    >
      <i class="pi pi-arrow-left" />
      返回學習中心
    </NuxtLink>

    <div v-if="pending" class="flex flex-col items-center justify-center py-24">
      <ProgressSpinner />
      <p class="mt-5 text-lg font-black text-slate-400">正在載入課程...</p>
    </div>

    <div
      v-else-if="error || !courseClass"
      class="rounded-[2rem] border border-red-100 bg-red-50 p-8 text-center dark:border-red-900/50 dark:bg-red-950/30"
    >
      <i class="pi pi-exclamation-circle text-4xl text-red-500" />
      <h1 class="mt-4 text-2xl font-black">無法載入課程</h1>
      <p class="mt-2 font-semibold text-slate-500">你可能沒有權限，或課程不存在。</p>
      <Button label="重新載入" class="mt-6" @click="refresh()" />
    </div>

    <template v-else>
      <LearnHeroBanner
        :title="courseClass.templateName"
        :subtitle="courseClass.name"
        :stats="heroStats"
        stats-layout="info"
      >
        <template #eyebrow>
          <div class="mb-5 flex flex-wrap gap-2">
            <span
              class="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-blue-600 dark:bg-blue-500/20 dark:text-blue-100"
            >
              {{ courseClass.templateCode }}
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-white/10 dark:text-surface-100"
            >
              {{ isTeacher ? "授課老師" : getEnrollmentLabel(courseClass.enrollmentStatus) }}
            </span>
            <span
              class="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-500 dark:bg-white/10 dark:text-surface-100"
            >
              {{ getStatusLabel(courseClass.status) }}
            </span>
          </div>
        </template>
      </LearnHeroBanner>

      <section class="grid gap-4 md:grid-cols-3">
        <button
          v-for="action in actionCards"
          :key="action.title"
          type="button"
          :disabled="action.disabled"
          class="rounded-[1.5rem] border border-slate-100 bg-white p-5 text-left shadow-sm transition dark:border-surface-700 dark:bg-surface-900"
          :class="
            action.disabled
              ? 'cursor-not-allowed opacity-60'
              : 'hover:-translate-y-1 hover:shadow-xl'
          "
        >
          <div
            class="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
            :class="getActionToneClass(action.tone)"
          >
            <i :class="[action.icon, 'text-xl']" />
          </div>
          <div class="flex items-start justify-between gap-3">
            <div>
              <h2 class="text-xl font-black text-slate-950 dark:text-white">
                {{ action.title }}
              </h2>
              <p class="mt-1 text-sm font-bold leading-relaxed text-slate-400">
                {{ action.description }}
              </p>
            </div>
            <span
              v-if="action.disabled"
              class="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-black text-slate-400 dark:bg-surface-800"
            >
              即將開放
            </span>
          </div>
        </button>
      </section>

      <section class="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <article class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
          <div class="mb-5 flex items-center justify-between">
            <div>
              <p class="text-sm font-black text-blue-600 dark:text-blue-400">
                COURSE PROGRESS
              </p>
              <h2 class="mt-1 text-2xl font-black">課程進度</h2>
            </div>
            <span class="text-3xl font-black text-slate-950 dark:text-white">
              {{ progress }}%
            </span>
          </div>

          <ProgressBar :value="progress" :show-value="false" class="!h-3 !rounded-full" />

          <div class="mt-6 rounded-2xl bg-slate-50 p-4 dark:bg-surface-800">
            <p class="text-sm font-black text-slate-400">目前/下一堂</p>
            <p class="mt-2 text-lg font-black text-slate-950 dark:text-white">
              {{ formatDateTime(currentOrNextSession?.startTime || courseClass.startDate) }}
            </p>
            <p class="mt-1 text-sm font-bold text-slate-500">
              {{ courseClass.scheduleDescription || "尚未提供上課週期描述" }}
            </p>
          </div>
        </article>

        <article class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
          <p class="text-sm font-black text-blue-600 dark:text-blue-400">
            TEACHERS
          </p>
          <h2 class="mt-1 text-2xl font-black">授課同工</h2>

          <div class="mt-5 space-y-3">
            <div
              v-for="teacher in courseClass.teachers"
              :key="teacher.id"
              class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-surface-800"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                {{ teacher.name.slice(0, 1) }}
              </div>
              <p class="font-black text-slate-950 dark:text-white">{{ teacher.name }}</p>
            </div>
            <p v-if="courseClass.teachers.length === 0" class="font-bold text-slate-400">
              尚未指派授課老師
            </p>
          </div>
        </article>
      </section>

      <section class="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <article class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
          <p class="text-sm font-black text-blue-600 dark:text-blue-400">
            MATERIALS
          </p>
          <h2 class="mt-1 text-2xl font-black">教材資源</h2>

          <div class="mt-5 space-y-3">
            <a
              v-for="attachment in courseClass.attachments"
              :key="attachment.url"
              :href="attachment.url"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-slate-600 no-underline transition hover:bg-blue-50 hover:text-blue-600 dark:bg-surface-800 dark:text-surface-200 dark:hover:bg-blue-950/40"
            >
              <i :class="[getAttachmentIcon(attachment.type), 'text-xl']" />
              <div class="min-w-0">
                <p class="truncate font-black">{{ attachment.name }}</p>
                <p class="text-xs font-bold opacity-60">{{ attachment.source === "template" ? "課程教材" : "班級資源" }}</p>
              </div>
            </a>
            <p v-if="courseClass.attachments.length === 0" class="font-bold text-slate-400">
              目前尚無教材
            </p>
          </div>
        </article>

        <article class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
          <p class="text-sm font-black text-blue-600 dark:text-blue-400">
            SCHEDULE
          </p>
          <h2 class="mt-1 text-2xl font-black">課程表</h2>

          <div class="mt-5 space-y-3">
            <div
              v-for="(session, index) in sortedSessions"
              :key="session.sessionId"
              class="flex gap-4 rounded-2xl bg-slate-50 p-4 dark:bg-surface-800"
            >
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-blue-600 shadow-sm dark:bg-surface-900">
                {{ index + 1 }}
              </div>
              <div>
                <p class="font-black text-slate-950 dark:text-white">
                  {{ formatDateTime(session.startTime) }}
                </p>
                <p class="mt-1 text-sm font-bold text-slate-400">
                  結束：{{ formatDateTime(session.endTime) }}
                </p>
              </div>
            </div>
            <p v-if="sortedSessions.length === 0" class="font-bold text-slate-400">
              尚未建立課程表
            </p>
          </div>
        </article>
      </section>

      <section class="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm dark:border-surface-700 dark:bg-surface-900 md:p-6">
        <p class="text-sm font-black text-blue-600 dark:text-blue-400">
          ABOUT
        </p>
        <h2 class="mt-1 text-2xl font-black">課程說明</h2>
        <p class="mt-4 whitespace-pre-line text-base font-semibold leading-8 text-slate-600 dark:text-surface-200">
          {{ courseClass.description || courseClass.templateSyllabus || "尚未提供課程說明" }}
        </p>
      </section>
    </template>
  </main>
</template>

<style scoped>
:deep(.p-progressbar-value) {
  background: linear-gradient(90deg, #2563eb, #10b981);
}
</style>
