<script setup lang="ts">
import { pastoralZones } from "~/data/pastoral-zones.data";
import SchemaForm from "@/components/common/SchemaForm.vue";
import FirstStepPanel from "./_components/firstStepPanel.vue";
import SecondStepPanel from "./_components/secondStepPanel.vue";

/**
 * 註冊頁面 - 整合版
 * 使用 Stepper 分步進行：建立帳號 -> 完成個人資料
 */

const activeStep = ref(1); // Use number for easier comparison
const loading = ref(false);

// 整合後的表單數據
const formData = ref({
  // Step 1: Account
  fullName: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",

  // Step 2: Profile
  avatar: null as string | null,
  gender: "MALE",
  birthDate: null,
  maritalStatus: null,
  lineId: "",
  address: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  isBaptized: true,
  baptismDate: null,
  pastoralZone: null,
  homeGroup: null,
  previousCourses: [],
});

// --- Step 1 Configuration ---
const formFields = [
  {
    name: "fullName",
    label: "真實姓名",
    icon: "pi pi-user",
    placeholder: "請輸入姓名",
    required: true,
  },
  {
    name: "phone",
    label: "手機號碼",
    icon: "pi pi-phone",
    placeholder: "0912-345-678",
    required: true,
    type: "tel",
  },
  {
    name: "email",
    label: "電子信箱",
    icon: "pi pi-envelope",
    placeholder: "example@email.com",
    required: true,
    type: "email",
  },
  {
    name: "password-hint",
    type: "slot",
    slotName: "password-hint",
  },
  {
    name: "password",
    label: "設定密碼",
    icon: "pi pi-lock",
    placeholder: "請輸入密碼",
    required: true,
    component: "Password",
  },
  {
    name: "confirmPassword",
    label: "確認密碼",
    icon: "pi pi-lock",
    placeholder: "請再次輸入密碼",
    required: true,
    component: "Password",
  },
];

// --- Step 2 Configuration ---
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

const availableGroups = computed(() => {
  if (!formData.value.pastoralZone) return [];
  const zone = pastoralZones.find((z) => z.id === formData.value.pastoralZone);
  return zone ? zone.groups : [];
});

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

// --- Logic ---

// Step 1 Submit -> Validate & Next
const handleNextStep = async (nextCallback: () => void) => {
  if (formData.value.password !== formData.value.confirmPassword) {
    console.warn("密碼與確認密碼不符");
    return;
  }

  loading.value = true;
  // Simulate API check
  await new Promise((resolve) => setTimeout(resolve, 500));
  loading.value = false;

  // Navigate to Step 2
  // We can manually set activeStep or use the callback if provided by Stepper
  activeStep.value = 2;
};

// Step 2 Submit -> Complete
const handleComplete = async () => {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 1000));
  console.log("Registration Complete:", formData.value);
  loading.value = false;
  navigateTo("/");
};

