/**
 * 課程出缺席紀錄型別定義
 */

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'EXCUSED'

export interface CourseAttendance {
  id: string
  classId: string
  sessionId: string
  userId: string
  status: AttendanceStatus
  scannedAt: string | null
  scannedBy: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCourseAttendancePayload = Omit<CourseAttendance, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCourseAttendancePayload = Partial<CreateCourseAttendancePayload>
