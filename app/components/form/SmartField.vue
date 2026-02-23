<script setup lang="ts">
import { useAttrs } from "vue";

import type { FieldSchema } from "~/types/form";
import SmartFieldLabel from "./SmartFieldLabel.vue";
import SmartFieldError from "./SmartFieldError.vue";

const $attrs = useAttrs();

/**
 * SmartField - 智慧表單欄位
 * 根據傳入的 FieldSchema 自動渲染對應的輸入元件
 *
 * @props def - 欄位定義 (FieldSchema)
 */
const props = defineProps<FieldSchema>();

// 組件驗證（開發模式）
if (import.meta.env.DEV) {
  const validComponents = [
    "InputText",
    "Password",
    "Select",
    "SelectButton",
    "DatePicker",
    "ToggleSwitch",
    "Listbox",
    "Textarea",
  ];
  if (props.component && !validComponents.includes(props.component)) {
    console.warn(
      `[SmartField] Unknown component: "${props.component}". Fallback to InputText.`
    );
  }
}

// 獲取最終的組件名稱
const componentName = computed(() => props.component || "InputText");

const mergedProps = computed(() => Object.assign({}, $attrs, props.extraProps));
</script>

<template>
  <FormField v-slot="$field" :name="name" class="flex flex-col gap-2">
    <!-- Label -->
    <SmartFieldLabel
      :label="label"
      :field-name="name"
      :required="required"
      :icon="icon"
    />

    <!-- Select -->
    <Select
      v-if="componentName === 'Select'"
      :invalid="$field.invalid"
      optionLabel="label"
      optionValue="value"
      fluid
      v-bind="mergedProps"
    />

    <!-- DatePicker -->
    <DatePicker
      v-else-if="componentName === 'DatePicker'"
      :invalid="$field.invalid"
      fluid
      v-bind="mergedProps"
    />

    <!-- SelectButton -->
    <SelectButton
      v-else-if="componentName === 'SelectButton'"
      optionLabel="label"
      optionValue="value"
      dataKey="value"
      :invalid="$field.invalid"
      fluid
      v-bind="mergedProps"
    >
      <template #option="slotProps">
        <i :class="[slotProps.option.icon, slotProps.option.class]"></i>
        <span>{{ slotProps.option.label }}</span>
      </template>
    </SelectButton>

    <!-- Listbox -->
    <Listbox
      v-else-if="componentName === 'Listbox'"
      optionLabel="label"
      optionValue="value"
      v-bind="mergedProps"
    />

    <!-- Textarea -->
    <Textarea
      v-else-if="componentName === 'Textarea'"
      :invalid="$field.invalid"
      fluid
      v-bind="mergedProps"
    />

    <!-- Fallback (InputText, Password, or custom) -->
    <component
      v-else
      :is="componentName"
      :invalid="$field.invalid"
      fluid
      v-bind="mergedProps"
    />

    <!-- Error Message -->
    <SmartFieldError :message="$field.error?.message" :show="$field.invalid" />
  </FormField>
</template>