const handleSkip = () => {
  navigateTo("/");
};

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <div
    :class="[
      'flex flex-col',
      'overflow-hidden',
      'w-full max-w-[520px]',
      'min-h-screen sm:min-h-[850px]',
      'bg-white dark:bg-slate-900',
      'sm:rounded-[40px]',
      'shadow-2xl',
    ]"
  >
    <Stepper v-model:value="activeStep" class="flex flex-col h-full">
      <!-- Header / Stepper List -->
      <header :class="['shrink-0 text-center', 'pt-10 px-6 sm:px-8 pb-4']">
        <StepList
          class="!flex !justify-center !gap-2 !mb-6 !bg-transparent !p-0 !border-0 !shadow-none"
        >
          <Step v-slot="{ activateCallback, value }" asChild :value="1">
            <div @click="activateCallback" class="cursor-pointer">
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  value <= activeStep
                    ? 'bg-primary'
                    : 'bg-slate-200 dark:bg-slate-800',
                ]"
              ></div>
            </div>
          </Step>

          <Step v-slot="{ activateCallback, value }" asChild :value="2">
            <div
              @click="
                (payload) =>
                  value <= activeStep ? activateCallback(payload) : null
              "
              :class="[
                value <= activeStep ? 'cursor-pointer' : 'cursor-default',
              ]"
            >
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  value <= activeStep
                    ? 'bg-primary'
                    : 'bg-slate-200 dark:bg-slate-800',
                ]"
              ></div>
            </div>
          </Step>
        </StepList>

        <h1 :class="['text-2xl font-bold', 'text-slate-800 dark:text-white']">
          {{ activeStep === 1 ? "建立新帳號" : "完成個人資料" }}
        </h1>
        <p :class="['text-sm mt-1 px-4', 'text-slate-500 dark:text-slate-400']">
          {{
            activeStep === 1
              ? "請輸入您的基本資訊以開始使用教會學習平台"
              : "讓我們更了解您，提供個人化的學習體驗"
          }}
        </p>
      </header>

      <StepPanels>
        <StepPanel v-slot="{ activateCallback }" :value="1">
          <FirstStepPanel :activateCallback="activateCallback" />
        </StepPanel>
        <StepPanel v-slot="{ activateCallback }" :value="2">
          <SecondStepPanel :activateCallback="activateCallback" />
        </StepPanel>
      </StepPanels>

      <StepPanels>
        <StepPanel
          v-slot="{ activateCallback }"
          :value="1"
          class="!flex-1 !flex !flex-col !p-6 sm:!p-8 !pt-2"
        >
          <SchemaForm
            v-model="formData"
            :fields="formFields"
            :loading="loading"
            submit-label="下一步 (Next)"
            :show-submit="false"
            @submit="handleNextStep(activateCallback)"
            class="flex-1 flex flex-col"
          >
            <template #footer>
              <div class="mt-auto pt-6">
                <Button
                  label="下一步 (Next)"
                  type="submit"
                  :loading="loading"
                  :class="[
                    'font-bold !text-lg',
                    '!w-full !rounded-xl',
                    'shadow-md shadow-blue-300',
                  ]"
                />
                <p
                  class="text-[11px] leading-normal text-center mt-4 px-4 text-slate-400"
                >
                  點擊下一步即代表您同意本平台的
                  <NuxtLink to="#" class="underline hover:text-slate-600"
                    >服務條款</NuxtLink
                  >
                  與
                  <NuxtLink to="#" class="underline hover:text-slate-600"
                    >隱私政策</NuxtLink
                  >
                </p>
              </div>
            </template>
          </SchemaForm>

          <div
            class="pt-8 mt-4 text-center border-t border-slate-50 dark:border-slate-800/50"
          >
            <p class="text-sm text-slate-500 dark:text-slate-400">
              已經有帳號了嗎？
              <NuxtLink
                to="/login"
                class="font-bold text-primary hover:underline"
                >立即登入</NuxtLink
              >
            </p>
          </div>
        </StepPanel>

        <!-- STEP 2 PANEL -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="2"
          class="!flex-1 !flex !flex-col !p-6 sm:!p-8 !pt-2 !overflow-y-auto"
        >
          <!-- Avatar Upload -->
          <div class="flex flex-col items-center mb-8 shrink-0">
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
              class="relative cursor-pointer transition-transform hover:scale-105"
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
                class="absolute bottom-0 right-0 flex items-center justify-center w-8 h-8 bg-primary text-white shadow-md border-2 border-white dark:border-slate-900 rounded-full"
              >
                <i class="pi pi-camera text-sm"></i>
              </div>
            </div>
            <span
              class="text-xs font-bold uppercase tracking-widest mt-3 text-slate-400"
              >上傳大頭貼</span
            >
          </div>

          <form class="space-y-10" @submit.prevent="handleComplete">
            <!-- 基本資料 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                基本資料
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <div class="space-y-1.5">
                  <label
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
                    >姓名 <span class="text-red-500">*</span></label
                  >
                  <InputText
                    v-model="formData.fullName"
                    placeholder="請輸入真實姓名"
                    fluid
                    class="!rounded-xl !py-3 !px-4"
                  />
                </div>
                <div class="space-y-1.5">
                  <label
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                聯絡資訊
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <div class="space-y-1.5">
                  <label
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
                    >通訊地址</label
                  >
                  <InputText
                    v-model="formData.address"
                    placeholder="請輸入通訊地址"
                    fluid
                    class="!rounded-xl !py-3 !px-4"
                  />
                </div>
              </div>
            </section>

            <!-- 緊急聯絡人 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                緊急聯絡人
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <div class="space-y-1.5">
                  <label
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
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
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                過去經歷
              </h2>
              <div class="space-y-4">
                <p class="text-xs leading-normal px-1 text-slate-400">
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
                    root: { class: ['!border-0 !p-0 !bg-transparent'] },
                    listContainer: { class: '!p-0' },
                    list: { class: ['flex flex-col gap-2', '!p-0'] },
                    option: ({ context }) => ({
                      class: [
                        'flex items-center outline-none cursor-pointer border transition-all mb-2 p-3 rounded-xl',
                        context.selected
                          ? '!bg-primary-50 dark:!bg-primary-900/20 !border-primary !text-primary font-bold'
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
                class="!py-4 !w-full !font-bold !text-lg shadow-blue-300 shadow-md !rounded-xl"
              />
              <Button
                label="稍後在個人檔案中完成"
                variant="text"
                raised
                class="!text-sm !font-medium !w-full !text-slate-400 hover:!text-slate-600"
                @click="handleSkip"
              />
            </footer>
          </form>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
