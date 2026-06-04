import { CourseCategoryRepository } from "../repositories/courseCategory.repository";
import { CourseClassRepository } from "../repositories/courseClass.repository";
import { CourseTemplateRepository } from "../repositories/courseTemplate.repository";
import { CourseEnrollmentRepository } from "../repositories/courseEnrollment.repository";
import { MemberRepository } from "../repositories/member.repository";
import { createError } from "h3";
import type { AppAbility } from "~/utils/casl/ability";
import type { UserContext } from "~/types/auth";
import type {
  CourseClass,
  CreateCourseClassPayload,
  ClassSession,
  CourseClassStatus,
} from "~/types/course-class";
import type { Prerequisite } from "~/types/course";
import {
  assertCourseClassAccess,
  canAccessCourseClass,
  type CourseClassAccessContext,
} from "../utils/courseClass.policy";
import { getAdminFirestore } from "../utils/firebase-admin";

import type { CourseEnrollment } from "~/types/course-enrollment";
import type { Member } from "~/types/member";

// Repositories are initialized lazily within methods to avoid initialization order issues

export interface CourseClassFilters {
  teacherId?: string;
  categoryId?: string;
  status?: CourseClassStatus | "all";
  search?: string;
}

type PublicCourseClass = CourseClass & {
  templateName: string;
  templateCode: string;
  categoryId: string;
  categoryName: string;
  prerequisites: Prerequisite[];
};

export class CourseClassService {
  private assertClassAccess(
    context: CourseClassAccessContext,
    courseClass: CourseClass,
    message: string,
    ability?: AppAbility
  ): void {
    assertCourseClassAccess(context, courseClass, message, ability);
  }

  /**
   * 獲取可公開瀏覽的班級清單 (含模板與類別資訊)
   */
  async listPublished(): Promise<PublicCourseClass[]> {
    const classRepo = new CourseClassRepository();
    const templateRepo = new CourseTemplateRepository();
    const categoryRepo = new CourseCategoryRepository();

    const [classes, templates, categories] = await Promise.all([
      classRepo.findPublished(),
      templateRepo.findAll(),
      categoryRepo.findAll(),
    ]);

    return classes
      .map((c: CourseClass) => {
        const template = templates.find(
          (t: import("~/types/course").CourseTemplate) => t.id === c.templateId
        );
        const categoryId = template?.categoryIds?.[0] || "uncategorized";
        const category = categories.find((cat: any) => cat.id === categoryId);
        return {
          ...c,
          templateName: template?.name || "未知課程",
          templateCode: template?.code || "N/A",
          categoryId,
          categoryName: category?.name || "未分類",
          prerequisites: template?.prerequisites || [],
        };
      })
      .sort((a: any, b: any) => a.startDate.localeCompare(b.startDate));
  }

  /**
   * 獲取可報名的公開班級清單。
   */
  async listEnrollable(): Promise<PublicCourseClass[]> {
    const publishedClasses = await this.listPublished();
    return publishedClasses.filter((courseClass) =>
      canAccessCourseClass("PUBLIC_ENROLL", courseClass)
    );
  }

  /**
   * 根據 ID 獲取可公開瀏覽的班級 (含模板與類別資訊)
   */
  async getPublishedById(id: string): Promise<PublicCourseClass> {
    const classRepo = new CourseClassRepository();
    const templateRepo = new CourseTemplateRepository();
    const categoryRepo = new CourseCategoryRepository();

    const targetClass = await classRepo.findById(id);
    if (!targetClass || !targetClass.isPublished) {
      throw createError({
        statusCode: 404,
        message: "找不到此班級或課程尚未發佈",
      });
    }
    // 前台瀏覽規則集中於 policy，避免公開/後台規則日後分裂。
    this.assertClassAccess(
      "PUBLIC_BROWSE",
      targetClass,
      "此課程尚未發佈，無法瀏覽"
    );

    const template = await templateRepo.findById(targetClass.templateId);
    const allCategories = await categoryRepo.findAll();
    const categoryId = template?.categoryIds?.[0] || "uncategorized";
    const foundCategory = allCategories.find(
      (cat: any) => cat.id === categoryId
    );

    return {
      ...targetClass,
      templateName: template?.name || "未知課程",
      templateCode: template?.code || "N/A",
      categoryId,
      categoryName: foundCategory?.name || "未分類",
      prerequisites: template?.prerequisites || [],
    };
  }

