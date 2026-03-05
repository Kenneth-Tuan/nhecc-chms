<script setup lang="ts">
defineProps<{
  icon: string;
  label: string;
  linked: boolean;
  loading?: boolean;
  canUnlink?: boolean;
}>();

defineEmits<{
  link: [];
  unlink: [];
}>();
</script>

<template>
  <div
    :class="[
      'flex items-center justify-between',
      'p-4',
      'rounded-xl border',
      linked
        ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-800/30'
        : 'bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800',
    ]"
  >
    <!-- 左側：圖示 + 名稱 + 狀態 -->
    <div class="flex items-center gap-3">
      <img :src="icon" :alt="label" class="w-8 h-8 object-contain" />
      <div>
        <p class="text-sm font-semibold text-slate-700 dark:text-slate-200">
          {{ label }}
        </p>
        <p
          :class="[
            'text-xs font-medium',
            linked
              ? 'text-green-600 dark:text-green-400'
              : 'text-slate-400 dark:text-slate-500',
          ]"
        >
          {{ linked ? "已連結" : "尚未連結" }}
        </p>
      </div>
    </div>

    <!-- 右側：操作按鈕 -->
    <div class="flex items-center gap-2">
      <Button
        v-if="linked && canUnlink"
        label="解除連結"
        severity="secondary"
        outlined
        size="small"
        :loading="loading"
        :class="[
          '!text-xs !font-medium',
          '!text-red-500 !border-red-200 dark:!border-red-800/50',
          'hover:!bg-red-50 dark:hover:!bg-red-900/20',
          '!rounded-lg',
        ]"
        @click="$emit('unlink')"
      />
      <Button
        v-else-if="!linked"
        label="連結"
        size="small"
        :loading="loading"
        :class="['!text-xs !font-semibold', '!rounded-lg']"
        @click="$emit('link')"
      />
      <span
        v-else-if="linked && !canUnlink"
        class="text-xs text-slate-400 dark:text-slate-500 pr-1"
      >
        主要登入
      </span>
    </div>
  </div>
</template>
