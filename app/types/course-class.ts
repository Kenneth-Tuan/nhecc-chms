/**
 * 實體班級相關型別定義
 */

export type CourseClassStatus = 'SETUP' | 'IN_PROGRESS' | 'COMPLETED'

export interface ClassSession {
  sessionId: string
  startTime: string // ISO 8601 string
  endTime: string   // ISO 8601 string
}

export interface CourseClass {
  id: string
  templateId: string
  name: string
  teacherIds: string[]
  status: CourseClassStatus
  sessions: ClassSession[]
  currentSessionId: string | null
  createdAt: string
  updatedAt: string
}

export type CreateCourseClassPayload = Omit<CourseClass, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateCourseClassPayload = Partial<CreateCourseClassPayload>
