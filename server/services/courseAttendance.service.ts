import { CourseAttendanceRepository } from '../repositories/courseAttendance.repository'
import { CourseClassRepository } from '../repositories/courseClass.repository'
import { createError } from 'h3'
import type { CourseAttendance } from '~/types/course-attendance'

const attendanceRepo = new CourseAttendanceRepository()
const classRepo = new CourseClassRepository()

export class CourseAttendanceService {
  
  /**
   * 產生簽到 QR Code 內容 (Payload)
   * 實務上應該要使用 JWT 並加上過期時間，這裡暫時使用 Base64 編碼的 JSON
   */
  async generateAttendanceQrCode(classId: string, sessionId: string, teacherId: string): Promise<string> {
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    if (!targetClass.teacherIds.includes(teacherId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師' })
    }

    const payload = {
      classId,
      sessionId,
      exp: Date.now() + 5 * 60 * 1000 // 5 分鐘有效
    }

    return Buffer.from(JSON.stringify(payload)).toString('base64')
  }

  /**
   * 學生掃碼簽到
   */
  async submitAttendance(userId: string, qrCodePayload: string): Promise<CourseAttendance> {
    let payload: any
    try {
      const decoded = Buffer.from(qrCodePayload, 'base64').toString('utf-8')
      payload = JSON.parse(decoded)
    } catch (e) {
      throw createError({ statusCode: 400, message: '無效的 QR Code' })
    }

    if (!payload.classId || !payload.sessionId || !payload.exp) {
      throw createError({ statusCode: 400, message: 'QR Code 格式錯誤' })
    }

    if (Date.now() > payload.exp) {
      throw createError({ statusCode: 400, message: 'QR Code 已過期' })
    }

    // 檢查是否已簽到
    const existing = await attendanceRepo.findByUserClassSession(userId, payload.classId, payload.sessionId)
    if (existing) {
      return existing // 已經簽到過，直接回傳
    }

    return attendanceRepo.create({
      classId: payload.classId,
      sessionId: payload.sessionId,
      userId,
      status: 'PRESENT',
      scannedAt: new Date().toISOString(),
      scannedBy: null
    })
  }
}
