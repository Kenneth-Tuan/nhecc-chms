export interface FieldSchema {
  name: string;
  label?: string;
  type?: "text" | "password" | "email" | "tel" | "slot"; // slot 用於插入自定義內容
  component?:
    | "InputText"
    | "Select"
    | "Password"
    | "SelectButton"
    | "DatePicker"
    | "ToggleSwitch"
    | "Listbox"
    | "Textarea"
    | string; // Allow flexible extension
  options?: any[]; // 下拉選單選項
  icon?: string;
  placeholder?: string;
  required?: boolean;
  props?: Record<string, any>; // 傳遞給元件的額外 props
  slotName?: string; // 當 type 為 slot 時使用
}

import type { InjectionKey } from "vue";
export const FORM_DEFS_KEY = Symbol("FORM_DEFS") as InjectionKey<
  Record<string, FieldSchema>
>;
