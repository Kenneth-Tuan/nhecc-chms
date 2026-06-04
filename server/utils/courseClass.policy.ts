import { createError } from "h3";
import type { AppAbility, AppAction } from "~/utils/casl/ability";
import type { CourseClass } from "~/types/course-class";

/**
 * CourseClass 存取情境：
 * - Public: 前台瀏覽與報名（業務可用性）
 * - Admin: 後台管理（CASL 授權）
 */
export type CourseClassAccessContext =
  | "PUBLIC_BROWSE"
  | "PUBLIC_ENROLL"
  | "ADMIN_VIEW"
  | "ADMIN_UPDATE"
  | "ADMIN_MANAGE"
  | "ADMIN_DELETE";

function mapContextToAction(context: CourseClassAccessContext): AppAction | null {
  switch (context) {
    case "ADMIN_VIEW":
      return "view";
    case "ADMIN_UPDATE":
      return "update";
    case "ADMIN_MANAGE":
      return "manage";
    case "ADMIN_DELETE":
      return "delete";
    default:
      return null;
  }
}

export function canAccessCourseClass(
  context: CourseClassAccessContext,
  courseClass: CourseClass,
  ability?: AppAbility
): boolean {
  // Public 路徑只走「業務可用性」規則。
  if (context === "PUBLIC_BROWSE") {
    return !!courseClass.isPublished;
  }
  if (context === "PUBLIC_ENROLL") {
    return !!courseClass.isPublished && courseClass.status === "SETUP";
  }

  if (!ability) return false;
  const action = mapContextToAction(context);
  if (!action) return false;
  return ability.can(action, { ...courseClass, __type: "CourseClass" } as any);
}

export function assertCourseClassAccess(
  context: CourseClassAccessContext,
  courseClass: CourseClass,
  message: string,
  ability?: AppAbility
): void {
  if (!canAccessCourseClass(context, courseClass, ability)) {
    throw createError({ statusCode: 403, message });
  }
}
