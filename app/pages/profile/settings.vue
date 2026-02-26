<script setup lang="ts">
/**
 * 個人資料設定頁面 (ST001)
 * 供一般用戶（無管理權限者）修改個人基本資料。
 */
import type { MemberDetail, UpdateProfileInput } from "~/types/member";

definePageMeta({
  middleware: ["auth"],
});

const router = useRouter();
const toast = useToast();

const {
  isSubmitting,
  fieldErrors,
  clearFieldError,
  validateProfileUpdate,
  submitProfileUpdate,
} = useMemberForm();

const {
  avatarPreview,
  avatarFile,
  isUploading,
  avatarError,
  shouldRemoveAvatar,
  onAvatarSelect,
  uploadAvatar,
  removeAvatar,
  initFromExisting,
} = useAvatarUpload();

const isLoading = ref(true);
const memberDetail = ref<MemberDetail | null>(null);

const form = ref<UpdateProfileInput & { existingAvatar?: string | null }>({
  fullName: "",
  gender: "Male",
  dob: "",
  email: "",
  mobile: "",
  address: "",
  lineId: "",
  emergencyContactName: "",
  emergencyContactRelationship: "",
  emergencyContactPhone: "",
  baptismStatus: false,
  baptismDate: "",
  pastCourses: [],
  existingAvatar: null,
});

// Options
const genderOptions = [
  { label: "男", value: "Male" },
  { label: "女", value: "Female" },
];

const relationshipOptions = [
  { label: "父子", value: "父子" },
  { label: "母女", value: "母女" },
  { label: "父女", value: "父女" },
  { label: "母子", value: "母子" },
  { label: "配偶", value: "配偶" },
  { label: "兄弟姊妹", value: "兄弟姊妹" },
  { label: "子女", value: "子女" },
  { label: "其他", value: "其他" },
];

const courseOptions = [
  { label: "受洗造就班", value: "course_1" },
  { label: "初信造就班", value: "course_2" },
  { label: "門徒訓練班", value: "course_3" },
];

const maxDate = new Date();
const dobDate = computed({
  get: () => (form.value.dob ? new Date(form.value.dob) : null),
  set: (val: Date | null) => {
    form.value.dob = val ? val.toISOString().split("T")[0] : "";
  },
});

const baptismDateComputed = computed({
  get: () => (form.value.baptismDate ? new Date(form.value.baptismDate) : null),
  set: (val: Date | null) => {
    form.value.baptismDate = val ? val.toISOString().split("T")[0] : "";
  },
});

const displayAvatar = computed(() => {
  if (avatarPreview.value) return avatarPreview.value;
  if (shouldRemoveAvatar.value) return undefined;
  return form.value.existingAvatar || undefined;
});

// Load Profile Data
async function loadProfile() {
  isLoading.value = true;
  try {
    const { data } = await $fetch<{ data: MemberDetail }>("/api/auth/me");
    memberDetail.value = data;

    // Fill Form
    form.value = {
      fullName: data.fullName,
      gender: data.gender,
      dob: data.dob,
      email: data.email,
      mobile: data.mobile,
      address: data.address || "",
      lineId: data.lineId || "",
      emergencyContactName: data.emergencyContactName,
      emergencyContactRelationship: data.emergencyContactRelationship,
      emergencyContactPhone: data.emergencyContactPhone,
      baptismStatus: data.baptismStatus || false,
      baptismDate: data.baptismDate || "",
      pastCourses: data.pastCourses || [],
      existingAvatar: data.avatar || null,
    };

    if (data.avatar) {
      initFromExisting(data.avatar);
    }
  } catch (error) {
    console.error("Failed to load profile:", error);
    toast.add({
      severity: "error",
      summary: "載入失敗",
      detail: "無法取得個人資料",
      life: 3000,
    });
    router.back();
  } finally {
    isLoading.value = false;
  }
}

// Global Check logic? (Skipped for brevity as requested casuallness, but maintaining safety)

async function handleSave() {
  const payload: UpdateProfileInput = {
    ...form.value,
  };

  // Avatar Logic
  if (avatarFile.value && memberDetail.value?.uuid) {
    try {
      const avatarUrl = await uploadAvatar(memberDetail.value.uuid);
      if (avatarUrl) payload.avatar = avatarUrl;
    } catch {
      toast.add({ severity: "error", summary: "錯誤", detail: "頭像上傳失敗" });
      return;
    }
  } else if (shouldRemoveAvatar.value) {
    payload.avatar = undefined;
  }

  // Frontend Validation
  if (!validateProfileUpdate(payload)) {
    toast.add({
      severity: "error",
      summary: "驗證失敗",
      detail: "請檢查標註紅色的欄位",
    });
    return;
  }

  const result = await submitProfileUpdate(payload);
  if (result.success) {
    router.push("/profile");
  }
}

