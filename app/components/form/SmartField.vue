<script setup lang="ts">
import { FORM_DEFS_KEY, type FieldSchema } from "~/types/form";

/**
 * SmartField - 智慧表單欄位
 * 自動根據 Provide 的 FormDefs 渲染對應的輸入元件
 *
 * @props name - 欄位名稱 (對應 key)
 * @props override - 覆蓋預設設定
 * @props options - 動態傳入選項
 */
interface Props {
  name: string;
  label?: string;
  override?: Partial<FieldSchema>;
  options?: any[];
}
const props = defineProps<Props>();

// Inject definitions
const formDefs = inject(FORM_DEFS_KEY);

const fieldDef = computed(() => {
  const base = formDefs?.[props.name];

  if (!base) {
    if (!formDefs)
      console.warn("SmartField: No form definitions provided. (key not found)");
    else
      console.warn(
        `SmartField: Definition for '${props.name}' not found provided defs.`,
      );

    return {
      name: props.name,
      label: props.label || props.name,
      component: "InputText",
    } as FieldSchema;
  }

  return {
    ...base,
    ...props.override,
    label: props.label || base.label,
    options: props.options || props.override?.options || base.options,
  };
});
</script>

<template>
  <FormField v-slot="$field" :name="props.name" class="flex flex-col gap-1.5">
    <!-- Label -->
    <label
      v-if="fieldDef.label"
      :for="$field.name"
      class="text-sm font-semibold ml-1 text-slate-700 dark:text-slate-300"
    >
      {{ fieldDef.label }}
      <span v-if="fieldDef.required" class="text-primary">*</span>
    </label>

    <!-- Input Wrapper (Handles Icons Globally) -->
    <!-- 如果有 Icon，使用 IconField 包裹。否則直接渲染 div.relative -->
    <component
      :is="fieldDef.icon ? 'IconField' : 'div'"
      class="relative w-full"
    >
      <!-- Icon Render -->
      <InputIcon v-if="fieldDef.icon" :class="fieldDef.icon" class="z-10" />

      <!-- 1. Select / Dropdown -->
      <Select
        v-if="fieldDef.component === 'Select'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :options="fieldDef.options"
        :placeholder="fieldDef.placeholder"
        :invalid="$field.invalid"
        fluid
        :class="['!rounded-xl !py-1', fieldDef.icon ? '!pl-8' : '!px-2']"
      />

      <!-- 2. DatePicker -->
      <DatePicker
        v-else-if="fieldDef.component === 'DatePicker'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :placeholder="fieldDef.placeholder"
        :invalid="$field.invalid"
        fluid
        class="w-full"
        :input-class="['!rounded-xl !py-3 !px-4']"
      />

      <!-- 3. SelectButton (Icons are usually not inside SelectButton, but kept for structure) -->
      <SelectButton
        v-else-if="fieldDef.component === 'SelectButton'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :options="fieldDef.options"
        :invalid="$field.invalid"
        class="w-full"
        :pt="{
          button: ({ context }: { context: any }) => ({
            class: [
              'flex-1 py-2.5',
              context.active
                ? 'bg-white dark:bg-slate-700 text-primary font-bold shadow-sm'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-800',
            ],
          }),
        }"
      />

      <!-- 4. ToggleSwitch -->
      <ToggleSwitch
        v-else-if="fieldDef.component === 'ToggleSwitch'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :invalid="$field.invalid"
      />

      <!-- 5. Listbox -->
      <Listbox
        v-else-if="fieldDef.component === 'Listbox'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :options="fieldDef.options"
        class="w-full"
        :pt="{
          root: { class: ['!border-0 !p-0 !bg-transparent'] },
          listContainer: { class: '!p-0' },
          list: { class: ['flex flex-col gap-2', '!p-0'] },
          option: ({ context }: { context: any }) => ({
            class: [
              'flex items-center outline-none cursor-pointer border transition-all mb-2 p-3 rounded-xl',
              context.selected
                ? '!bg-primary-50 dark:!bg-primary-900/20 !border-primary !text-primary font-bold'
                : '!bg-white dark:!bg-slate-800 !border-slate-200 dark:!border-slate-700 !text-slate-600 dark:!text-slate-300 hover:!border-primary/50 hover:!bg-slate-50 dark:hover:!bg-slate-800',
            ],
          }),
        }"
      >
        <template #option="{ option, selected }">
          <div class="flex items-center gap-2 w-full">
            <i v-if="selected" class="pi pi-check text-sm"></i>
            <span :class="{ 'font-bold': selected }">{{
              option[fieldDef.props?.optionLabel || "label"]
            }}</span>
          </div>
        </template>
      </Listbox>

      <!-- 6. Textarea -->
      <Textarea
        v-else-if="fieldDef.component === 'Textarea'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :placeholder="fieldDef.placeholder"
        :invalid="$field.invalid"
        fluid
        :class="[fieldDef.icon ? '!pl-10' : '']"
      />

      <!-- Fallback / InputText / Password -->
      <!-- Most standard inputs work well directly inside IconField -->
      <component
        v-else
        :is="fieldDef.component || 'InputText'"
        v-bind="{ ...fieldDef.props, ...$attrs }"
        v-model="$field.value"
        :id="$field.name"
        :placeholder="fieldDef.placeholder"
        :invalid="$field.invalid"
        fluid
      />
    </component>
    <!-- End Input Wrapper -->
    <!-- Error Message -->
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="transform -translate-y-2 opacity-0"
      enter-to-class="transform translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="transform translate-y-0 opacity-100"
      leave-to-class="transform -translate-y-2 opacity-0"
    >
      <Message
        v-if="$field.invalid"
        severity="error"
        size="small"
        variant="simple"
        class="mt-1"
      >
        {{ $field.error?.message }}
      </Message>
    </Transition>
  </FormField>
</template>
<style scoped>
:deep(.p-inputicon) {
  @apply top-1/2 -translate-y-1/2;
}
</style>
