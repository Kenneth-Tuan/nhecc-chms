import { CourseClassRepository } from "../repositories/courseClass.repository";
import { CourseEnrollmentRepository } from "../repositories/courseEnrollment.repository";
import { CourseTemplateRepository } from "../repositories/courseTemplate.repository";
import { MemberRepository } from "../repositories/member.repository";
import { CourseTemplateService } from "./courseTemplate.service";
import { createError } from "h3";
import type { CourseClass } from "~/types/course-class";
import type { CourseEnrollment } from "~/types/course-enrollment";
import { assertCourseClassAccess } from "../utils/courseClass.policy";
import { getAdminFirestore } from "../utils/firebase-admin";
import type { AppAbility } from "~/utils/casl/ability";

export interface AssignableMember {
  userId: string;
  fullName: string;
  mobile: string;
  prerequisiteError?: string;
}

export interface UserEnrollmentStatus {
  completedCodes: string[];
  isBaptised: boolean;
  isNewcomer: boolean;
}

export class CourseEnrollmentService {
  /**
   * 獲取使用者當前的報名相關狀態。
   */
  async getUserEnrollmentStatus(userId: string): Promise<UserEnrollmentStatus> {
    const memberRepo = new MemberRepository();
    const enrollmentRepo = new CourseEnrollmentRepository();
    const templateRepo = new CourseTemplateRepository();

    const member = await memberRepo.findById(userId);
    if (!member) {
      throw createError({ statusCode: 404, message: "找不到會員資料" });
    }

    const userEnrollments = await enrollmentRepo.findByUserId(userId);
    const completedTemplateIds = userEnrollments
      .filter((e) => e.status === "COMPLETED")
      .map((e) => e.templateId);

    const allTemplates = await templateRepo.findAll();
    const completedCodes = allTemplates
      .filter((t) => completedTemplateIds.includes(t.id))
      .map((t) => t.code);

    return {
      completedCodes,
      isBaptised: member.baptismStatus || false,
      isNewcomer: !member.zoneId,
    };
  }

  /**
   * 加入課程模板等候名單，尚未指派到實體班級。
   */
  async joinWaitlist(
    userId: string,
    templateId: string,
  ): Promise<CourseEnrollment> {
    const templateRepo = new CourseTemplateRepository();

    const template = await templateRepo.findById(templateId);
    if (!template) {
      throw createError({ statusCode: 404, message: "找不到該課程模板" });
    }

    // TODO: Check prerequisites (擋修條件) here in the future.
    return this.createEnrollmentTransaction({
      userId,
      templateId,
      classId: null,
      status: "PENDING_WAITLIST",
      credits: 0,
    });
  }

  /**
   * 會員自主報名已發佈的實體班級。
   */
  async enrollToClass(userId: string, classId: string): Promise<void> {
    const classRepo = new CourseClassRepository();
    const targetClass = await classRepo.findById(classId);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    assertCourseClassAccess(
      "PUBLIC_ENROLL",
      targetClass,
      "此課程尚未發佈，無法報名",
    );

    if (targetClass.teacherIds?.includes(userId)) {
      throw createError({
        statusCode: 403,
        message: "授課老師不可報名自己授課的課程",
      });
    }

    if (targetClass.enrollmentCount >= targetClass.maxCapacity) {
      throw createError({ statusCode: 400, message: "此班級已額滿" });
    }

    if (targetClass.studentIds?.includes(userId)) {
      throw createError({ statusCode: 400, message: "您已在報名名單中" });
    }

    await this.assertPrerequisites(userId, targetClass.templateId);

    await this.enrollToClassTransaction(
      userId,
      classId,
      targetClass.templateId,
    );
  }