const hasAvatar = computed(() => !!displayAvatar.value);

onMounted(loadProfile);
</script>

<template>
  <div class="px-4 py-8 max-w-2xl mx-auto pb-24">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-8">
      <Button
        icon="pi pi-chevron-left"
        text
        rounded
        class="!p-3"
        @click="router.back()"
      />
      <h1
        class="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white"
      >
        個人資料設定
      </h1>
    </div>

    <div
      v-if="isLoading"
      class="flex flex-col items-center justify-center py-20 gap-4"
    >
      <ProgressSpinner style="width: 50px; height: 50px" />
      <p class="text-slate-500 animate-pulse">正在載入您的資料...</p>
    </div>

    <form
      v-else
      @submit.prevent="handleSave"
      class="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
    >
      <!-- Avatar Section (Modern UI) -->
      <section
        class="flex flex-col items-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800"
      >
        <div class="relative group cursor-pointer" @click="() => {}">
          <Avatar
            :image="displayAvatar"
            :label="!displayAvatar ? form.fullName?.charAt(0) : undefined"
            shape="circle"
            class="!w-32 !h-32 !text-4xl shadow-xl ring-4 ring-white dark:ring-slate-800"
            :class="[!displayAvatar ? '!bg-primary-100 !text-primary' : '']"
          />
          <div class="absolute bottom-0 right-0 flex gap-1">
            <FileUpload
              mode="basic"
              chooseIcon="pi pi-camera"
              class="!rounded-full p-button-sm shadow-lg !p-0 !w-10 !h-10 !flex !items-center !justify-center"
              @select="onAvatarSelect"
              customUpload
              auto
              :maxFileSize="2000000"
            />
          </div>
        </div>
        <div class="mt-4 text-center">
          <p class="font-bold text-slate-700 dark:text-slate-200">更新頭像</p>
          <p class="text-xs text-slate-500 mt-1">建議尺寸 500x500，上限 2MB</p>
          <Button
            v-if="hasAvatar"
            label="移除當前頭像"
            severity="danger"
            text
            size="small"
            class="mt-2"
            @click="removeAvatar"
          />
        </div>
      </section>

      <!-- Personal Info -->
      <div class="space-y-6">
        <h2
          class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white border-l-4 border-primary pl-3"
        >
          基本資料
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">姓名</label>
            <InputText
              v-model="form.fullName"
              placeholder="您的真實姓名"
              class="!py-3 !px-4 !text-lg !rounded-xl"
              :invalid="!!fieldErrors.fullName"
              @input="clearFieldError('fullName')"
            />
            <small v-if="fieldErrors.fullName" class="p-error">{{
              fieldErrors.fullName
            }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">性別</label>
            <Select
              v-model="form.gender"
              :options="genderOptions"
              optionLabel="label"
              optionValue="value"
              class="w-full !rounded-xl !py-1"
            />
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">出生日期</label>
            <DatePicker
              v-model="dobDate"
              dateFormat="yy-mm-dd"
              :maxDate="maxDate"
              class="w-full"
              inputClass="w-full !py-3 !px-4 !text-lg !rounded-xl"
              placeholder="點此選擇日期"
            />
          </div>
        </div>
      </div>

      <!-- Contact Info -->
      <div class="space-y-6">
        <h2
          class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white border-l-4 border-primary pl-3"
        >
          聯絡資訊
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">手機號碼</label>
            <InputText
              v-model="form.mobile"
              placeholder="09xx-xxx-xxx"
              class="!py-3 !px-4 !text-lg !rounded-xl"
              :invalid="!!fieldErrors.mobile"
              @input="clearFieldError('mobile')"
            />
            <small v-if="fieldErrors.mobile" class="p-error">{{
              fieldErrors.mobile
            }}</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">電子信箱</label>
            <InputText
              v-model="form.email"
              disabled
              class="!py-3 !px-4 !text-lg !rounded-xl bg-slate-100 dark:bg-slate-800/50"
            />
            <small class="text-slate-400">目前暫不開放自行修改註冊信箱</small>
          </div>

          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">Line ID</label>
            <InputText
              v-model="form.lineId"
              placeholder="選填"
              class="!py-3 !px-4 !text-lg !rounded-xl"
            />
          </div>
        </div>

        <div class="flex flex-col gap-2">
          <label class="text-base font-semibold">聯絡地址</label>
          <Textarea
            v-model="form.address"
            rows="2"
            placeholder="完整地址"
            class="!py-3 !px-4 !text-lg !rounded-xl"
            autoResize
          />
        </div>
      </div>

      <!-- Church Info -->
      <div class="space-y-6">
        <h2
          class="text-xl font-bold flex items-center gap-2 text-slate-800 dark:text-white border-l-4 border-primary pl-3"
        >
          教會資訊
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold">受洗狀態</label>
            <div class="flex items-center gap-3 h-[52px]">
              <RadioButton
                v-model="form.baptismStatus"
                :value="true"
                inputId="baptized"
              />
              <label for="baptized" class="cursor-pointer">已受洗</label>
              <RadioButton
                v-model="form.baptismStatus"
                :value="false"
                inputId="notBaptized"
                class="ml-4"
              />
              <label for="notBaptized" class="cursor-pointer">未受洗</label>
            </div>
          </div>

          <div
            v-if="form.baptismStatus"
            class="flex flex-col gap-2 animate-in fade-in zoom-in duration-300"
          >
            <label class="text-base font-semibold">受洗日期</label>
            <DatePicker
              v-model="baptismDateComputed"
              dateFormat="yy-mm-dd"
              :maxDate="maxDate"
              class="w-full"
              inputClass="w-full !py-3 !px-4 !text-lg !rounded-xl"
              placeholder="點此選擇受洗日期"
            />
          </div>
          <div
            v-else
            class="flex flex-col justify-end text-sm text-slate-400 pb-3"
          >
            *(勾選已受洗後可填寫受洗日期)
          </div>

          <div class="flex flex-col gap-2 md:col-span-2">
            <label class="text-base font-semibold">已結業課程</label>
            <MultiSelect
              v-model="form.pastCourses"
              :options="courseOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇您已完成的課程"
              class="w-full !py-1 !rounded-xl"
              display="chip"
            />
          </div>
        </div>
      </div>

      <!-- Emergency Section -->
      <div
        class="p-6 bg-red-50/30 dark:bg-red-900/10 rounded-3xl border border-red-100/50 dark:border-red-900/20 space-y-6"
      >
        <h2
          class="text-xl font-bold flex items-center gap-2 text-red-600 dark:text-red-400"
        >
          <i class="pi pi-exclamation-circle" />
          緊急聯絡人
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold font-bold">姓名</label>
            <InputText
              v-model="form.emergencyContactName"
              placeholder="必填"
              class="!py-3 !px-4 !text-lg !rounded-xl border-red-200 dark:border-red-900/40"
              :invalid="!!fieldErrors.emergencyContactName"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold font-bold">關係</label>
            <Select
              v-model="form.emergencyContactRelationship"
              :options="relationshipOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="請選擇"
              class="w-full !rounded-xl border-red-200 dark:border-red-900/40 !py-1"
            />
          </div>
          <div class="flex flex-col gap-2">
            <label class="text-base font-semibold font-bold">緊急電話</label>
            <InputText
              v-model="form.emergencyContactPhone"
              placeholder="09..."
              class="!py-3 !px-4 !text-lg !rounded-xl border-red-200 dark:border-red-900/40"
              :invalid="!!fieldErrors.emergencyContactPhone"
            />
          </div>
        </div>
      </div>

      <!-- Action Footer -->
      <div
        class="fixed bottom-0 left-0 w-full p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 flex justify-center z-50"
      >
        <div class="w-full max-w-2xl flex gap-4">
          <Button
            label="放棄修改"
            severity="secondary"
            text
            class="flex-1 !py-4 !rounded-2xl !font-bold"
            @click="router.back()"
          />
          <Button
            label="完成並儲存"
            severity="primary"
            class="flex-[2] !py-4 !rounded-2xl !font-extrabold shadow-xl shadow-primary-500/20"
            type="submit"
            :loading="isSubmitting || isUploading"
          />
        </div>
      </div>
    </form>
  </div>
</template>

<style scoped>
:deep(.p-datepicker-trigger) {
  background: transparent !important;
  border: none !important;
  color: #94a3b8 !important;
}
:deep(.p-inputtext:focus) {
  outline: 2px solid rgba(var(--primary-500), 0.2) !important;
  border-color: var(--primary-500) !important;
}
</style>
