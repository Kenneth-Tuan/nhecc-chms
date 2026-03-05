<script setup lang="ts">
import dayjs from "dayjs";

import {
  getStep1Schema,
  step2Schema,
  type RegisterFormValues,
} from "~/utils/user/formDef";
import { useOrganizationStore } from "~/stores/organization.store";
import { useToast } from "primevue/usetoast";
import { useAuthStore } from "~/stores/auth.store";
import { useFirebaseAuth } from "~/composables/useFirebaseAuth";
import AccountInfoForm from "./_components/AccountInfoForm.vue";

const route = useRoute();
const firebaseAuth = useFirebaseAuth();
const authStore = useAuthStore();
const toast = useToast();
const orgStore = useOrganizationStore();

const activeStep = ref(1);
const loading = ref(false);

const maxDate = dayjs().toDate();

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

const formData = ref<any>({
  fullName: (route.query.fullName as string) || "",
  email: (route.query.email as string) || "",
  phone: "",
  gender: "Male",
  birthDate: "",
  isBaptized: false,
  baptismDate: "",
  pastoralZone: "",
  homeGroup: "",
  previousCourses: [],
  password: "",
  confirmPassword: "",
});

const errors1 = ref<Record<string, string>>({});
const errors2 = ref<Record<string, string>>({});

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
  orgStore.fetchStructure();

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
  return orgStore.getGroupsByZone(formData.value.pastoralZone);
});

const avatarUploadRef = ref();