  private async enrollToClassTransaction(
    userId: string,
    classId: string,
    expectedTemplateId: string,
  ): Promise<void> {
    const db = getAdminFirestore();
    const classRef = db.collection("courseClasses").doc(classId);
    const enrollmentRef = db
      .collection("courseEnrollments")
      .doc(this.buildEnrollmentId(userId, expectedTemplateId));

    await db.runTransaction(async (transaction) => {
      const classSnap = await transaction.get(classRef);
      if (!classSnap.exists) {
        throw createError({ statusCode: 404, message: "找不到此班級" });
      }

      const targetClass = {
        ...classSnap.data(),
        id: classSnap.id,
      } as CourseClass;

      if (targetClass.templateId !== expectedTemplateId) {
        throw createError({
          statusCode: 409,
          message: "班級資料已變更，請重新整理後再報名",
        });
      }

      assertCourseClassAccess(
        "PUBLIC_ENROLL",
        targetClass,
        "此課程尚未發佈，無法報名",
      );

      if (targetClass.teacherIds?.includes(userId)) {
        throw createError({
          statusCode: 403,
          message: "授課老師不可報名自己授課的課程",
        });
      }

      const existingEnrollmentSnap = await transaction.get(enrollmentRef);
      const existingEnrollmentQuery = db
        .collection("courseEnrollments")
        .where("userId", "==", userId)
        .where("templateId", "==", targetClass.templateId)
        .limit(1);
      const existingEnrollmentQuerySnap = await transaction.get(
        existingEnrollmentQuery,
      );

      if (existingEnrollmentSnap.exists || !existingEnrollmentQuerySnap.empty) {
        throw createError({
          statusCode: 400,
          message: "您已經報名或在等候名單中",
        });
      }

      const studentIds = new Set(targetClass.studentIds || []);
      if (studentIds.has(userId)) {
        throw createError({ statusCode: 400, message: "您已在報名名單中" });
      }

      studentIds.add(userId);
      if (studentIds.size > targetClass.maxCapacity) {
        throw createError({ statusCode: 400, message: "此班級已額滿" });
      }

      const now = new Date().toISOString();
      transaction.create(enrollmentRef, {
        userId,
        templateId: targetClass.templateId,
        classId: targetClass.id,
        status: "ASSIGNED",
        credits: 0,
        createdAt: now,
        updatedAt: now,
      });

      transaction.update(classRef, {
        studentIds: [...studentIds],
        enrollmentCount: studentIds.size,
        updatedAt: now,
      });
    });
  }

  /**
   * 將等候名單中的報名紀錄指派到指定班級。
   */
  async assignStudentsToClass(
    classId: string,
    enrollmentIds: string[],
  ): Promise<void> {
    const db = getAdminFirestore();
    const classRef = db.collection("courseClasses").doc(classId);
    const enrollmentRefs = enrollmentIds.map((id) =>
      db.collection("courseEnrollments").doc(id),
    );

    await db.runTransaction(async (transaction) => {
      const classSnap = await transaction.get(classRef);
      if (!classSnap.exists) {
        throw createError({ statusCode: 404, message: "找不到指定的班級" });
      }

      const targetClass = {
        ...classSnap.data(),
        id: classSnap.id,
      } as CourseClass;

      const enrollmentSnaps = await Promise.all(
        enrollmentRefs.map((ref) => transaction.get(ref)),
      );
      const assignableEnrollments = enrollmentSnaps.flatMap((snap, index) => {
        if (!snap.exists) return [];
        return [
          {
            ref: enrollmentRefs[index]!,
            enrollment: {
              ...snap.data(),
              id: snap.id,
            } as CourseEnrollment,
          },
        ];
      });

      const nextStudentIds = new Set(targetClass.studentIds || []);

      for (const { enrollment } of assignableEnrollments) {
        if (enrollment.templateId !== targetClass.templateId) {
          throw createError({
            statusCode: 400,
            message: "報名紀錄與班級課程模板不一致",
          });
        }

        if (targetClass.teacherIds?.includes(enrollment.userId)) {
          throw createError({
            statusCode: 403,
            message: "授課老師不可被指派為自己課程的學員",
          });
        }

        nextStudentIds.add(enrollment.userId);
      }

      if (nextStudentIds.size > targetClass.maxCapacity) {
        throw createError({
          statusCode: 400,
          message: "指派後會超過班級人數上限",
        });
      }

      const now = new Date().toISOString();
      for (const { ref } of assignableEnrollments) {
        transaction.update(ref, {
          classId,
          status: "ASSIGNED",
          updatedAt: now,
        });
      }

      transaction.update(classRef, {
        studentIds: [...nextStudentIds],
        enrollmentCount: nextStudentIds.size,
        updatedAt: now,
      });
    });
  }

