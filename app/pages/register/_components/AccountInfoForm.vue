<script setup lang="ts">
/**
 * 共用帳號資訊表單
 * register/index.vue (Step 1) 與 register/invite.vue 共用
 */
const props = defineProps<{
  modelValue: {
    fullName: string;
    email: string;
    mobile: string;
    password: string;
    confirmPassword: string;
  };
  errors: Record<string, string>;
  /** 社群登入時隱藏密碼欄位、鎖定 email */
  isSocialRegister?: boolean;
  /** 邀請制時強制唯讀 email */
  emailReadonly?: boolean;
  loading?: boolean;
  submitLabel?: string;
}>();

const emit = defineEmits<{
  "update:modelValue": [
    value: {
      fullName: string;
      email: string;
      mobile: string;
      password: string;
      confirmPassword: string;
    },
  ];
  submit: [];
}>();

const form = computed({
  get: () => props.modelValue,
  set: (val) => emit("update:modelValue", val),
});

function update(field: string, value: string) {
  emit("update:modelValue", { ...props.modelValue, [field]: value });
}
</script>

<template>
  <form @submit.prevent="emit('submit')" class="flex-1 flex flex-col gap-4">
    <!-- 姓名 -->
    <div class="flex flex-col gap-2">
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
        :modelValue="form.fullName"
        @update:modelValue="update('fullName', $event as string)"
        name="fullName"
        placeholder="請輸入姓名"
        :invalid="!!errors.fullName"
        fluid
        class="bg-inherit"
      />
      <small class="text-red-500 text-xs mt-1" v-if="errors.fullName">
        {{ errors.fullName }}
      </small>
    </div>

    <!-- 手機 -->
    <div class="flex flex-col gap-2">
      <label
        for="mobile"
        class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
      >
        <i class="pi pi-phone text-slate-400" />
        <span> 手機號碼 </span>
      </label>
      <InputMask
        :modelValue="form.mobile"
        @update:modelValue="update('mobile', $event as string)"
        name="mobile"
        mask="9999-999-999"
        placeholder="09xx-xxx-xxx"
        :invalid="!!errors.mobile"
        fluid
        class="bg-inherit"
      />
      <small class="text-red-500 text-xs mt-1" v-if="errors.mobile">
        {{ errors.mobile }}
      </small>
    </div>

    <!-- Email -->
    <div class="flex flex-col gap-2">
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
        :modelValue="form.email"
        @update:modelValue="update('email', $event as string)"
        name="email"
        type="email"
        placeholder="example@email.com"
        :invalid="!!errors.email"
        :disabled="isSocialRegister || emailReadonly"
        fluid
        class="bg-inherit"
      />
      <small class="text-red-500 text-xs mt-1" v-if="errors.email">
        {{ errors.email }}
      </small>
    </div>

    <!-- 密碼區塊（社群登入時隱藏） -->
    <template v-if="!isSocialRegister">
      <Divider />

      <div class="flex flex-col gap-2">
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
        <Password
          :modelValue="form.password"
          @update:modelValue="update('password', $event as string)"
          name="password"
          placeholder="至少 6 個字元"
          :invalid="!!errors.password"
          toggleMask
          :feedback="true"
          fluid
          input-class="bg-inherit"
        />
        <small class="text-red-500 text-xs mt-1" v-if="errors.password">
          {{ errors.password }}
        </small>
      </div>

      <div class="flex flex-col gap-2">
        <label
          for="confirmPassword"
          class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300 flex items-center gap-2"
        >
          <i class="pi pi-lock text-slate-400" />
          <span>
            確認密碼
            <span class="text-primary">*</span>
          </span>
        </label>
        <Password
          :modelValue="form.confirmPassword"
          @update:modelValue="update('confirmPassword', $event as string)"
          name="confirmPassword"
          placeholder="請再次輸入密碼"
          :invalid="!!errors.confirmPassword"
          toggleMask
          :feedback="false"
          fluid
          input-class="bg-inherit"
        />
        <small class="text-red-500 text-xs mt-1" v-if="errors.confirmPassword">
          {{ errors.confirmPassword }}
        </small>
      </div>
    </template>

    <!-- Submit slot 讓父層控制按鈕區域 -->
    <slot name="actions">
      <div class="mt-auto pt-6">
        <Button
          :label="submitLabel ?? '下一步 (Next)'"
          type="submit"
          :loading="loading"
          class="font-bold !text-lg !w-full !rounded-xl shadow-md shadow-blue-300"
        />
        <p
          class="text-[11px] leading-normal text-center mt-4 px-4 text-slate-400"
        >
          點擊即代表您同意本平台的
          <NuxtLink to="#" class="underline hover:text-slate-600"
            >服務條款</NuxtLink
          >
          與
          <NuxtLink to="#" class="underline hover:text-slate-600"
            >隱私政策</NuxtLink
          >
        </p>
      </div>
    </slot>
  </form>
</template>