  /**
   * 根據 ID 獲取可報名的公開班級。
   */
  async getEnrollableById(id: string): Promise<PublicCourseClass> {
    const courseClass = await this.getPublishedById(id);
    this.assertClassAccess(
      "PUBLIC_ENROLL",
      courseClass,
      "此課程目前不可報名"
    );
    return courseClass;
  }

  /**
   * 獲取班級列表 (核心權限過濾)
   */
  async list(
    filters: CourseClassFilters,
    ability: AppAbility
  ): Promise<(CourseClass & { templateName: string; templateCode: string })[]> {
    const classRepo = new CourseClassRepository();
    const templateRepo = new CourseTemplateRepository();

    const [classes, templates] = await Promise.all([
      classRepo.findAll(),
      templateRepo.findAll(),
    ]);

    // 1. Join 模板資訊並進行基礎過濾
    const joined = classes.map((c) => {
      const template = templates.find((t) => t.id === c.templateId);
      return {
        ...c,
        templateName: template?.name || "未知課程",
        templateCode: template?.code || "N/A",
        templateCategoryIds: template?.categoryIds || [],
      };
    });

    // 2. 核心過濾邏輯
    let result = joined.filter((c) => {
      // 後台可見性統一走 policy，避免和其他入口規則分叉。
      if (!canAccessCourseClass("ADMIN_VIEW", c, ability)) {
        return false;
      }

      // 老師過濾
      if (filters.teacherId && !c.teacherIds.includes(filters.teacherId)) {
        return false;
      }

      // 狀態過濾
      if (
        filters.status &&
        filters.status !== "all" &&
        c.status !== filters.status
      ) {
        return false;
      }

      // 類別過濾 (從模板層級判斷)
      if (
        filters.categoryId &&
        !c.templateCategoryIds.includes(filters.categoryId)
      ) {
        return false;
      }

      // 關鍵字搜尋 (班級名稱、模板名稱、模板代碼)
      if (filters.search) {
        const s = filters.search.toLowerCase();
        const match =
          c.name.toLowerCase().includes(s) ||
          c.templateName.toLowerCase().includes(s) ||
          c.templateCode.toLowerCase().includes(s);
        if (!match) return false;
      }

      return true;
    });

    return result;
  }

  /**
   * 根據 ID 獲取單一班級
   */
  async getById(
    id: string,
    ability: AppAbility
  ): Promise<CourseClass & { templateName: string; templateCode: string }> {
    const classRepo = new CourseClassRepository();
    const templateRepo = new CourseTemplateRepository();

    const targetClass = await classRepo.findById(id);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    this.assertClassAccess(
      "ADMIN_VIEW",
      targetClass,
      "您無權查看此班級",
      ability
    );

    const template = await templateRepo.findById(targetClass.templateId);

    return {
      ...targetClass,
      templateName: template?.name || "未知課程",
      templateCode: template?.code || "N/A",
    };
  }

  /**
   * 獲取班級成員清單
   */
  async getClassStudents(
    classId: string,
    ability: AppAbility,
    ctx?: UserContext
  ): Promise<any[]> {
    const classRepo = new CourseClassRepository();
    const enrollmentRepo = new CourseEnrollmentRepository();
    const memberRepo = new MemberRepository();

    const targetClass = await classRepo.findById(classId);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    this.assertClassAccess(
      "ADMIN_VIEW",
      targetClass,
      "您無權查看此班級成員",
      ability
    );

    const enrollments = await enrollmentRepo.findByClassId(classId);

    // [資料校正機制]
    // 如果發現 enrollments 數量與 class 的快取數量不符，自動觸發同步
    if (
      enrollments.length !== targetClass.enrollmentCount ||
      (targetClass.studentIds &&
        enrollments.length !== targetClass.studentIds.length)
    ) {
      const actualStudentIds = enrollments
        .map((e) => e.userId)
        .filter(Boolean) as string[];
      await classRepo.update(classId, {
        studentIds: actualStudentIds,
        enrollmentCount: actualStudentIds.length,
      });
    }

    const members = await memberRepo.findAll();

    return enrollments
      .map((enroll: CourseEnrollment) => {
        const member = members.find((m: Member) => m.uuid === enroll.userId);
        if (!member) return null;

        return {
          id: enroll.id,
          userId: enroll.userId,
          name: member.fullName,
          mobile: member.mobile || "",
          status: enroll.status,
          completedDate: enroll.updatedAt,
        };
      })
      .filter(Boolean);
  }

