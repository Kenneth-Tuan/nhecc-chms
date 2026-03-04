<script setup lang="ts">
import { computed, ref } from "vue";

const props = withDefaults(
  defineProps<{
    fullName?: string;
    existingAvatar?: string | null;
    plain?: boolean;
  }>(),
  {
    plain: false,
  },
);

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

const fileUploadRef = ref();
const triggerFileUpload = () => {
  fileUploadRef.value?.choose();
};

const displayAvatar = computed(() => {
  if (avatarPreview.value) return avatarPreview.value;
  if (shouldRemoveAvatar.value) return undefined;
  return props.existingAvatar || undefined;
});

const hasAvatar = computed(() => !!displayAvatar.value);

defineExpose({
  avatarFile,
  shouldRemoveAvatar,
  uploadAvatar,
  initFromExisting,
  isUploading,
});
</script>

<template>
  <section
    class="flex flex-col items-center flex-1"
    :class="{
      'p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-800':
        !plain,
    }"
  >
    <FileUpload
      ref="fileUploadRef"
      mode="basic"
      name="avatar"
      accept="image/*"
      customUpload
      auto
      :maxFileSize="2000000"
      class="hidden"
      @select="onAvatarSelect"
    />
    <div
      class="relative cursor-pointer transition-transform hover:scale-105"
      @click="triggerFileUpload"
    >
      <Avatar
        :image="displayAvatar"
        :label="!displayAvatar ? fullName?.charAt(0) : undefined"
        :icon="!displayAvatar && !fullName ? 'pi pi-user' : undefined"
        shape="circle"
        class="!w-32 !h-32 !text-4xl shadow-xl ring-4 ring-white dark:ring-slate-800 !bg-slate-100 dark:!bg-slate-800"
        :style="
          !displayAvatar && !fullName
            ? { fontSize: '3rem', color: '#cbd5e1' }
            : {}
        "
        :pt="{
          image: { class: 'object-cover w-full h-full rounded-full' },
        }"
      />
      <div
        class="absolute bottom-0 right-0 flex items-center justify-center w-10 h-10 bg-primary text-white shadow-md border-2 border-white dark:border-slate-900 rounded-full"
      >
        <i class="pi pi-camera text-base"></i>
      </div>
    </div>
    <div class="mt-4 text-center">
      <p class="font-bold text-slate-700 dark:text-slate-200">更新頭像</p>
      <p class="text-xs text-slate-500 mt-1">建議尺寸 500x500，上限 2MB</p>
      <p v-if="avatarError" class="text-xs text-red-500 mt-1">
        {{ avatarError }}
      </p>
      <Button
        v-if="hasAvatar"
        label="移除當前頭像"
        severity="danger"
        text
        size="small"
        class="mt-2"
        @click.stop="removeAvatar"
      />
    </div>
  </section>
</template>
