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
  | "reveal"
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
  
  // --- 課程與班級動態權限引擎 (X-Y 聯動) ---
  
  // 1. 課程模板 (CourseTemplate)
  if (userContext.permissions["courseTemplate:view"]) can("view", "Course");
  if (userContext.permissions["courseTemplate:manage"]) {
    if (userContext.scope === "Global") {
      can("manage", "Course");
    } else {
      // 非全域僅能管理自己建立的或相關的 (暫估由 creatorId 判定，此處示範通案)
      can("manage", "Course", { creatorId: userContext.userId } as any);
    }
  }
  if (userContext.permissions["courseTemplate:delete"] && userContext.scope === "Global") {
    can("delete", "Course");
  }

  // 2. 班級 (CourseClass)
  
  // 基礎規則：所有登入用戶皆可瀏覽「報名中且已發佈」的班級
  can("view", "CourseClass", { status: "SETUP", isPublished: true } as any);

  // 進行中 (IN_PROGRESS)
  if (userContext.permissions["courseClass:view_inprogress"]) {
    if (userContext.scope === "Global") {
      can("view", "CourseClass", { status: "IN_PROGRESS" } as any);
    } else {
      // Group/Self 範圍：僅限班級成員 (老師或學生)
      can("view", "CourseClass", { 
        status: "IN_PROGRESS",
        $or: [
          { teacherIds: { $in: [userContext.userId] } },
          { studentIds: { $in: [userContext.userId] } }
        ]
      } as any);
    }
  }

  // 已結束 (COMPLETED)
  if (userContext.permissions["courseClass:view_completed"]) {
    if (userContext.scope === "Global") {
      can("view", "CourseClass", { status: "COMPLETED" } as any);
    } else {
      // 參與者可永久查閱
      can("view", "CourseClass", { 
        status: "COMPLETED",
        $or: [
          { teacherIds: { $in: [userContext.userId] } },
          { studentIds: { $in: [userContext.userId] } }
        ]
      } as any);
    }
  }

  // 管理與報名修改 (Manage)
  if (userContext.permissions["courseClass:manage"]) {
    if (userContext.scope === "Global") {
      can("manage", "CourseClass");
    } else {
      // 僅限自己任教的班級
      can("manage", "CourseClass", { teacherIds: { $in: [userContext.userId] } } as any);
    }
  }

  // 評分 (Grade)
  if (userContext.permissions["courseClass:grade"]) {
    if (userContext.scope === "Global") {
      can("grade", "CourseClass");
    } else {
      can("grade", "CourseClass", { teacherIds: { $in: [userContext.userId] } } as any);
    }
  }

  // Z 軸：欄位層級的解鎖權限 (Reveal authority)
  if (userContext.revealAuthority.mobile) can("reveal", "Member", "mobile");
  if (userContext.revealAuthority.email) can("reveal", "Member", "email");
  if (userContext.revealAuthority.lineId) can("reveal", "Member", "lineId");
  if (userContext.revealAuthority.address) can("reveal", "Member", "address");
  if (userContext.revealAuthority.emergencyContactPhone)
    can("reveal", "Member", "emergencyContactPhone");

  return build({ detectSubjectType });
}
