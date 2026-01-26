<script setup lang="ts">
import { pastoralZones } from "~/data/pastoral-zones.data";

/**
 * 註冊頁面 - 階段二：完成個人資料
 * 支援 320px 最小寬度。
 */

const formData = ref({
  avatar: null as string | null,
  name: "", // 從階段一帶過來
  gender: "MALE",
  birthDate: null,
  maritalStatus: null,
  phone: "", // 從階段一帶過來
  lineId: "",
  email: "", // 從階段一帶過來
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  isBaptized: true,
  baptismDate: null,
  pastoralZone: null,
  homeGroup: null,
  previousCourses: [],
});

const maritalOptions = [
  { label: "單身", value: "SINGLE" },
  { label: "已婚", value: "MARRIED" },
  { label: "其他", value: "OTHER" },
];

const courseOptions = [
  { label: "啟發課程", value: "ALPHA" },
  { label: "幸福小組", value: "HAPPINESS_GROUP" },
  { label: "經歷神營會", value: "ENCOUNTER_GOD" },
  { label: "從懷疑到相信", value: "DOUBT_TO_FAITH" },
  { label: "其他", value: "OTHER" },
];

// 移除 watch，改用 @change 事件處理
const onPastoralZoneChange = () => {
  formData.value.homeGroup = null;
};

// 當前選取牧區的小組清單
const availableGroups = computed(() => {
  if (!formData.value.pastoralZone) return [];
  const zone = pastoralZones.find((z) => z.id === formData.value.pastoralZone);
  return zone ? zone.groups : [];
});

const loading = ref(false);

const handleComplete = async () => {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Profile Completion Data:", formData.value);
  loading.value = false;
  // 完成導向首頁
  navigateTo("/");
};

const skipStep = () => {
  navigateTo("/");
};

const fileUploadRef = ref();

