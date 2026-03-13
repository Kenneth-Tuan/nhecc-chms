import { CourseClassRepository } from '../repositories/courseClass.repository'
import { CourseEnrollmentRepository } from '../repositories/courseEnrollment.repository'
import { createError } from 'h3'
import type { CourseClass, CreateCourseClassPayload, ClassSession } from '~/types/course-class'

const classRepo = new CourseClassRepository()
const enrollmentRepo = new CourseEnrollmentRepository()

export class CourseClassService {
  /**
   * 檢查老師授課時間是否衝突
   */
  async checkTeacherScheduleConflict(teacherIds: string[], newSessions: ClassSession[]): Promise<{ hasConflict: boolean, conflicts: any[] }> {
    const conflicts = []

    for (const teacherId of teacherIds) {
      const activeClasses = await classRepo.findByTeacher(teacherId)
      const classesToCheck = activeClasses.filter(c => c.status === 'SETUP' || c.status === 'IN_PROGRESS')

      for (const existingClass of classesToCheck) {
        for (const existSession of existingClass.sessions) {
          const existStart = new Date(existSession.startTime).getTime()
          const existEnd = new Date(existSession.endTime).getTime()

          for (const newSession of newSessions) {
            const newStart = new Date(newSession.startTime).getTime()
            const newEnd = new Date(newSession.endTime).getTime()

            // Overlap condition: start1 < end2 && end1 > start2
            if (newStart < existEnd && newEnd > existStart) {
              conflicts.push({
                teacherId,
                classId: existingClass.id,
                className: existingClass.name,
                conflictSession: newSession,
                existingSession: existSession
              })
            }
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    }
  }

  /**
   * 建立班級
   */
  async createClass(payload: CreateCourseClassPayload, forceOverride = false): Promise<CourseClass> {
    const { hasConflict, conflicts } = await this.checkTeacherScheduleConflict(payload.teacherIds, payload.sessions)
    if (hasConflict && !forceOverride) {
      throw createError({ 
        statusCode: 409, 
        message: '老師授課時間衝突', 
        data: { conflicts } 
      })
    }

    return classRepo.create({
      ...payload,
      status: 'SETUP',
      currentSessionId: null
    })
  }

  /**
   * 指派學生到班級
   */
  async assignStudentsToClass(classId: string, enrollmentIds: string[]): Promise<void> {
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    for (const enrollmentId of enrollmentIds) {
      await enrollmentRepo.update(enrollmentId, {
        classId,
        status: 'ASSIGNED'
      })
    }
  }

  /**
   * 開始課程
   */
  async startCourse(classId: string, teacherId: string): Promise<CourseClass> {
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    // 這裡通常會有呼叫端的權限檢查，但雙重保險確認 teacherId
    if (!targetClass.teacherIds.includes(teacherId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師，無法開始課程' })
    }

    const updatedClass = await classRepo.update(classId, { status: 'IN_PROGRESS' })
    if (!updatedClass) {
      throw createError({ statusCode: 500, message: '更新班級狀態失敗' })
    }

    // 更新所有關聯的 Enrollments 狀態為 IN_PROGRESS
    const enrollments = await enrollmentRepo.findByClassId(classId)
    for (const enroll of enrollments) {
      if (enroll.status === 'ASSIGNED') {
        await enrollmentRepo.update(enroll.id, { status: 'IN_PROGRESS' })
      }
    }

    return updatedClass
  }

  /**
   * 結業課程
   */
  async concludeCourse(classId: string, teacherId: string): Promise<CourseClass> {
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    if (!targetClass.teacherIds.includes(teacherId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師，無法結業課程' })
    }

    const updatedClass = await classRepo.update(classId, { status: 'COMPLETED' })
    if (!updatedClass) {
      throw createError({ statusCode: 500, message: '更新班級狀態失敗' })
    }

    // 將符合資格的 CourseEnrollments 狀態更新為 COMPLETED
    const enrollments = await enrollmentRepo.findByClassId(classId)
    for (const enroll of enrollments) {
      if (enroll.status === 'IN_PROGRESS') {
        // TODO: 計算出席率與成績。目前預設為全部結業
        await enrollmentRepo.update(enroll.id, { 
          status: 'COMPLETED',
          credits: 1 // TODO: 由課程模板或班級設定決定
        })
      }
    }

    return updatedClass
  }
}
