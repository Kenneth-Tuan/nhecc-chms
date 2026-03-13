/**
 * 課程報名/修課紀錄型別定義
 */

export type CourseEnrollmentStatus = 
  | 'PENDING_WAITLIST' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'COMPLETED' 
  | 'DROPPED'

export interface CourseEnrollment {
  id: string
  userId: string
  templateId: string
  classId: string | null
  status: CourseEnrollmentStatus
  credits: number
  createdAt: string
  updatedAt: string
}

export type CreateCourseEnrollmentPayload = Omit<CourseEnrollment, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCourseEnrollmentPayload = Partial<CreateCourseEnrollmentPayload>
