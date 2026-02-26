<script setup lang="ts">
import { zodResolver } from "@primevue/forms/resolvers/zod";

import {
  getStep1Schema,
  step2Schema,
  type RegisterFormValues,
} from "~/utils/user/formDef";
import { pastoralZones } from "~/data/pastoral-zones.data";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "~/stores/auth.store";
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";

const route = useRoute();
const firebaseAuth = useFirebaseAuth();
const authStore = useAuthStore();
const toast = useToast();

const activeStep = ref(1);
const loading = ref(false);

const isGoogle = computed(() => route.query.social === "google");
const isLine = computed(
  () =>
    route.query.social === "line" ||
    !!firebaseAuth.pendingLineProfile.value ||
    (!!route.query.code && !!route.query.liffClientId),
);
const isSocialRegister = computed(() => isGoogle.value || isLine.value);
const socialUid = ref(route.query.uid as string | undefined);

const currentStep1Schema = computed(() =>
  getStep1Schema(isSocialRegister.value),
);

const formData = ref<Partial<RegisterFormValues>>({
  fullName: (route.query.fullName as string) || "",
  email: (route.query.email as string) || "",
  phone: "",
  lineId: "",
  gender: "MALE",
  isBaptized: false,
  baptismDate: new Date(),
  pastoralZone: "",
  homeGroup: "",
  previousCourses: [],
});

const socialAvatar = ref((route.query.avatar as string) || "");
const syncFromQuery = () => {
  if (route.query.fullName)
    formData.value.fullName = route.query.fullName as string;
  if (route.query.email) formData.value.email = route.query.email as string;
  if (route.query.avatar) formData.value.avatar = route.query.avatar as string;
  if (route.query.uid) socialUid.value = route.query.uid as string;
};

onMounted(async () => {
  syncFromQuery();

  // 如果缺少查詢參數（LINE 重定向常見情況），則回退到待處理的 LINE 個人檔案
  if (isLine.value && firebaseAuth.pendingLineProfile.value) {
    const profile = firebaseAuth.pendingLineProfile.value;
    if (!formData.value.fullName) formData.value.fullName = profile.name;
    if (!formData.value.avatar) formData.value.avatar = profile.picture;
    if (!socialAvatar.value) socialAvatar.value = profile.picture;
  }

  // 確保初始社交註冊登陸時活動步驟為 1
  activeStep.value = 1;
});

// 步驟 2 的動態選項
const availableGroups = computed(() => {
  if (!formData.value.pastoralZone) return [];
  const zone = pastoralZones.find((z) => z.id === formData.value.pastoralZone);
  return zone ? zone.groups : [];
});

