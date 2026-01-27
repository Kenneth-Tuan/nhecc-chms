<script setup lang="ts">
/**
 * SchemaForm - 通用表單生成元件
 * 根據傳入的 schema 陣列自動產生表單欄位。
 */

interface FieldSchema {
  name: string;
  label?: string;
  type?: "text" | "password" | "email" | "tel" | "slot"; // slot 用於插入自定義內容
  component?: "InputText" | "Password"; // 明確指定元件
  icon?: string;
  placeholder?: string;
  required?: boolean;
  props?: Record<string, any>; // 傳遞給元件的額外 props
  slotName?: string; // 當 type 為 slot 時使用
}

const props = defineProps<{
  fields: FieldSchema[];
  loading?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
}>();

const emit = defineEmits(["submit"]);

const formData = defineModel<Record<string, any>>({ required: true });
</script>

<template>
  <form class="space-y-4" @submit.prevent="emit('submit')">
    <template v-for="field in fields" :key="field.name || field.slotName">
      <!-- Slot 類型 (用於插入提示文字或分隔線) -->
      <slot v-if="field.type === 'slot'" :name="field.slotName" />

      <!-- 一般欄位 -->
      <label v-else class="block">
        <p
          :class="[
            'text-sm font-semibold',
            'mb-1',
            'text-slate-700 dark:text-slate-300',
          ]"
        >
          {{ field.label }}
          <span v-if="field.required" class="text-primary">*</span>
        </p>

        <IconField>
          <InputIcon v-if="field.icon" :class="field.icon" />

          <!-- Password Component -->
          <Password
            v-if="field.component === 'Password'"
            v-model="formData[field.name]"
            fluid
            v-bind="field.props"
            toggle-mask
            feedback
          />

          <!-- Default InputText -->
          <InputText
            v-else
            v-model="formData[field.name]"
            :type="field.type || 'text'"
            :placeholder="field.placeholder"
            :required="field.required"
            fluid
            v-bind="field.props"
          />
        </IconField>
      </label>
    </template>

    <!-- 預設按鈕區域 (可透過 slot 覆蓋或隱藏) -->
    <slot name="footer">
      <div v-if="showSubmit" class="pt-4">
        <Button
          :label="submitLabel || 'Submit'"
          type="submit"
          :loading="loading"
          :class="[
            'font-bold !text-lg',
            '!w-full',
            '!rounded-xl',
            'shadow-md shadow-blue-300',
          ]"
        />
      </div>
    </slot>
  </form>
</template>

<style scoped>
/* 確保 InputIcon 樣式正確 */
:deep(.p-inputicon) {
  @apply top-1/2 -translate-y-1/2;
}
</style>
