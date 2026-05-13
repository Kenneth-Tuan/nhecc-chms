import { CourseClassRepository } from "../../../repositories/courseClass.repository";
import { CourseEnrollmentRepository } from "../../../repositories/courseEnrollment.repository";
import { CourseTemplateRepository } from "../../../repositories/courseTemplate.repository";

export default defineEventHandler(async (event) => {
  const userId = event.context.userId;
  const classId = getRouterParam(event, "id");

  if (!userId) {
    throw createError({ statusCode: 401, message: "請先登入以查看課程詳情" });
  }

  if (!classId) {
    throw createError({ statusCode: 400, message: "缺少班級 ID" });
  }

  const classRepo = new CourseClassRepository();
  const enrollmentRepo = new CourseEnrollmentRepository();
  const templateRepo = new CourseTemplateRepository();

  const [courseClass, enrollments] = await Promise.all([
    classRepo.findById(classId),
    enrollmentRepo.findByUserId(userId),
  ]);

  if (!courseClass) {
    throw createError({ statusCode: 404, message: "找不到此班級" });
  }

  const enrollment = enrollments.find((item) => item.classId === classId);
  const isTeacher = courseClass.teacherIds?.includes(userId);
  const isStudent =
    courseClass.studentIds?.includes(userId) || enrollment?.classId === classId;

  if (!isTeacher && !isStudent) {
    throw createError({ statusCode: 403, message: "您無權查看此課程" });
  }

  const template = await templateRepo.findById(courseClass.templateId);

  return {
    data: {
      id: courseClass.id,
      templateId: courseClass.templateId,
      templateName: template?.name || "未知課程",
      templateCode: template?.code || "N/A",
      templateSyllabus: template?.syllabus || "",
      name: courseClass.name,
      viewerRole: isTeacher ? "teacher" : "student",
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
    },
  };
});
