<script setup lang="ts">
/**
 * 班級資料表單組件
 * 用於「建立班級」與「編輯班級」
 */
import dayjs from "dayjs";
import { useCourseClass } from "~/composables/useCourseClass";
import { courseClassSchema } from "~/schemas/course-class.schema";

const props = defineProps<{
  initialData?: any;
  submitLabel?: string;
  isSubmitting?: boolean;
}>();

const emit = defineEmits<{
  (e: "submit", payload: any): void;
  (e: "cancel"): void;
}>();

const { fetchTeachers } = useCourseClass();
const toast = useToast();

const teachers = ref<{ id: string; name: string }[]>([]);

// 產生器暫存狀態
const genWeekday = ref(1); // 預設週一
const genTimeRange = ref<[Date, Date]>([
  dayjs().set("hour", 19).set("minute", 0).toDate(),
  dayjs().set("hour", 21).set("minute", 0).toDate(),
]);

const weekdays = [
  { label: "每週日", value: 0 },
  { label: "每週一", value: 1 },
  { label: "每週二", value: 2 },
  { label: "每週三", value: 3 },
  { label: "每週四", value: 4 },
  { label: "每週五", value: 5 },
  { label: "每週六", value: 6 },
];

const form = ref({
  name: "",
  teachers: [] as { id: string; name: string }[],
  startDate: null as Date | null,
  endDate: null as Date | null,
  location: "",
  meetingLink: "",
  scheduleDescription: "",
  maxCapacity: 30,
  isPublished: true,
  description: "",
  sessions: [] as any[],
});

// 初始化資料
onMounted(async () => {
  teachers.value = await fetchTeachers();
  
  if (props.initialData) {
    const d = props.initialData;
    form.value = {
      name: d.name || "",
      teachers: d.teachers || [],
      startDate: d.startDate ? new Date(d.startDate) : null,
      endDate: d.endDate ? new Date(d.endDate) : null,
      location: d.location || "",
      meetingLink: d.meetingLink || "",
      scheduleDescription: d.scheduleDescription || "",
      maxCapacity: d.maxCapacity || 30,
      isPublished: d.isPublished ?? true,
      description: d.description || "",
      sessions: d.sessions || [],
    };
  }
});

function generateSessions() {
  if (!form.value.startDate || !form.value.endDate) {
    toast.add({ severity: "warn", summary: "無法產生", detail: "請先設定開課與結課日期", life: 3000 });
    return;
  }

  const start = dayjs(form.value.startDate);
  const end = dayjs(form.value.endDate);
  const newSessions: any[] = [];
  
  const startTime = dayjs(genTimeRange.value[0]);
  const endTime = dayjs(genTimeRange.value[1]);

  let current = start;
  // 尋找第一個符合星期的日子
  while (current.day() !== genWeekday.value && (current.isBefore(end) || current.isSame(end, "day"))) {
    current = current.add(1, "day");
  }

  while (current.isBefore(end) || current.isSame(end, "day")) {
    const sessionStart = current
      .set("hour", startTime.hour())
      .set("minute", startTime.minute())
      .set("second", 0);
    
    const sessionEnd = current
      .set("hour", endTime.hour())
      .set("minute", endTime.minute())
      .set("second", 0);

    newSessions.push({
      sessionId: crypto.randomUUID(),
      startTime: sessionStart.toISOString(),
      endTime: sessionEnd.toISOString(),
    });
    
    current = current.add(1, "week");
  }

  form.value.sessions = newSessions;
  
  // 自動更新描述
  const weekdayLabel = weekdays.find(w => w.value === genWeekday.value)?.label || "";
  const timeStr = `${dayjs(startTime).format("HH:mm")} - ${dayjs(endTime).format("HH:mm")}`;
  form.value.scheduleDescription = `${weekdayLabel} ${timeStr}`;

  toast.add({ severity: "success", summary: "產生成功", detail: `已產生 ${newSessions.length} 堂課`, life: 3000 });
}

function removeSession(index: number) {
  form.value.sessions.splice(index, 1);
}

async function onFormSubmit() {
  const formatDate = (date: Date | null) => {
    if (!date) return "";
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  };

  const payload = {
    ...form.value,
    startDate: formatDate(form.value.startDate),
    endDate: formatDate(form.value.endDate),
  };

  // 驗證 (Partial 驗證，因為編輯時可能只傳部分)
  const result = courseClassSchema.partial().safeParse(payload);
  if (!result.success) {
    toast.add({
      severity: "warn",
      summary: "驗證失敗",
      detail: result.error.issues[0]?.message || "輸入資料有誤",
      life: 4000,
    });
    return;
  }

  emit("submit", payload);
}
</script>

