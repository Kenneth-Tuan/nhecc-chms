/**
 * 課程相關型別定義 (ST015)
 */

/** 授課方式 */
export type CourseFormat =
  | 'LARGE_GROUP'
  | 'SMALL_GROUP'
  | 'ONE_ON_ONE'
  | 'CORPORATE'
  | 'VIDEO_LARGE'
  | 'YT_CORPORATE'
  | 'OUTREACH'

/** 開課頻率 */
export type FrequencyType =
  | 'MONTHLY'
  | 'TWICE_YEARLY'
  | 'YEARLY'
  | 'ONE_TO_TWICE_YEARLY'
  | 'AS_PLANNED'
  | 'IRREGULAR'

/** 擋修條件類型 */
export type PrerequisiteType = 'COURSE' | 'STATUS'

/** 擋修條件 */
export interface Prerequisite {
  type: PrerequisiteType
  /** type=COURSE: 課程代號 (e.g. 'S101') | type=STATUS: 系統 key (e.g. 'BAPTISED') */
  value: string
}

/** 系統固定狀態條件（前端 hardcode） */
export const SYSTEM_STATUS_CONDITIONS = [
  { type: 'STATUS' as const, value: 'BAPTISED', label: '需已受洗' },
  { type: 'STATUS' as const, value: 'IS_NEWCOMER', label: '需為新進教友' },
] satisfies Array<Prerequisite & { label: string }>

/** 課程時間類型 */
export type DurationType = 'WEEKLY' | 'EVENT'

/** 預計花費時間 */
export interface CourseDuration {
  type: DurationType
  /** type=WEEKLY 時：總週數 */
  weeks?: number
  /** type=EVENT 時：每次小時數 */
  hoursPerSession?: number
}

/** 課程教材附件 */
export interface CourseAttachment {
  name: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt: string
}

/** 課程模板狀態 */
export type CourseTemplateStatus = 'ACTIVE' | 'INACTIVE'

/** 意願登記日期範圍 */
export interface RegistrationDateRange {
  start: string
  end: string
}

/** 課程模板 (Firestore document) */
export interface CourseTemplate {
  id: string
  name: string
  code: string
  categoryIds: string[]
  format?: CourseFormat
  prerequisites: Prerequisite[]
  estimatedDuration?: CourseDuration
  frequency?: FrequencyType
  attachments: CourseAttachment[]
  syllabus?: string
  registrationDateRange?: RegistrationDateRange
  status: CourseTemplateStatus
  hasAssociations: boolean
  createdAt: string
  updatedAt: string
}

/** 課程分類 */
export interface CourseCategory {
  id: string
  name: string
  order: number
  description?: string
}

// ───── Payload 型別 ─────

export type CreateCourseTemplatePayload = Omit<
  CourseTemplate,
  'id' | 'hasAssociations' | 'createdAt' | 'updatedAt'
>

export type UpdateCourseTemplatePayload = Partial<
  Omit<
    CourseTemplate,
    'id' | 'code' | 'hasAssociations' | 'createdAt' | 'updatedAt'
  >
> & {
  code?: string
}

export interface CourseTemplateListItem {
  id: string
  name: string
  code: string
  categoryIds: string[]
  format?: CourseFormat
  status: CourseTemplateStatus
  hasAssociations: boolean
  frequency?: FrequencyType
  prerequisiteCount: number
}

export interface CourseTemplateFilters {
  search?: string
  status?: CourseTemplateStatus | 'all'
  categoryId?: string
}

export type CreateCourseCategoryPayload = Omit<CourseCategory, 'id'>
export type UpdateCourseCategoryPayload = Partial<CreateCourseCategoryPayload>

/** 授課方式選項（前端 hardcode） */
export const COURSE_FORMAT_OPTIONS: Array<{
  value: CourseFormat
  label: string
}> = [
  { value: 'LARGE_GROUP', label: '大班制' },
  { value: 'SMALL_GROUP', label: '小班制' },
  { value: 'ONE_ON_ONE', label: '一對一（同伴者）' },
  { value: 'CORPORATE', label: '團體制' },
  { value: 'VIDEO_LARGE', label: '影片 / 大班制' },
  { value: 'YT_CORPORATE', label: 'YT 團體制' },
  { value: 'OUTREACH', label: '短宣 / 團體出擊' },
]

/** 開課頻率選項（前端 hardcode） */
export const FREQUENCY_OPTIONS: Array<{
  value: FrequencyType
  label: string
}> = [
  { value: 'MONTHLY', label: '每月一次' },
  { value: 'TWICE_YEARLY', label: '一年兩次' },
  { value: 'YEARLY', label: '一年一次' },
  { value: 'ONE_TO_TWICE_YEARLY', label: '一年一到兩次' },
  { value: 'AS_PLANNED', label: '隨教會行事曆安排' },
  { value: 'IRREGULAR', label: '不定期' },
]

/** 預計時間類型選項（前端 hardcode） */
export const DURATION_TYPE_OPTIONS: Array<{
  value: DurationType
  label: string
}> = [
  { value: 'WEEKLY', label: '週期課程' },
  { value: 'EVENT', label: '單次活動' },
]
