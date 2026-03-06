/**
 * 邀請服務 (Invitation Service)
 * 處理邀請制註冊的業務邏輯。
 */
import { v4 as uuidv4 } from "uuid";
import type {
  Invitation,
  InvitationPublicInfo,
  CreateInvitationPayload,
} from "~/types/invitation";
import { InvitationRepository } from "../repositories/invitation.repository";
import { MemberRepository } from "../repositories/member.repository";
import { getAdminAuth } from "../utils/firebase-admin";
import { createError } from "h3";

const invitationRepo = new InvitationRepository();
const memberRepo = new MemberRepository();

/** 邀請有效期：24 小時 */
const INVITATION_TTL_MS = 24 * 60 * 60 * 1000;

export class InvitationService {
  /**
   * 建立邀請。僅綁定角色 ID。
   */
  async create(
    payload: CreateInvitationPayload,
    createdBy: string,
  ): Promise<Invitation> {
    if (!payload.roleIds?.length) {
      throw createError({
        statusCode: 400,
        message: "roleIds 為必填",
      });
    }

    const token = uuidv4();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + INVITATION_TTL_MS);

    const invitation = await invitationRepo.create({
      token,
      roleIds: payload.roleIds,
      used: false,
      usedBy: null,
      expiresAt: expiresAt.toISOString(),
      createdAt: now.toISOString(),
      createdBy,
    });

    return invitation;
  }

  /**
   * 根據 token 取得邀請的公開資訊。
   */
  async getPublicInfo(token: string): Promise<InvitationPublicInfo> {
    const invitation = await invitationRepo.findByToken(token);
    if (!invitation) {
      throw createError({ statusCode: 404, message: "邀請連結不存在" });
    }

    if (invitation.used) {
      throw createError({ statusCode: 410, message: "此邀請連結已被使用" });
    }

    const expired = new Date(invitation.expiresAt) < new Date();

    return {
      token: invitation.token,
      roleIds: invitation.roleIds,
      expiresAt: invitation.expiresAt,
      expired,
    };
  }

  /**
   * 重新發送邀請（刪除舊的，建立新的，重設 24h）。
   */
  async resend(token: string, userId: string): Promise<Invitation> {
    const existing = await invitationRepo.findByToken(token);
    if (!existing) {
      throw createError({ statusCode: 404, message: "邀請連結不存在" });
    }

    if (existing.used) {
      throw createError({ statusCode: 400, message: "此邀請連結已被使用" });
    }

    // 刪除舊邀請
    await invitationRepo.delete(token);

    // 建立新邀請（同樣角色，新 token + 24h）
    return this.create({ roleIds: existing.roleIds }, userId);
  }

  /**
   * 撤銷邀請。
   */
  async revoke(token: string): Promise<void> {
    const deleted = await invitationRepo.delete(token);
    if (!deleted) {
      throw createError({ statusCode: 404, message: "邀請連結不存在" });
    }
  }

  /**
   * 列出所有邀請。
   */
  async list(): Promise<Invitation[]> {
    return invitationRepo.findAll();
  }

  /**
   * 完成受邀註冊。
   * 用戶提供自己的 fullName, email, phone, password。
   * 角色由邀請預設。
   */
  async finalizeRegistration(
    token: string,
    fullName: string,
    email: string,
    mobile: string,
    password: string,
  ): Promise<{ uid: string; customToken: string }> {
    const invitation = await invitationRepo.findByToken(token);
    if (!invitation) {
      throw createError({ statusCode: 404, message: "邀請連結不存在" });
    }

    if (invitation.used) {
      throw createError({ statusCode: 410, message: "此邀請連結已被使用" });
    }

    if (new Date(invitation.expiresAt) < new Date()) {
      throw createError({ statusCode: 410, message: "邀請連結已過期" });
    }

    // 1. 建立 Firebase Auth 帳號
    const adminAuth = getAdminAuth();
    let userRecord;
    try {
      userRecord = await adminAuth.createUser({
        email,
        password,
        displayName: fullName,
      });
    } catch (err: any) {
      if (err.code === "auth/email-already-exists") {
        throw createError({
          statusCode: 409,
          message: "此 Email 已有帳號，請直接登入",
        });
      }
      throw createError({
        statusCode: 500,
        message: "建立帳號失敗: " + err.message,
      });
    }

    const uid = userRecord.uid;

    // 2. 建立 member 記錄，角色為邀請預設
    await memberRepo.create({
      uuid: uid,
      fullName,
      gender: "Male",
      dob: "",
      email,
      mobile,
      emergencyContactName: "",
      emergencyContactRelationship: "",
      emergencyContactPhone: "",
      baptismStatus: false,
      roleIds: invitation.roleIds,
      functionalGroupIds: [],
      registrationProvider: "email",
    });

    // 3. 標記邀請為已使用
    await invitationRepo.markAsUsed(token, uid);

    // 4. 產生 custom token 供前端建立 session
    const customToken = await adminAuth.createCustomToken(uid);

    return { uid, customToken };
  }
}