const onFileSelect = (event: any) => {
  const file = event.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    formData.value.avatar = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const triggerFileUpload = () => {
  fileUploadRef.value.choose();
};

definePageMeta({
  layout: "auth",
});
</script>

<template>
  <div
    class="min-h-screen flex items-center justify-center p-0 sm:p-4 bg-slate-50 dark:bg-slate-950 transition-colors duration-300"
  >
    <!-- 行動端全螢幕，桌機卡片樣式 -->
    <div
      class="w-full max-w-[520px] bg-white dark:bg-slate-900 shadow-2xl sm:rounded-[40px] overflow-hidden flex flex-col min-h-screen sm:min-h-[900px]"
    >
      <!-- Header -->
      <header class="pt-10 px-6 sm:px-8 pb-4 text-center shrink-0">
        <!-- Progress Indicator -->
        <div class="flex items-center justify-center gap-2 mb-6">
          <div class="h-1.5 w-12 bg-primary rounded-full opacity-30"></div>
          <div class="h-1.5 w-12 bg-primary rounded-full"></div>
        </div>
        <h1 class="text-2xl font-bold text-slate-800 dark:text-white">
          完成個人資料
        </h1>
        <p
          class="text-slate-500 dark:text-slate-400 mt-1 text-sm leading-relaxed px-4"
        >
          讓我們更了解您，提供個人化的學習體驗
        </p>
      </header>

      <main class="flex-1 p-6 sm:p-8 pt-2 overflow-y-auto">
        <!-- Avatar Upload -->
        <div class="flex flex-col items-center mb-8">
          <FileUpload
            ref="fileUploadRef"
            mode="basic"
            name="avatar"
            accept="image/*"
            customUpload
            auto
            :maxFileSize="1000000"
            class="hidden"
            @select="onFileSelect"
          />
          <div
            class="relative group cursor-pointer hover:scale-105 transition-transform"
            @click="triggerFileUpload"
          >
            <Avatar
              :image="formData.avatar || undefined"
              :icon="formData.avatar ? undefined : 'pi pi-user'"
              class="w-24 h-24 !bg-slate-100 dark:!bg-slate-800 !border-2 !border-slate-50 dark:!border-slate-800 shadow-inner"
              size="xlarge"
              shape="circle"
              :style="
                !formData.avatar ? { fontSize: '3rem', color: '#cbd5e1' } : {}
              "
              :pt="{
                image: { class: 'object-cover w-full h-full rounded-full' },
              }"
            />
            <div
              class="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white border-2 border-white dark:border-slate-900 shadow-md"
            >
              <i class="pi pi-camera text-sm"></i>
            </div>
          </div>
          <span
            class="text-xs font-bold text-slate-400 mt-3 uppercase tracking-widest"
            >上傳大頭貼</span
          >
        </div>

        <form class="space-y-10" @submit.prevent="handleComplete">
          <!-- 基本資料 -->
          <section class="space-y-4">
            <h2
              class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3 mb-6"
            >
              基本資料
            </h2>
            <div class="grid grid-cols-1 gap-5">
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >姓名 <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="formData.name"
                  placeholder="請輸入真實姓名"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >性別</label
                >
                <SelectButton
                  v-model="formData.gender"
                  :options="[
                    { label: '男', value: 'MALE' },
                    { label: '女', value: 'FEMALE' },
                  ]"
                  optionLabel="label"
                  optionValue="value"
                  class="w-full"
                  :pt="{
                    button: ({ context }) => ({
                      class: [
                        'flex-1 py-2.5',
                        context.active
                          ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800',
                      ],
                    }),
                  }"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >出生年月日</label
                >
                <DatePicker
                  v-model="formData.birthDate"
                  placeholder="請選擇生日"
                  fluid
                  class="w-full"
                  input-class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >婚姻狀態</label
                >
                <Select
                  v-model="formData.maritalStatus"
                  :options="maritalOptions"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="請選擇狀態"
                  fluid
                  class="!rounded-xl !py-1 !px-2"
                />
              </div>
            </div>
          </section>

          <!-- 聯絡資訊 -->
          <section class="space-y-4">
            <h2
              class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3 mb-6"
            >
              聯絡資訊
            </h2>
            <div class="grid grid-cols-1 gap-5">
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >手機號碼 <span class="text-red-500">*</span></label
                >
                <InputText
                  v-model="formData.phone"
                  placeholder="0912-345-678"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >Line ID</label
                >
                <InputText
                  v-model="formData.lineId"
                  placeholder="請輸入 Line ID"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >Email</label
                >
                <InputText
                  v-model="formData.email"
                  placeholder="example@email.com"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >通訊地址</label
                >
                <InputText
                  v-model="formData.address"
                  placeholder="請輸入聯絡地址"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
            </div>
          </section>

          <!-- 緊急聯絡人 -->
          <section class="space-y-4">
            <h2
              class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3 mb-6"
            >
              緊急聯絡人
            </h2>
            <div class="grid grid-cols-1 gap-5">
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >聯絡人姓名</label
                >
                <InputText
                  v-model="formData.emergencyContactName"
                  placeholder="聯絡人姓名"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >聯絡人電話</label
                >
                <InputText
                  v-model="formData.emergencyContactPhone"
                  placeholder="聯絡人電話"
                  fluid
                  class="!rounded-xl !py-3 !px-4"
                />
              </div>
            </div>
          </section>

          <!-- 信仰狀態 -->
          <section class="space-y-4">
            <h2
              class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3 mb-6"
            >
              信仰狀態
            </h2>
            <div class="grid grid-cols-1 gap-5">
              <div
                class="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800"
              >
                <span
                  class="text-sm font-bold text-slate-700 dark:text-slate-200"
                  >是否已經受洗？</span
                >
                <ToggleSwitch v-model="formData.isBaptized" />
              </div>

              <div
                v-if="formData.isBaptized"
                class="space-y-1.5 animate-fade-in animate-duration-300"
              >
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >受洗日期</label
                >
                <DatePicker
                  v-model="formData.baptismDate"
                  placeholder="請選擇日期"
                  fluid
                  input-class="!rounded-xl !py-3 !px-4"
                />
              </div>

              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >歸屬牧區</label
                >
                <Select
                  v-model="formData.pastoralZone"
                  :options="pastoralZones"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="請選擇牧區"
                  fluid
                  class="!rounded-xl !py-1 !px-2"
                />
              </div>

              <div class="space-y-1.5">
                <label
                  class="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1"
                  >歸屬小組</label
                >
                <Select
                  v-model="formData.homeGroup"
                  :options="availableGroups"
                  optionLabel="name"
                  optionValue="id"
                  placeholder="請選擇小組"
                  :disabled="!formData.pastoralZone"
                  fluid
                  class="!rounded-xl !py-1 !px-2"
                />
              </div>
            </div>
          </section>

          <!-- 過去經歷 -->
          <section class="space-y-4">
            <h2
              class="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2 border-l-4 border-primary pl-3 mb-6"
            >
              過去經歷
            </h2>
            <div class="space-y-4">
              <p class="text-xs text-slate-400 leading-normal px-1">
                曾經參與過的福音課程 (可複選，僅供參考)
              </p>
              <Listbox
                v-model="formData.previousCourses"
                :options="courseOptions"
                multiple
                optionLabel="label"
                optionValue="value"
                class="w-full"
                :pt="{
                  root: { class: '!border-0 !p-0 !bg-transparent' },
                  listContainer: { class: '!p-0' },
                  list: { class: '!p-0 !gap-2 !flex !flex-col' },
                  option: ({ context }) => ({
                    class: [
                      '!mb-2 !p-3 !rounded-xl !border !transition-all !cursor-pointer !flex !items-center !outline-none',
                      context.selected
                        ? '!bg-primary-50 dark:!bg-primary-900/20 !border-primary !text-primary'
                        : '!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !text-slate-600 dark:!text-slate-300 hover:!border-primary/50 hover:!bg-slate-50 dark:hover:!bg-slate-800',
                    ],
                  }),
                }"
              >
                <template #option="{ option, selected }">
                  <div class="flex items-center gap-2 w-full">
                    <i v-if="selected" class="pi pi-check text-sm"></i>
                    <span :class="{ 'font-bold': selected }">{{
                      option.label
                    }}</span>
                  </div>
                </template>
              </Listbox>
            </div>
          </section>

          <!-- Submit -->
          <footer class="pt-8 pb-4 space-y-4">
            <Button
              label="完成註冊並開始使用"
              type="submit"
              :loading="loading"
              class="!w-full !py-4 !rounded-2xl !text-lg !font-bold !bg-primary !border-none shadow-xl shadow-primary/30"
            />
            <Button
              label="稍後在個人檔案中完成"
              text
              class="!w-full !text-slate-400 !text-sm !font-medium hover:!text-slate-600"
              @click="skipStep"
            />
          </footer>
        </form>
      </main>
    </div>
  </div>
</template>

<style scoped>
:deep(.p-inputtext),
:deep(.p-select) {
  @apply bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-800 transition-all;
}
:deep(.p-inputtext:focus),
:deep(.p-select:focus) {
  @apply border-primary ring-2 ring-primary/20;
}
:deep(.p-datepicker-input) {
  @apply !w-full;
}
</style>
