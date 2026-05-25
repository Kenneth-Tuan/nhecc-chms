import { randomUUID } from 'crypto'
import { createError } from 'h3'
import { CourseAttendanceRepository } from '../repositories/courseAttendance.repository'
import { CourseClassRepository } from '../repositories/courseClass.repository'
import type { AttendanceToken, AttendanceStatus, CourseAttendance } from '~/types/course-attendance'

const attendanceRepo = new CourseAttendanceRepository()
const classRepo = new CourseClassRepository()

export class CourseAttendanceService {

  /**
   * 產生或取回該 session 的簽到 token，回傳完整 URL
   */
  async generateAttendanceQrCode(
    classId: string,
    sessionId: string,
    teacherId: string,
    origin: string,
  ): Promise<{ token: string; url: string }> {
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    const canManage =
      targetClass.teacherIds.includes(teacherId) ||
      // CASL manage (Global scope) — 由 API handler 在 service 外驗，這裡保留教師 check
      false

    if (!canManage) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師' })
    }

    // 若同一 session 已有 token，直接回傳（冪等）
    const existing = await attendanceRepo.findTokenByClassSession(classId, sessionId)
    if (existing) {
      return { token: existing.token, url: `${origin}/attend?token=${existing.token}` }
    }

    const token = randomUUID()
    await attendanceRepo.createToken({
      token,
      classId,
      sessionId,
      createdBy: teacherId,
      createdAt: new Date().toISOString(),
    })

    return { token, url: `${origin}/attend?token=${token}` }
  }

  /**
   * 驗證 token，回傳課程摘要（公開，免登入）
   */
  async verifyToken(token: string): Promise<{
    valid: boolean
    expired: boolean
    className?: string
    sessionDate?: string
    classId?: string
    sessionId?: string
  }> {
    const tokenDoc = await attendanceRepo.findTokenByValue(token)
    if (!tokenDoc) {
      return { valid: false, expired: false }
    }

    const targetClass = await classRepo.findById(tokenDoc.classId)
    if (!targetClass) {
      return { valid: false, expired: false }
    }

    const session = targetClass.sessions.find(s => s.sessionId === tokenDoc.sessionId)
    if (!session) {
      return { valid: false, expired: false }
    }

    const expired = Date.now() > new Date(session.endTime).getTime()

    return {
      valid: true,
      expired,
      className: targetClass.name,
      sessionDate: session.startTime,
      classId: tokenDoc.classId,
      sessionId: tokenDoc.sessionId,
    }
  }

  /**
   * 學生掃碼簽到（token-based）
   */
  async submitAttendance(userId: string, token: string): Promise<CourseAttendance> {
    const tokenDoc = await attendanceRepo.findTokenByValue(token)
    if (!tokenDoc) {
      throw createError({ statusCode: 400, message: '無效的簽到 QR Code' })
    }

    const targetClass = await classRepo.findById(tokenDoc.classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    const session = targetClass.sessions.find(s => s.sessionId === tokenDoc.sessionId)
    if (!session) {
      throw createError({ statusCode: 400, message: '找不到對應的課堂' })
    }

    if (Date.now() > new Date(session.endTime).getTime()) {
      throw createError({ statusCode: 400, message: '簽到時間已過期' })
    }

    if (!targetClass.studentIds.includes(userId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的學員' })
    }

    const existing = await attendanceRepo.findByUserClassSession(userId, tokenDoc.classId, tokenDoc.sessionId)
    if (existing) {
      return existing
    }

    return attendanceRepo.create({
      classId: tokenDoc.classId,
      sessionId: tokenDoc.sessionId,
      userId,
      status: 'PRESENT',
      scannedAt: new Date().toISOString(),
      scannedBy: null,
    })
  }

  /**
   * 列出班級出席紀錄（教師/管理員）
   */
  async listAttendance(classId: string, sessionId?: string): Promise<CourseAttendance[]> {
    if (sessionId) {
      return attendanceRepo.findByClassAndSession(classId, sessionId)
    }
    return attendanceRepo.findByClass(classId)
  }

  /**
   * 取得學生自己在某班的出席紀錄
   */
  async listMyAttendance(userId: string, classId: string): Promise<CourseAttendance[]> {
    return attendanceRepo.findByUserAndClass(userId, classId)
  }

  /**
   * 修改出席狀態（教師/管理員）
   */
  async updateAttendanceStatus(
    id: string,
    status: AttendanceStatus,
    updatedBy: string,
  ): Promise<CourseAttendance> {
    const attendance = await attendanceRepo.findById(id)
    if (!attendance) {
      throw createError({ statusCode: 404, message: '找不到出席紀錄' })
    }

    const updated = await attendanceRepo.update(id, { status, scannedBy: updatedBy })
    return updated!
  }
}
