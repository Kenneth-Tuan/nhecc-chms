<script setup lang="ts">
const dialogRef = inject("dialogRef") as any;

const params = computed(() => dialogRef.value.data || {});

const type = computed(() => params.value.type || "success");
const title = computed(() => params.value.title || "");
const message = computed(() => params.value.message || "");
const buttonLabel = computed(() => params.value.buttonLabel || "我知道了");

const closeDialog = () => {
  dialogRef.value.close();
};
</script>

<template>
  <div class="flex flex-col items-center py-6 px-4 text-center">
    <!-- Success Icon Container -->
    <div
      v-if="type === 'success'"
      class="w-20 h-20 bg-green-50 dark:bg-green-950/40 border border-green-100 dark:border-green-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner"
    >
      <i class="pi pi-check text-4xl text-green-600 dark:text-green-400" />
    </div>

    <!-- Error Icon Container -->
    <div
      v-else-if="type === 'error'"
      class="w-20 h-20 bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner"
    >
      <i class="pi pi-times text-4xl text-red-600 dark:text-red-400" />
    </div>

    <!-- Default/Info Icon Container -->
    <div
      v-else
      class="w-20 h-20 bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-inner"
    >
      <i class="pi pi-info-circle text-4xl text-blue-600 dark:text-blue-400" />
    </div>

    <h3 class="text-2xl font-black text-gray-900 dark:text-white mb-3">
      {{ title }}
    </h3>
    <p class="text-gray-600 dark:text-gray-300 mb-8 text-lg leading-relaxed whitespace-pre-wrap">
      {{ message }}
    </p>

    <Button
      :label="buttonLabel"
      :severity="type === 'error' ? 'secondary' : 'primary'"
      class="w-full !text-xl !py-4 !rounded-2xl font-bold shadow-md hover:shadow-lg transition-all transform hover:scale-[1.01] active:scale-[0.99] focus:ring-2 focus:ring-offset-2"
      @click="closeDialog"
    />
  </div>
</template>