  /**
   * 檢查老師授課時間是否衝突
   */
  async checkTeacherScheduleConflict(
    teacherIds: string[],
    newSessions: ClassSession[],
    excludeClassId?: string
  ): Promise<{ hasConflict: boolean; conflicts: any[] }> {
    const classRepo = new CourseClassRepository();
    const conflicts = [];

    for (const teacherId of teacherIds) {
      const activeClasses = await classRepo.findByTeacher(teacherId);
      const classesToCheck = activeClasses.filter(
        (c: CourseClass) =>
          (c.status === "SETUP" || c.status === "IN_PROGRESS") &&
          c.id !== excludeClassId
      );

      for (const existingClass of classesToCheck) {
        for (const existSession of existingClass.sessions) {
          const existStart = new Date(existSession.startTime).getTime();
          const existEnd = new Date(existSession.endTime).getTime();

          for (const newSession of newSessions) {
            const newStart = new Date(newSession.startTime).getTime();
            const newEnd = new Date(newSession.endTime).getTime();

            // Overlap condition: start1 < end2 && end1 > start2
            if (newStart < existEnd && newEnd > existStart) {
              conflicts.push({
                teacherId,
                classId: existingClass.id,
                className: existingClass.name,
                conflictSession: newSession,
                existingSession: existSession,
              });
            }
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  /**
   * 建立班級
   */
  async createClass(
    payload: CreateCourseClassPayload,
    forceOverride = false
  ): Promise<CourseClass> {
    const classRepo = new CourseClassRepository();
    const templateRepo = new CourseTemplateRepository();

    // 確保 teacherIds 與 teachers 物件陣列同步，用於資料庫查詢
    const teacherIds =
      payload.teachers?.map((t) => t.id) || payload.teacherIds || [];
    const normalizedPayload = { ...payload, teacherIds };

    const { hasConflict, conflicts } = await this.checkTeacherScheduleConflict(
      normalizedPayload.teacherIds,
      normalizedPayload.sessions
    );
    if (hasConflict && !forceOverride) {
      throw createError({
        statusCode: 409,
        message: "老師授課時間衝突",
        data: { conflicts },
      });
    }

    const newClass = await classRepo.create({
      ...normalizedPayload,
      status: "SETUP",
      currentSessionId: null,
    });

    // 同步更新模板狀態
    await templateRepo.markHasAssociations(payload.templateId);

    return newClass;
  }

  /**
   * 更新班級
   */
  async updateClass(
    id: string,
    payload: Partial<CreateCourseClassPayload>,
    ability: AppAbility,
    forceOverride = false
  ): Promise<CourseClass> {
    const classRepo = new CourseClassRepository();
    const targetClass = await classRepo.findById(id);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    this.assertClassAccess(
      "ADMIN_UPDATE",
      targetClass,
      "您無權編輯此班級",
      ability
    );

    // 確保 teacherIds 與 teachers 同步
    const teacherIds =
      payload.teachers?.map((t) => t.id) ||
      payload.teacherIds ||
      targetClass.teacherIds;
    const sessions = payload.sessions || targetClass.sessions;

    // 排除不應透過此路徑更新的欄位 (避免覆蓋報名狀態)
    const { studentIds: _, enrollmentCount: __, ...cleanPayload } = payload;
    const normalizedPayload = { ...cleanPayload, teacherIds };

    // 如果有提供 sessions 或 teacherIds，需要重新檢查衝突
    if (payload.sessions || payload.teachers || payload.teacherIds) {
      const { hasConflict, conflicts } =
        await this.checkTeacherScheduleConflict(teacherIds, sessions, id);
      if (hasConflict && !forceOverride) {
        throw createError({
          statusCode: 409,
          message: "老師授課時間衝突",
          data: { conflicts },
        });
      }
    }

    const updated = await classRepo.update(id, normalizedPayload as any);
    if (!updated) {
      throw createError({ statusCode: 500, message: "更新班級失敗" });
    }

    return updated;
  }

  /**
   * 開始課程
   */
  async startCourse(
    classId: string,
    ability: AppAbility
  ): Promise<CourseClass> {
    const db = getAdminFirestore();
    const classRef = db.collection("courseClasses").doc(classId);
    const enrollmentQuery = db
      .collection("courseEnrollments")
      .where("classId", "==", classId);

    return db.runTransaction(async (transaction) => {
      const classSnap = await transaction.get(classRef);
      if (!classSnap.exists) {
        throw createError({ statusCode: 404, message: "找不到指定的班級" });
      }

      const targetClass = {
        ...classSnap.data(),
        id: classSnap.id,
      } as CourseClass;

      this.assertClassAccess(
        "ADMIN_MANAGE",
        targetClass,
        "您無權開始此班級課程",
        ability
      );

      if (targetClass.status !== "SETUP") {
        throw createError({
          statusCode: 409,
          message: "只有準備中的班級可以正式開課",
        });
      }

      if (!targetClass.teacherIds?.length) {
        throw createError({
          statusCode: 400,
          message: "正式開課前必須至少指派一位授課老師",
        });
      }

      if (!targetClass.sessions?.length) {
        throw createError({
          statusCode: 400,
          message: "正式開課前必須建立課程表",
        });
      }

      const enrollmentSnap = await transaction.get(enrollmentQuery);
      const now = new Date().toISOString();

      transaction.update(classRef, {
        status: "IN_PROGRESS",
        updatedAt: now,
      });

      enrollmentSnap.docs.forEach((doc) => {
        const enrollment = doc.data() as CourseEnrollment;
        if (enrollment.status === "ASSIGNED") {
          transaction.update(doc.ref, {
            status: "IN_PROGRESS",
            updatedAt: now,
          });
        }
      });

      return {
        ...targetClass,
        status: "IN_PROGRESS",
        updatedAt: now,
      };
    });
  }

  /**
   * 結業課程
   */
  async concludeCourse(
    classId: string,
    ability: AppAbility
  ): Promise<CourseClass> {
    const db = getAdminFirestore();
    const classRef = db.collection("courseClasses").doc(classId);
    const enrollmentQuery = db
      .collection("courseEnrollments")
      .where("classId", "==", classId);

    return db.runTransaction(async (transaction) => {
      const classSnap = await transaction.get(classRef);
      if (!classSnap.exists) {
        throw createError({ statusCode: 404, message: "找不到指定的班級" });
      }

      const targetClass = {
        ...classSnap.data(),
        id: classSnap.id,
      } as CourseClass;

      this.assertClassAccess(
        "ADMIN_MANAGE",
        targetClass,
        "您無權結業此班級課程",
        ability
      );

      if (targetClass.status !== "IN_PROGRESS") {
        throw createError({
          statusCode: 409,
          message: "只有進行中的班級可以結業",
        });
      }

      const enrollmentSnap = await transaction.get(enrollmentQuery);
      const now = new Date().toISOString();

      transaction.update(classRef, {
        status: "COMPLETED",
        updatedAt: now,
      });

      enrollmentSnap.docs.forEach((doc) => {
        const enrollment = doc.data() as CourseEnrollment;
        if (enrollment.status === "IN_PROGRESS") {
          transaction.update(doc.ref, {
            status: "COMPLETED",
            credits: 1,
            updatedAt: now,
          });
        }
      });

      return {
        ...targetClass,
        status: "COMPLETED",
        updatedAt: now,
      };
    });
  }

  async deleteClass(classId: string, ability: AppAbility): Promise<void> {
    const classRepo = new CourseClassRepository();
    const targetClass = await classRepo.findById(classId);

    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到指定的班級" });
    }

    this.assertClassAccess(
      "ADMIN_DELETE",
      targetClass,
      "您無權刪除此班級",
      ability
    );

    if (
      targetClass.status !== "SETUP" ||
      (targetClass.enrollmentCount && targetClass.enrollmentCount > 0) ||
      (targetClass.studentIds && targetClass.studentIds.length > 0)
    ) {
      throw createError({
        statusCode: 409,
        message: "無法刪除已開始或已有學生報名的班級",
      });
    }

    await classRepo.delete(classId);
  }
}
