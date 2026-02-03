<script setup lang="ts">
import type { FieldSchema } from "~/types/form";
import type { FormProps } from "@primevue/forms";

/**
 * SchemaForm - 通用表單生成元件
 * 根據傳入的 schema 陣列自動產生表單欄位。
 */

export type FormResolver = FormProps["resolver"];

const formData = defineModel<Record<string, any>>({ required: true });
const props = defineProps<{
  fields: FieldSchema[];
  resolver: FormResolver;
  loading?: boolean;
  submitLabel?: string;
  showSubmit?: boolean;
}>();

const emit = defineEmits(["submit"]);

const onFormSubmit = (e: any) => {
  // e.originalEvent: Represents the native form submit event.
  // e.valid: A boolean that indicates whether the form is valid or not.
  // e.states: Contains the current state of each form field, including validity status.
  // e.errors: An object that holds any validation errors for the invalid fields in the form.
  // e.values: An object containing the current values of all form fields.
  // e.reset: A function that resets the form to its initial state.

  emit("submit", e);
};
</script>

<template>
  <Form
    :initial-values="formData"
    :resolver="props.resolver"
    @submit="onFormSubmit"
    class="space-y-4"
  >
    <template v-for="field in fields" :key="field.name || field.slotName">
      <!-- Slot 類型 (用於插入提示文字或分隔線) -->
      <slot v-if="field.type === 'slot'" :name="field.slotName" />

      <!-- 一般欄位 -->
      <FormField
        v-else
        v-slot="$field"
        :name="field.name"
        class="flex flex-col gap-1"
      >
        <label class="block">
          <p
            :class="[
              'text-base font-semibold',
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
              v-bind="field.props"
              toggle-mask
              feedback
              fluid
            />

            <InputMask
              v-else-if="field.type === 'tel'"
              v-model="formData[field.name]"
              v-bind="field.props"
              mask="9999-999-999"
              placeholder="0987-654-321"
              fluid
            />

            <!-- Default InputText -->
            <InputText
              v-else
              v-model="formData[field.name]"
              v-bind="field.props"
              :type="field.type || 'text'"
              :placeholder="field.placeholder"
              :required="field.required"
              fluid
            />
          </IconField>
          <Message
            v-if="$field?.invalid"
            severity="error"
            size="small"
            variant="simple"
            >{{ $field.error?.message }}</Message
          >
        </label>
      </FormField>
    </template>

    <!-- 預設按鈕區域 (可透過 slot 覆蓋或隱藏) -->
    <slot name="footer">
      <Button
        type="submit"
        severity="secondary"
        :label="submitLabel || 'Submit'"
        :loading="loading"
        :class="[
          'font-bold !text-lg',
          '!w-full',
          '!rounded-xl',
          'shadow-md shadow-blue-300',
        ]"
      />
    </slot>
  </Form>
</template>

<style scoped>
/* 確保 InputIcon 樣式正確 */
:deep(.p-inputicon) {
  @apply top-1/2 -translate-y-1/2;
}
</style>