/** File Upload Logic **/
const fileUploadRef = ref();
const onFileSelect = (event: any) => {
  const file = event.files[0];
  const reader = new FileReader();
  reader.onload = (e) => {
    // @ts-ignore
    formData.value.avatar = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};
const triggerFileUpload = () => {
  fileUploadRef.value.choose();
};

/** Form Handlers **/
const onStep1Submit = async (e: any) => {
  if (!e.valid) return;

  formData.value = { ...formData.value, ...e.values };

  loading.value = true;
  try {
    let uid = socialUid.value;

    if (!isSocialRegister.value) {
      uid = await firebaseAuth.registerWithEmail(
        formData.value.email!,
        (e.values as any).password,
      );
    }

    if (!uid) throw new Error("缺少用戶識別碼 (Missing User ID)");

    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        uid,
        fullName: formData.value.fullName,
        phone: formData.value.phone,
        email: formData.value.email,
        avatar: formData.value.avatar,
      },
    });

    socialUid.value = uid;
    activeStep.value = 2;
  } catch (err: any) {
    const msg =
      err.code === "auth/email-already-in-use"
        ? "此 Email 已被註冊"
        : err.message || "註冊失敗";
    toast.add({
      severity: "error",
      summary: "註冊失敗",
      detail: msg,
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const onStep2Submit = async (e: any) => {
  if (!e.valid) return;

  formData.value = { ...formData.value, ...e.values };

  loading.value = true;
  try {
    const uid = socialUid.value;
    if (!uid) throw new Error("缺少用戶 ID");

    // 個人檔案更新邏輯...

    // 使用步驟 2 的資料更新會友個人檔案
    await $fetch(`/api/members/${uid}`, {
      method: "PATCH",
      body: {
        gender: formData.value.gender === "MALE" ? "Male" : "Female",
        dob: formData.value.birthDate
          ? new Date(formData.value.birthDate).toISOString().split("T")[0]
          : "",
        lineId: formData.value.lineId,
        address: formData.value.address,
        emergencyContactName: formData.value.emergencyContactName,
        emergencyContactPhone: formData.value.emergencyContactPhone,
        baptismStatus: formData.value.isBaptized,
        baptismDate: formData.value.baptismDate
          ? new Date(formData.value.baptismDate).toISOString().split("T")[0]
          : undefined,
        zoneId: formData.value.pastoralZone,
        groupId: formData.value.homeGroup,
        pastCourses: formData.value.previousCourses,
        avatar: formData.value.avatar,
      },
    });

    await authStore.loadContext();
    navigateTo("/");
  } catch (err: any) {
    toast.add({
      severity: "error",
      summary: "更新失敗",
      detail: err.message || "無法更新個人資料",
      life: 4000,
    });
  } finally {
    loading.value = false;
  }
};

const handleSkip = async () => {
  await authStore.loadContext();
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
      <!-- 標題區域 -->
      <header :class="['shrink-0 text-center', 'pt-10 px-6 sm:px-8 pb-4']">
        <StepList
          class="!flex !justify-center !gap-2 !mb-6 !bg-transparent !p-0 !border-0 !shadow-none"
        >
          <Step v-slot="{ activateCallback, value }" asChild :value="1">
            <div @click="activateCallback" class="cursor-pointer">
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  Number(value) <= activeStep
                    ? 'bg-primary'
                    : 'bg-slate-200 dark:bg-slate-800',
                ]"
              ></div>
            </div>
          </Step>
          <Step v-slot="{ activateCallback, value }" asChild :value="2">
            <div
              @click="Number(value) <= activeStep ? activateCallback() : null"
              :class="[
                Number(value) <= activeStep
                  ? 'cursor-pointer'
                  : 'cursor-default',
              ]"
            >
              <div
                :class="[
                  'h-1.5 w-12 rounded-full transition-all',
                  Number(value) <= activeStep
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
        <!-- 步驟 1: 帳號資訊 -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="1"
          class="p-6 sm:p-8 pt-2"
        >
          <Form
            :initial-values="formData"
            :resolver="zodResolver(currentStep1Schema)"
            @submit="onStep1Submit"
            class="flex-1 flex flex-col space-y-5"
          >
            <FormField
              v-slot="$field"
              name="fullName"
              class="flex flex-col gap-2"
            >
              <label
                for="fullName"
                class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <i class="pi pi-user text-slate-400" />
                <span>
                  真實姓名
                  <span class="text-primary">*</span>
                </span>
              </label>

              <InputText
                name="fullName"
                placeholder="請輸入姓名"
                :invalid="$field.invalid"
                fluid
              />

              <FormSmartFieldError
                :message="$field.error?.message"
                :show="$field.invalid"
              />
            </FormField>

            <FormField v-slot="$field" name="phone" class="flex flex-col gap-2">
              <label
                for="phone"
                class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <i class="pi pi-phone text-slate-400" />
                <span>
                  手機號碼
                  <span class="text-primary">*</span>
                </span>
              </label>

              <InputText
                name="phone"
                placeholder="0912-345-678"
                :invalid="$field.invalid"
                fluid
              />

              <FormSmartFieldError
                :message="$field.error?.message"
                :show="$field.invalid"
              />
            </FormField>

            <FormField v-slot="$field" name="email" class="flex flex-col gap-2">
              <label
                for="email"
                class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
              >
                <i class="pi pi-envelope text-slate-400" />
                <span>
                  電子郵件
                  <span class="text-primary">*</span>
                </span>
              </label>

              <InputText
                name="email"
                placeholder="example@email.com"
                :invalid="$field.invalid"
                fluid
                :disabled="isGoogle"
              />

              <FormSmartFieldError
                :message="$field.error?.message"
                :show="$field.invalid"
              />
            </FormField>

            <template v-if="!isSocialRegister">
              <Divider />

              <FormField
                v-slot="$field"
                name="password"
                class="flex flex-col gap-2"
              >
                <label
                  for="password"
                  class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <i class="pi pi-lock text-slate-400" />
                  <span>
                    設定密碼
                    <span class="text-primary">*</span>
                  </span>
                </label>

                <InputText
                  name="password"
                  placeholder="請輸入密碼"
                  :invalid="$field.invalid"
                  fluid
                  toggleMask
                  :feedback="true"
                />

                <FormSmartFieldError
                  :message="$field.error?.message"
                  :show="$field.invalid"
                />
              </FormField>

              <FormField
                v-slot="$field"
                name="confirmPassword"
                class="flex flex-col gap-2"
              >
                <label
                  for="confirmPassword"
                  class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <i class="pi pi-lock text-slate-400" />
                  <span>
                    設定密碼
                    <span class="text-primary">*</span>
                  </span>
                </label>

                <InputText
                  name="confirmPassword"
                  placeholder="請再次輸入密碼"
                  :invalid="$field.invalid"
                  fluid
                  toggleMask
                  :feedback="false"
                />

                <FormSmartFieldError
                  :message="$field.error?.message"
                  :show="$field.invalid"
                />
              </FormField>
            </template>

            <div class="mt-auto pt-6">
              <Button
                label="下一步 (Next)"
                type="submit"
                :loading="loading"
                class="font-bold !text-lg !w-full !rounded-xl shadow-md shadow-blue-300"
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
          </Form>

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

        <!-- 步驟 2: 個人資料 -->
        <StepPanel
          v-slot="{ activateCallback }"
          :value="2"
          class="p-6 sm:p-8 pt-2"
        >
          <!-- 大頭貼 (通常在表單外，或手動處理) -->
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

          <Form
            :initial-values="formData"
            :resolver="zodResolver(step2Schema)"
            @submit="onStep2Submit"
            class="space-y-10"
          >
            <!-- 基本資料 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                基本資料
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <FormField
                  v-slot="$field"
                  name="gender"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="gender"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-user text-slate-400" />
                    <span>
                      性別
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <SelectButton
                    name="gender"
                    optionLabel="label"
                    optionValue="value"
                    dataKey="value"
                    :invalid="$field.invalid"
                    fluid
                    :options="genderOptions"
                  >
                    <template #option="slotProps">
                      <i
                        :class="[slotProps.option.icon, slotProps.option.class]"
                      ></i>
                      <span>{{ slotProps.option.label }}</span>
                    </template>
                  </SelectButton>

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <FormField
                  v-slot="$field"
                  name="birthDate"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="birthDate"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-calendar text-slate-400" />
                    <span>
                      出生年月日
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <DatePicker
                    name="birthDate"
                    :invalid="$field.invalid"
                    fluid
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <FormField
                  v-slot="$field"
                  name="maritalStatus"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="maritalStatus"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-heart text-slate-400" />
                    <span> 婚姻狀態 </span>
                  </label>

                  <Select
                    name="maritalStatus"
                    :invalid="$field.invalid"
                    optionLabel="label"
                    optionValue="value"
                    fluid
                    :options="maritalOptions"
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>
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
                <FormField
                  v-slot="$field"
                  name="lineId"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="lineId"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-comment text-slate-400" />
                    <span>
                      Line ID
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <InputText
                    name="lineId"
                    placeholder="請輸入 Line ID"
                    :invalid="$field.invalid"
                    fluid
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <FormField
                  v-slot="$field"
                  name="address"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="address"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-map-marker text-slate-400" />
                    <span>
                      通訊地址
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <InputText
                    name="address"
                    placeholder="請輸入通訊地址"
                    :invalid="$field.invalid"
                    fluid
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>
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
                <FormField
                  v-slot="$field"
                  name="emergencyContactName"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="emergencyContactName"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-map-marker text-slate-400" />
                    <span>
                      緊急聯絡人姓名
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <InputText
                    name="emergencyContactName"
                    placeholder="請輸入緊急聯絡人姓名"
                    :invalid="$field.invalid"
                    fluid
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <FormField
                  v-slot="$field"
                  name="emergencyContactPhone"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="emergencyContactPhone"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-phone text-slate-400" />
                    <span>
                      緊急聯絡人電話
                      <span class="text-primary">*</span>
                    </span>
                  </label>

                  <InputText
                    name="emergencyContactPhone"
                    placeholder="請輸入緊急聯絡人電話"
                    :invalid="$field.invalid"
                    fluid
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>
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
                <FormField
                  v-slot="$field"
                  name="isBaptized"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="isBaptized"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-info-circle text-slate-400" />
                    <span> 是否已經受洗？ </span>
                  </label>

                  <SelectButton
                    name="isBaptized"
                    optionLabel="label"
                    optionValue="value"
                    dataKey="value"
                    :invalid="$field.invalid"
                    fluid
                    :options="[
                      { label: '是', value: true },
                      { label: '否', value: false },
                    ]"
                    ,
                  >
                    <template #option="slotProps">
                      <span>{{ slotProps.option.label }}</span>
                    </template>
                  </SelectButton>

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <div
                  v-if="formData.isBaptized || true"
                  class="animate-fade-in animate-duration-300"
                >
                  <FormField
                    v-slot="$field"
                    name="baptismDate"
                    class="flex flex-col gap-2"
                  >
                    <label
                      for="baptismDate"
                      class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <i class="pi pi-calendar text-slate-400" />
                      <span> 受洗日期 </span>
                    </label>

                    <DatePicker
                      name="baptismDate"
                      :invalid="$field.invalid"
                      fluid
                    />

                    <FormSmartFieldError
                      :message="$field.error?.message"
                      :show="$field.invalid"
                    />
                  </FormField>
                </div>

                <FormField
                  v-slot="$field"
                  name="pastoralZone"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="pastoralZone"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-sitemap text-slate-400" />
                    <span> 歸屬牧區 </span>
                  </label>

                  <Select
                    name="pastoralZone"
                    placeholder="請選擇牧區"
                    :invalid="$field.invalid"
                    optionLabel="name"
                    optionValue="id"
                    fluid
                    :options="pastoralZones"
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>

                <FormField
                  v-slot="$field"
                  name="homeGroup"
                  class="flex flex-col gap-2"
                >
                  <label
                    for="homeGroup"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-users text-slate-400" />
                    <span> 歸屬小組 </span>
                  </label>

                  <Select
                    name="homeGroup"
                    placeholder="請選擇小組"
                    :invalid="$field.invalid"
                    optionLabel="name"
                    optionValue="id"
                    fluid
                    :options="availableGroups"
                    :disabled="!formData.pastoralZone"
                  />

                  <FormSmartFieldError
                    :message="$field.error?.message"
                    :show="$field.invalid"
                  />
                </FormField>
              </div>
            </section>

            <!-- 過去經歷 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                過去經歷
              </h2>

              <FormField
                v-slot="$field"
                name="previousCourses"
                class="flex flex-col gap-2"
              >
                <label
                  for="previousCourses"
                  class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <i class="pi pi-book text-slate-400" />
                  <span> 曾經參與過的福音課程 (可複選，僅供參考) </span>
                </label>

                <Listbox
                  name="previousCourses"
                  optionLabel="label"
                  optionValue="value"
                  :invalid="$field.invalid"
                  fluid
                  :options="courseOptions"
                  :multiple="true"
                />

                <FormSmartFieldError
                  :message="$field.error?.message"
                  :show="$field.invalid"
                />
              </FormField>
            </section>

            <!-- 頁尾 -->
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
          </Form>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </div>
</template>
