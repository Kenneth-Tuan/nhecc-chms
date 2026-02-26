/**
 * CASL 權限定義（用戶端與伺服器端共用）
 */
import { Ability, AbilityBuilder, type AbilityClass } from "@casl/ability";
import type { UserContext } from "~/types/auth";

export type AppAction =
  | "view"
  | "create"
  | "update"
  | "delete"
  | "export"
  | "manage"
  | "grade"
  | "reveal";

export type AppSubject =
  | "Dashboard"
  | "Member"
  | "Organization"
  | "System"
  | "Course"
  | "all";

export type AppAbility = Ability<[AppAction, AppSubject]>;
export const AppAbility = Ability as AbilityClass<AppAbility>;

export const detectSubjectType = (subject: any) => {
  if (subject && typeof subject === "object" && subject.__type) {
    return subject.__type as AppSubject;
  }
  return subject as AppSubject;
};

/**
 * 根據解析後的用戶上下文 (UserContext) 建立 CASL Ability。
 * 將 X 軸（功能權限）與 Z 軸（敏感資料解鎖權限）映射為 CASL 規則。
 * Y 軸（資料範圍 Scope）則在服務層 (Service layer) 的範圍過濾器中另行處理。
 */
export function buildAbility(userContext: UserContext): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(AppAbility);

  // X 軸：功能權限 (Functional permissions)
  if (userContext.permissions["dashboard:view"]) can("view", "Dashboard");
  if (userContext.permissions["dashboard:export"]) can("export", "Dashboard");
  if (userContext.permissions["member:view"]) can("view", "Member");
  if (userContext.permissions["member:create"]) can("create", "Member");
  if (userContext.permissions["member:edit"]) {
    if (userContext.scope === "Self") {
      can("update", "Member", { uuid: userContext.userId } as any);
    } else {
      can("update", "Member");
    }
  }
  if (userContext.permissions["member:delete"]) can("delete", "Member");
  if (userContext.permissions["member:export"]) can("export", "Member");
  if (userContext.permissions["org:view"]) can("view", "Organization");
  if (userContext.permissions["org:manage"]) can("manage", "Organization");
  if (userContext.permissions["system:config"]) can("manage", "System");
  if (userContext.permissions["course:view"]) can("view", "Course");
  if (userContext.permissions["course:manage"]) can("manage", "Course");
  if (userContext.permissions["course:grade"]) can("grade", "Course");

  // Z 軸：欄位層級的解鎖權限 (Reveal authority)
  if (userContext.revealAuthority.mobile) can("reveal", "Member", "mobile");
  if (userContext.revealAuthority.email) can("reveal", "Member", "email");
  if (userContext.revealAuthority.lineId) can("reveal", "Member", "lineId");
  if (userContext.revealAuthority.address) can("reveal", "Member", "address");
  if (userContext.revealAuthority.emergencyContactPhone)
    can("reveal", "Member", "emergencyContactPhone");

  return build({ detectSubjectType });
}
