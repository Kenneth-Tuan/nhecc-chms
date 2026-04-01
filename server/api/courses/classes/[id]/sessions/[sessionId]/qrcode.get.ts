import { CourseAttendanceService } from '~/../server/services/courseAttendance.service'

const attendanceService = new CourseAttendanceService()

export default defineEventHandler(async (event) => {
  const userContext = event.context.user
  if (!userContext) {
    throw createError({ statusCode: 401, message: '未授權' })
  }

  const classId = getRouterParam(event, "id");
  const sessionId = getRouterParam(event, "sessionId");

  if (!classId || !sessionId) {
    throw createError({
      statusCode: 400,
      message: "缺少 classId 或 sessionId",
    });
  }

  const qrCode = await attendanceService.generateAttendanceQrCode(
    classId,
    sessionId,
    userContext.userId,
  );
  
  return { qrCode }
})
