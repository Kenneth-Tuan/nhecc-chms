<script setup lang="ts">
/**
 * 統一頁面標題列 (ST015)
 */
interface Props {
  title: string;
  description?: string;
  backTo?: string;
  backLabel?: string;
}

const props = defineProps<Props>();
const router = useRouter();

function handleBack() {
  if (props.backTo) {
    router.push(props.backTo);
  } else {
    router.back();
  }
}
</script>

<template>
  <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-10 mt-2">
    <div class="flex items-start gap-4">
      <!-- 支援返回鈕 -->
      <Button 
        v-if="backTo || $attrs.onBack" 
        icon="pi pi-arrow-left" 
        text 
        rounded 
        class="text-slate-500" 
        @click="handleBack"
      />
      <div>
        <h1 class="text-3xl font-bold text-slate-800 leading-tight">
          {{ title }}
        </h1>
        <p v-if="description" class="text-slate-400 mt-2 text-base font-medium">
          {{ description }}
        </p>
      </div>
    </div>
    
    <!-- 右側動作區域 (例如：新增按鈕) -->
    <div class="flex items-center gap-3 shrink-0">
      <slot name="actions" />
    </div>
  </div>
</template>
