import { CourseClassRepository } from "../../repositories/courseClass.repository";
import { CourseEnrollmentRepository } from "../../repositories/courseEnrollment.repository";
import { CourseTemplateRepository } from "../../repositories/courseTemplate.repository";
import type { CourseClass } from "~/types/course-class";
import type { CourseEnrollment } from "~/types/course-enrollment";
import type { CourseTemplate } from "~/types/course";

function toLearnClass(
  courseClass: CourseClass,
  template: CourseTemplate | undefined,
  enrollment: CourseEnrollment | undefined,
  userId: string
) {
  const viewerRole = courseClass.teacherIds?.includes(userId)
    ? "teacher"
    : "student";

  return {
    id: courseClass.id,
    templateId: courseClass.templateId,
    templateName: template?.name || "未知課程",
    templateCode: template?.code || "N/A",
    name: courseClass.name,
    viewerRole,
    enrollmentStatus: enrollment?.status || null,
    status: courseClass.status,
    teachers: courseClass.teachers || [],
    startDate: courseClass.startDate,
    endDate: courseClass.endDate,
    scheduleDescription: courseClass.scheduleDescription,
    sessions: courseClass.sessions || [],
    currentSessionId: courseClass.currentSessionId,
    location: courseClass.location,
    meetingLink: courseClass.meetingLink,
    description: courseClass.description,
    attachments: courseClass.attachments || [],
    maxCapacity: courseClass.maxCapacity,
    enrollmentCount: courseClass.enrollmentCount,
    createdAt: courseClass.createdAt,
    updatedAt: courseClass.updatedAt,
  };
}

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;

  if (!userId) {
    throw createError({ statusCode: 401, message: "請先登入以查看學習中心" });
  }

  const classRepo = new CourseClassRepository();
  const enrollmentRepo = new CourseEnrollmentRepository();
  const templateRepo = new CourseTemplateRepository();

  const [participantClasses, enrollments, templates] = await Promise.all([
    classRepo.findByParticipant(userId),
    enrollmentRepo.findByUserId(userId),
    templateRepo.findAll(),
  ]);

  const enrollmentByClassId = new Map(
    enrollments
      .filter((enrollment) => enrollment.classId)
      .map((enrollment) => [enrollment.classId, enrollment])
  );

  const data = participantClasses
    .map((courseClass) =>
      toLearnClass(
        courseClass,
        templates.find((template) => template.id === courseClass.templateId),
        enrollmentByClassId.get(courseClass.id),
        userId
      )
    )
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  return { data };
});
