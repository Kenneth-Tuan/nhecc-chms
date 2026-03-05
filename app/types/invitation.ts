/**
 * 邀請制註冊流程型別定義
 */

/** 邀請實體介面 */
export interface Invitation {
  /** UUID v4，作為 Firestore doc ID */
  token: string;
  /** 預設角色 ID 陣列 */
  roleIds: string[];
  /** 是否已使用 */
  used: boolean;
  /** 使用者 Firebase Auth UID */
  usedBy?: string | null;
  /** 過期時間 ISO string */
  expiresAt: string;
  /** 建立時間 */
  createdAt: string;
  /** 建立者 userId */
  createdBy: string;
}

/** 建立邀請請求資料 */
export interface CreateInvitationPayload {
  roleIds: string[];
}

/** 邀請公開資訊 */
export interface InvitationPublicInfo {
  token: string;
  roleIds: string[];
  expiresAt: string;
  expired: boolean;
}

/** 受邀註冊請求資料 */
export interface RegisterByInvitationPayload {
  token: string;
  fullName: string;
  email: string;
  phone: string;
  password: string;
}
