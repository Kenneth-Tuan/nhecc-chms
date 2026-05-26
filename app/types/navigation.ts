export interface NavMenuItem {
  label: string;
  icon: string;
  to: string;
}

export interface NavMenuGroup {
  label: string;
  items: NavMenuItem[];
}
