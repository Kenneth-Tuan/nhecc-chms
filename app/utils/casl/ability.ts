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
  | "teach";

export type AppSubject =
  | "Dashboard"
  | "Member"
  | "Organization"
  | "System"
  | "Course"
  | "CourseClass"
  | "CourseEnrollment"
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
 * 將 X 軸（功能權限）映射為 CASL 規則。
 * 資料範圍由 data_access 在 Service 層處理。
 */
export function buildAbility(userContext: UserContext): AppAbility {
  const { can, build } = new AbilityBuilder<AppAbility>(AppAbility);
  const isGlobalAdmin = userContext.accessScope.admin.isGlobal;
  const hasNoAccess =
    !isGlobalAdmin &&
    userContext.accessScope.admin.zone.length === 0 &&
    userContext.accessScope.admin.group.length === 0;

  // X 軸：功能權限 (Functional permissions)
  if (userContext.permissions["dashboard:view"]) can("view", "Dashboard");
  if (userContext.permissions["dashboard:export"]) can("export", "Dashboard");
  if (userContext.permissions["member:view"]) can("view", "Member");
  if (userContext.permissions["member:create"]) can("create", "Member");
  if (userContext.permissions["member:edit"]) {
    if (hasNoAccess) {
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

  // 課程模板 (CourseTemplate)
  if (userContext.permissions["courseTemplate:view"]) can("view", "Course");
  if (userContext.permissions["courseTemplate:manage"]) {
    if (isGlobalAdmin) {
      can("manage", "Course");
    } else {
      can("manage", "Course", { creatorId: userContext.userId } as any);
    }
  }
  if (userContext.permissions["courseTemplate:delete"] && isGlobalAdmin) {
    can("delete", "Course");
  }

  // 班級 (CourseClass)
  can("view", "CourseClass", { status: "SETUP", isPublished: true } as any);

  if (userContext.permissions["courseClass:view_inprogress"]) {
    if (isGlobalAdmin) {
      can("view", "CourseClass", { status: "IN_PROGRESS" } as any);
    } else {
      can("view", "CourseClass", {
        status: "IN_PROGRESS",
        $or: [
          { teacherIds: { $in: [userContext.userId] } },
          { studentIds: { $in: [userContext.userId] } },
        ],
      } as any);
    }
  }

  if (userContext.permissions["courseClass:view_completed"]) {
    if (isGlobalAdmin) {
      can("view", "CourseClass", { status: "COMPLETED" } as any);
    } else {
      can("view", "CourseClass", {
        status: "COMPLETED",
        $or: [
          { teacherIds: { $in: [userContext.userId] } },
          { studentIds: { $in: [userContext.userId] } },
        ],
      } as any);
    }
  }

  if (userContext.permissions["courseClass:manage"]) {
    if (isGlobalAdmin) {
      can("manage", "CourseClass");
    } else {
      can("manage", "CourseClass", { teacherIds: { $in: [userContext.userId] } } as any);
    }
  }

  if (userContext.permissions["courseClass:grade"]) {
    if (isGlobalAdmin) {
      can("grade", "CourseClass");
    } else {
      can("grade", "CourseClass", { teacherIds: { $in: [userContext.userId] } } as any);
    }
  }

  return build({ detectSubjectType });
}