  /**
   * 獲取此班級的可指派會員列表 (Active 狀態且未報名此模板課程者)
   */
  async getAssignableMembers(
    classId: string,
    ability: AppAbility,
  ): Promise<AssignableMember[]> {
    const classRepo = new CourseClassRepository();
    const targetClass = await classRepo.findById(classId);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    assertCourseClassAccess(
      "ADMIN_MANAGE",
      targetClass,
      "權限不足，無法指派學生",
      ability,
    );

    const enrollmentRepo = new CourseEnrollmentRepository();
    const enrollments = await enrollmentRepo.findByTemplateId(
      targetClass.templateId,
    );
    const enrolledUserIds = new Set(enrollments.map((e) => e.userId));

    const memberRepo = new MemberRepository();
    const activeMembers = await memberRepo.findAll({ status: "Active" });

    const teachers = new Set(targetClass.teacherIds || []);
    const assignable = activeMembers.filter(
      (m) => !enrolledUserIds.has(m.uuid) && !teachers.has(m.uuid),
    );

    const assignableMembersList: AssignableMember[] = assignable.map((m) => ({
      userId: m.uuid,
      fullName: m.fullName,
      mobile: m.mobile || "",
    }));

    const templateRepo = new CourseTemplateRepository();
    const targetTemplate = await templateRepo.findById(targetClass.templateId);

    if (
      targetTemplate &&
      targetTemplate.prerequisites &&
      targetTemplate.prerequisites.length > 0
    ) {
      const allTemplates = await templateRepo.findAll();
      const templateMap = new Map(allTemplates.map((t) => [t.id, t.code]));
      const prereqCourseCodes = targetTemplate.prerequisites
        .filter((p: any) => p.type === "COURSE")
        .map((p: any) => p.value);

      const prereqTemplateIds = allTemplates
        .filter((t) => prereqCourseCodes.includes(t.code))
        .map((t) => t.id);

      const db = getAdminFirestore();
      const completedEnrollmentsByUserId = new Map<string, string[]>();

      if (prereqTemplateIds.length > 0) {
        for (let i = 0; i < prereqTemplateIds.length; i += 10) {
          const chunk = prereqTemplateIds.slice(i, i + 10);
          const snap = await db
            .collection("courseEnrollments")
            .where("templateId", "in", chunk)
            .where("status", "==", "COMPLETED")
            .get();

          for (const doc of snap.docs) {
            const data = doc.data();
            const code = templateMap.get(data.templateId);
            if (code) {
              const codes = completedEnrollmentsByUserId.get(data.userId) || [];
              codes.push(code);
              completedEnrollmentsByUserId.set(data.userId, codes);
            }
          }
        }
      }

      for (const m of assignableMembersList) {
        const member = assignable.find((a) => a.uuid === m.userId);
        if (!member) continue;

        const memberCodes = completedEnrollmentsByUserId.get(member.uuid) || [];
        const memberStatus = {
          isBaptised: member.baptismStatus || false,
          isNewcomer: !member.zoneId,
        };

        const failed: string[] = [];
        for (const prereq of targetTemplate.prerequisites) {
          if (prereq.type === "COURSE") {
            if (!memberCodes.includes(prereq.value)) {
              failed.push(prereq.value);
            }
          } else if (prereq.type === "STATUS") {
            if (prereq.value === "BAPTISED" && !memberStatus.isBaptised) {
              failed.push("需已受洗");
            }
            if (prereq.value === "IS_NEWCOMER" && !memberStatus.isNewcomer) {
              failed.push("需為新進教友");
            }
          }
        }

        if (failed.length > 0) {
          m.prerequisiteError = `不符合先修條件： ${failed.join("、")}`;
        }
      }
    }

    return assignableMembersList;
  }