<template>
  <form class="space-y-8" @submit.prevent="onFormSubmit">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- 班級名稱 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 text-base">正式班級名稱 *</label>
        <InputText
          v-model="form.name"
          placeholder="例：啟發課程 2026 第一期"
          class="text-base"
          fluid
        />
      </div>

      <!-- 授課老師 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 text-base"
          >指派授課老師 / 同伴者 *</label
        >
        <MultiSelect
          v-model="form.teachers"
          :options="teachers"
          option-label="name"
          placeholder="選擇老師"
          display="chip"
          class="text-base"
          fluid
        />
      </div>

      <!-- 日期範圍 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">預計開課日期 *</label>
        <DatePicker
          v-model="form.startDate"
          date-format="yy-mm-dd"
          show-icon
          class="text-base"
          fluid
        />
      </div>
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">預計結課日期 *</label>
        <DatePicker
          v-model="form.endDate"
          date-format="yy-mm-dd"
          show-icon
          class="text-base"
          fluid
        />
      </div>

      <!-- 地點 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">上課地點 *</label>
        <InputText
          v-model="form.location"
          placeholder="例：三樓副堂 / 線上 Zoom"
          class="text-base"
          fluid
        />
      </div>

      <!-- 線上連結 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">線上會議連結</label>
        <InputText
          v-model="form.meetingLink"
          placeholder="例：https://zoom.us/j/..."
          class="text-base"
          fluid
        />
      </div>

      <!-- 上課時間描述 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 text-base">上課時間描述</label>
        <div class="flex gap-2">
          <InputText
            v-model="form.scheduleDescription"
            placeholder="例：每週一 19:00 - 21:00"
            class="grow text-base"
          />
        </div>
        <p class="text-sm text-slate-400">
          手動填寫或使用下方的「課程時間產生器」自動生成。
        </p>
      </div>

      <!-- 課程時間產生器 -->
      <div
        class="bg-blue-50/50 p-6 rounded-2xl md:col-span-2 border border-blue-100/50 space-y-4"
      >
        <h4 class="font-bold text-blue-900 flex items-center gap-2">
          <i class="pi pi-calendar-plus" /> 課程時間產生器 (自動產生機器課表)
        </h4>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="flex flex-col gap-2">
            <label class="text-sm text-slate-500">選擇星期</label>
            <Select
              v-model="genWeekday"
              :options="weekdays"
              option-label="label"
              option-value="value"
              class="w-full"
            />
          </div>
          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-sm text-slate-500">設定時段 (開始 - 結束)</label>
            <DatePicker
              v-model="genTimeRange"
              selection-mode="range"
              time-only
              hour-format="24"
              fluid
            />
          </div>
        </div>
        <div class="flex justify-end pt-2">
          <Button
            label="依日期範圍產生課程表"
            icon="pi pi-sync"
            severity="info"
            text
            size="small"
            @click="generateSessions"
          />
        </div>

        <!-- 課程清單預覽 -->
        <div v-if="form.sessions.length > 0" class="mt-4 border-t pt-4">
          <label class="text-sm font-bold text-slate-600 block mb-2"
            >預覽課程清單 ({{ form.sessions.length }} 堂)</label
          >
          <div class="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2">
            <div
              v-for="(s, i) in form.sessions"
              :key="s.sessionId"
              class="bg-white border rounded px-3 py-1 text-sm flex items-center gap-2"
            >
              <span class="text-slate-600">
                {{ dayjs(s.startTime).format("MM/DD (dd)") }}
              </span>
              <span class="text-slate-400">
                {{ dayjs(s.startTime).format("HH:mm") }}
              </span>
              <Button
                icon="pi pi-times"
                text
                rounded
                size="small"
                severity="danger"
                class="w-6 h-6 p-0"
                @click="removeSession(i)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 人數上限 -->
      <div class="flex flex-col gap-2">
        <label class="font-bold text-slate-700 text-base">人數上限 *</label>
        <InputNumber
          v-model="form.maxCapacity"
          :min="1"
          class="text-base"
          fluid
        />
      </div>

      <!-- 班級簡介 -->
      <div class="flex flex-col gap-2 md:col-span-2">
        <label class="font-bold text-slate-700 text-base">班級簡介</label>
        <Textarea
          v-model="form.description"
          rows="3"
          placeholder="請輸入關於此班級的簡短介紹..."
          class="text-base"
          fluid
        />
      </div>

      <!-- 公開狀態 -->
      <div
        class="flex items-center gap-4 p-6 bg-slate-50 rounded-2xl md:col-span-2 border border-slate-100"
      >
        <ToggleSwitch v-model="form.isPublished" />
        <div>
          <p class="font-bold text-slate-800 text-lg">同步發佈至前台</p>
          <p class="text-base text-slate-500 font-normal mt-1">
            開啟後，學員可以在會友端看到此班級並進行報名。
          </p>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-4 pt-8 border-t">
      <Button
        v-if="!initialData"
        label="上一步"
        severity="secondary"
        text
        class="text-base px-6"
        @click="emit('cancel')"
      />
      <Button
        type="submit"
        :label="submitLabel || '確認提交'"
        icon="pi pi-check"
        :loading="isSubmitting"
        class="px-10 py-3 shadow-xl shadow-blue-100 text-base font-bold"
      />
    </div>
  </form>
</template>
