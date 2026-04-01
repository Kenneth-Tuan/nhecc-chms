/**
 * 實體班級相關型別定義
 */

import type {
  CourseAttachment as BaseAttachment,
  AttachmentType,
} from "./course";

export type CourseClassStatus = "SETUP" | "IN_PROGRESS" | "COMPLETED";

export interface ClassSession {
  sessionId: string;
  startTime: string; // ISO 8601 string
  endTime: string; // ISO 8601 string
}

export interface CourseTeacher {
  id: string;
  name: string;
}

/**
 * 班級專用的附件型別：繼承基礎屬性並加入業務來源
 */
export interface ClassAttachment extends BaseAttachment {
  /**
   * 標記來源：
   * 'template' - 代表是從範本繼承來的
   * 'class' - 代表是老師/管理員針對這班額外上傳的 (例如錄影)
   */
  source: "template" | "class";
}

export interface CourseClass {
  id: string;
  templateId: string;
  name: string;

  // 教師資訊 (Denormalization)
  teachers: CourseTeacher[];
  teacherIds: string[]; // 用於權限判定的老師 ID 清單

  status: CourseClassStatus;

  // 時間與進度
  startDate: string; // 開課日期
  endDate: string; // 結課日期
  scheduleDescription?: string; // 例如: "每週一 19:00 - 21:00"
  sessions: ClassSession[];
  currentSessionId: string | null;

  // 地點與連結
  location: string; // 上課地點
  meetingLink?: string; // 線上會議連結

  // 內容與資源
  description: string; // 班級簡介
  attachments: ClassAttachment[]; // 統一存放從範本繼承的講義及後續新增的資源（包含錄影）

  // 招生與管理
  maxCapacity: number; // 人數上限
  enrollmentCount: number; // 目前報名人數 (Denormalized)
  isPublished: boolean; // 是否已發佈至前台
  studentIds: string[]; // 報名成功的學員 ID 清單

  createdAt: string;
  updatedAt: string;
}

export type CreateCourseClassPayload = Omit<
  CourseClass,
  "id" | "createdAt" | "updatedAt"
>;
export type UpdateCourseClassPayload = Partial<CreateCourseClassPayload>;