/** Form Handlers **/
const onStep1Submit = async () => {
  const result = currentStep1Schema.value.safeParse(formData.value);
  if (!result.success) {
    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue: any) => {
      const key = issue.path[0] as string;
      if (key && !newErrors[key]) newErrors[key] = issue.message;
    });
    errors1.value = newErrors;
    return;
  }
  errors1.value = {};

  loading.value = true;
  try {
    let uid = socialUid.value;

    if (!isSocialRegister.value) {
      uid = await firebaseAuth.registerWithEmail(
        formData.value.email!,
        formData.value.password,
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

const onStep2Submit = async () => {
  const result = step2Schema.safeParse(formData.value);
  if (!result.success) {
    const newErrors: Record<string, string> = {};
    result.error.issues.forEach((issue: any) => {
      const key = issue.path[0] as string;
      if (key && !newErrors[key]) newErrors[key] = issue.message;
    });
    errors2.value = newErrors;
    return;
  }
  errors2.value = {};

  loading.value = true;
  try {
    const uid = socialUid.value;
    if (!uid) throw new Error("缺少用戶 ID");

    const avatarFile = avatarUploadRef.value?.avatarFile;
    const shouldRemoveAvatar = avatarUploadRef.value?.shouldRemoveAvatar;

    if (avatarFile) {
      try {
        const avatarUrl = await avatarUploadRef.value.uploadAvatar(uid);
        if (avatarUrl) {
          formData.value.avatar = avatarUrl;
        }
      } catch (err: any) {
        toast.add({
          severity: "error",
          summary: "頭像上傳失敗",
          detail: err.message,
        });
        return;
      }
    } else if (shouldRemoveAvatar) {
      formData.value.avatar = undefined;
    }

    // 個人檔案更新邏輯...

    // 使用步驟 2 的資料更新會友個人檔案
    await $fetch(`/api/members/${uid}`, {
      method: "PATCH",
      body: {
        gender: formData.value.gender,
        dob: formData.value.birthDate
          ? dayjs(formData.value.birthDate).format("YYYY-MM-DD")
          : "",
        baptismStatus: formData.value.isBaptized,
        baptismDate: formData.value.baptismDate
          ? dayjs(formData.value.baptismDate).format("YYYY-MM-DD")
          : undefined,
        zoneId: formData.value.pastoralZone,
        groupId: formData.value.homeGroup,
        pastCourses: formData.value.previousCourses,
        avatar: formData.value.avatar,
      },
    });

    await authStore.loadContext();
    if (authStore.isAdmin) {
      navigateTo("/dashboard");
    } else {
      navigateTo("/");
    }
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
  if (authStore.isAdmin) {
    navigateTo("/dashboard");
  } else {
    navigateTo("/");
  }
};

definePageMeta({
  layout: "auth-layout",
});
</script>

<template>
  <LayoutAuthCard>
    <Stepper v-model:value="activeStep" class="flex flex-col p-4 w-full">
      <!-- 標題區域 -->
      <header class="shrink-0 text-center pt-10 px-6 sm:px-8 pb-4">
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
        <StepPanel :value="1" class="bg-inherit">
          <AccountInfoForm
            v-model="formData"
            :errors="{ ...errors1, ...errors2 }"
            :is-social-register="isSocialRegister"
            :loading="loading"
            submit-label="下一步 (Next)"
            @submit="onStep1Submit"
          />

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
        <!-- ... (其餘步驟保持不變) ... -->

        <!-- 步驟 2: 個人資料 -->
        <StepPanel v-slot="{ activateCallback }" :value="2" class="bg-inherit">
          <!-- 大頭貼 -->
          <ProfileAvatarUpload
            ref="avatarUploadRef"
            :full-name="formData.fullName"
            :existing-avatar="formData.avatar"
            plain
            class="mb-8"
          />
          <form @submit.prevent="onStep2Submit" class="space-y-10">
            <!-- 基本資料 -->
            <section class="space-y-4">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                基本資料
              </h2>
              <div class="grid grid-cols-1 gap-5">
                <div class="flex flex-col gap-2">
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
                    v-model="formData.gender"
                    name="gender"
                    optionLabel="label"
                    optionValue="value"
                    dataKey="value"
                    :invalid="!!(errors1.gender || errors2.gender)"
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

                  <small
                    class="text-red-500 text-xs mt-1"
                    v-if="errors1.gender || errors2.gender"
                    >{{ errors1.gender || errors2.gender }}</small
                  >
                </div>

                <div class="flex flex-col gap-2">
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
                    v-model="formData.birthDate"
                    name="birthDate"
                    dateFormat="yy-mm-dd"
                    :invalid="!!(errors1.birthDate || errors2.birthDate)"
                    fluid
                    :max-date="maxDate"
                  />

                  <small
                    class="text-red-500 text-xs mt-1"
                    v-if="errors1.birthDate || errors2.birthDate"
                    >{{ errors1.birthDate || errors2.birthDate }}</small
                  >
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
                <div class="flex flex-col gap-2">
                  <label
                    for="isBaptized"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-info-circle text-slate-400" />
                    <span> 是否已經受洗？ </span>
                  </label>

                  <SelectButton
                    v-model="formData.isBaptized"
                    name="isBaptized"
                    optionLabel="label"
                    optionValue="value"
                    dataKey="value"
                    :invalid="!!(errors1.isBaptized || errors2.isBaptized)"
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

                  <small
                    class="text-red-500 text-xs mt-1"
                    v-if="errors1.isBaptized || errors2.isBaptized"
                    >{{ errors1.isBaptized || errors2.isBaptized }}</small
                  >
                </div>

                <div
                  v-if="formData.isBaptized"
                  class="animate-fade-in animate-duration-300"
                >
                  <div class="flex flex-col gap-2">
                    <label
                      for="baptismDate"
                      class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                    >
                      <i class="pi pi-calendar text-slate-400" />
                      <span> 受洗日期 </span>
                    </label>

                    <DatePicker
                      v-model="formData.baptismDate"
                      name="baptismDate"
                      dateFormat="yy-mm-dd"
                      :invalid="!!(errors1.baptismDate || errors2.baptismDate)"
                      fluid
                      :max-date="maxDate"
                    />

                    <small
                      class="text-red-500 text-xs mt-1"
                      v-if="errors1.baptismDate || errors2.baptismDate"
                      >{{ errors1.baptismDate || errors2.baptismDate }}</small
                    >
                  </div>
                </div>

                <div class="flex flex-col gap-2">
                  <label
                    for="pastoralZone"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-sitemap text-slate-400" />
                    <span> 歸屬牧區 </span>
                  </label>

                  <Select
                    v-model="formData.pastoralZone"
                    name="pastoralZone"
                    placeholder="請選擇牧區"
                    :invalid="!!(errors1.pastoralZone || errors2.pastoralZone)"
                    optionLabel="name"
                    optionValue="id"
                    fluid
                    :options="orgStore.zones"
                    :loading="orgStore.isLoadingStructure"
                  />

                  <small
                    class="text-red-500 text-xs mt-1"
                    v-if="errors1.pastoralZone || errors2.pastoralZone"
                    >{{ errors1.pastoralZone || errors2.pastoralZone }}</small
                  >
                </div>

                <div class="flex flex-col gap-2">
                  <label
                    for="homeGroup"
                    class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                  >
                    <i class="pi pi-users text-slate-400" />
                    <span> 歸屬小組 </span>
                  </label>

                  <Select
                    v-model="formData.homeGroup"
                    name="homeGroup"
                    placeholder="請選擇小組"
                    :invalid="!!(errors1.homeGroup || errors2.homeGroup)"
                    optionLabel="name"
                    optionValue="id"
                    fluid
                    :options="availableGroups"
                    :disabled="!formData.pastoralZone"
                    :loading="orgStore.isLoadingStructure"
                  />

                  <small
                    class="text-red-500 text-xs mt-1"
                    v-if="errors1.homeGroup || errors2.homeGroup"
                    >{{ errors1.homeGroup || errors2.homeGroup }}</small
                  >
                </div>
              </div>
            </section>

            <!-- 過去經歷 -->
            <section class="space-y-4" v-if="false">
              <h2
                class="text-lg font-bold flex items-center gap-2 mb-6 pl-3 text-slate-800 dark:text-white border-l-4 border-primary"
              >
                過去經歷
              </h2>

              <div class="flex flex-col gap-2">
                <label
                  for="previousCourses"
                  class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                >
                  <i class="pi pi-book text-slate-400" />
                  <span> 曾經參與過的福音課程 (可複選，僅供參考) </span>
                </label>

                <Listbox
                  v-model="formData.previousCourses"
                  name="previousCourses"
                  optionLabel="label"
                  optionValue="value"
                  :invalid="
                    !!(errors1.previousCourses || errors2.previousCourses)
                  "
                  fluid
                  :options="courseOptions"
                  :multiple="true"
                />

                <small
                  class="text-red-500 text-xs mt-1"
                  v-if="errors1.previousCourses || errors2.previousCourses"
                  >{{
                    errors1.previousCourses || errors2.previousCourses
                  }}</small
                >
              </div>
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
          </form>
        </StepPanel>
      </StepPanels>
    </Stepper>
  </LayoutAuthCard>
</template>
