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
    | string; // 允許彈性擴充
  options?: any[]; // 下拉選單選項
  icon?: string;
  placeholder?: string;
  required?: boolean;
  extraProps?: Record<string, any>; // 傳遞給元件的額外 Props
  slotName?: string; // 當型別為 slot 時使用
  disabled?: boolean;
}