  /**
   * 管理員直接批量指派學生到班級中
   */
  async adminAssignStudents(
    classId: string,
    userIds: string[],
    ability: AppAbility,
  ): Promise<void> {
    if (!userIds || userIds.length === 0) {
      return;
    }

    const classRepo = new CourseClassRepository();
    const targetClass = await classRepo.findById(classId);
    if (!targetClass) {
      throw createError({ statusCode: 404, message: "找不到此班級" });
    }

    assertCourseClassAccess(
      "ADMIN_MANAGE",
      targetClass,
      "權限不足，無法指派學生",
      ability,
    );

    const teachers = new Set(targetClass.teacherIds || []);
    for (const userId of userIds) {
      if (teachers.has(userId)) {
        throw createError({
          statusCode: 403,
          message: "授課老師不可被指派為自己課程的學員",
        });
      }
    }

    const db = getAdminFirestore();
    const classRef = db.collection("courseClasses").doc(classId);

    await db.runTransaction(async (transaction) => {
      const classSnap = await transaction.get(classRef);
      if (!classSnap.exists) {
        throw createError({ statusCode: 404, message: "找不到此班級" });
      }

      const freshClass = {
        ...classSnap.data(),
        id: classSnap.id,
      } as CourseClass;

      const studentIds = new Set(freshClass.studentIds || []);
      const uniqueNewUserIds = userIds.filter((id) => !studentIds.has(id));

      if (studentIds.size + uniqueNewUserIds.length > freshClass.maxCapacity) {
        throw createError({
          statusCode: 400,
          message: "指派後會超過班級人數上限",
        });
      }

      const now = new Date().toISOString();
      const enrollmentRefsAndData = [];

      for (const userId of uniqueNewUserIds) {
        const enrollmentId = this.buildEnrollmentId(
          userId,
          freshClass.templateId,
        );
        const enrollmentRef = db
          .collection("courseEnrollments")
          .doc(enrollmentId);

        const enrollmentSnap = await transaction.get(enrollmentRef);

        const query = db
          .collection("courseEnrollments")
          .where("userId", "==", userId)
          .where("templateId", "==", freshClass.templateId)
          .limit(1);
        const querySnap = await transaction.get(query);

        if (enrollmentSnap.exists || !querySnap.empty) {
          throw createError({
            statusCode: 400,
            message: "有學員已經報名或在該課程的等候名單中",
          });
        }

        studentIds.add(userId);
        enrollmentRefsAndData.push({
          ref: enrollmentRef,
          data: {
            userId,
            templateId: freshClass.templateId,
            classId: freshClass.id,
            status: "ASSIGNED",
            credits: 0,
            createdAt: now,
            updatedAt: now,
          },
        });
      }

      for (const item of enrollmentRefsAndData) {
        transaction.create(item.ref, item.data);
      }

      transaction.update(classRef, {
        studentIds: [...studentIds],
        enrollmentCount: studentIds.size,
        updatedAt: now,
      });
    });
  }

  private async assertPrerequisites(
    userId: string,
    templateId: string,
  ): Promise<void> {
    const templateService = new CourseTemplateService();
    const userStatus = await this.getUserEnrollmentStatus(userId);
    const { passed, failedPrerequisites } =
      await templateService.checkPrerequisites(
        templateId,
        userStatus.completedCodes,
        {
          isBaptised: userStatus.isBaptised,
          isNewcomer: userStatus.isNewcomer,
        },
      );

    if (!passed) {
      throw createError({
        statusCode: 400,
        message: `不符合先修條件：需完成 ${failedPrerequisites.join(", ")}`,
      });
    }
  }

  private async createEnrollmentTransaction(
    payload: Omit<CourseEnrollment, "id" | "createdAt" | "updatedAt">,
  ): Promise<CourseEnrollment> {
    const db = getAdminFirestore();
    const enrollmentRef = db
      .collection("courseEnrollments")
      .doc(this.buildEnrollmentId(payload.userId, payload.templateId));

    return db.runTransaction(async (transaction) => {
      const existingEnrollmentSnap = await transaction.get(enrollmentRef);
      const existingEnrollmentQuery = db
        .collection("courseEnrollments")
        .where("userId", "==", payload.userId)
        .where("templateId", "==", payload.templateId)
        .limit(1);
      const existingEnrollmentQuerySnap = await transaction.get(
        existingEnrollmentQuery,
      );

      if (existingEnrollmentSnap.exists || !existingEnrollmentQuerySnap.empty) {
        throw createError({
          statusCode: 400,
          message: "您已經報名或在等候名單中",
        });
      }

      const now = new Date().toISOString();
      const data = {
        ...payload,
        createdAt: now,
        updatedAt: now,
      };

      transaction.create(enrollmentRef, data);
      return { ...data, id: enrollmentRef.id };
    });
  }

  private buildEnrollmentId(userId: string, templateId: string): string {
    return `${encodeURIComponent(userId)}__${encodeURIComponent(templateId)}`;
  }
}
