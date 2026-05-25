/**
 * 課程模板服務 (CourseTemplate Service)
 * 處理課程模板相關操作的業務邏輯。
 */
import type {
  CourseTemplate,
  CourseTemplateListItem,
  CourseTemplateFilters,
  CreateCourseTemplatePayload,
  UpdateCourseTemplatePayload,
  CourseAttachment,
  AttachmentType,
} from '~/types/course'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { createError } from 'h3'
import { uploadCourseAttachment, deleteCourseAttachment } from '../utils/storage'


const templateRepo = new CourseTemplateRepository()

export class CourseTemplateService {
  /**
   * 取得課程模板清單。
   */
  async list(
    filters: CourseTemplateFilters,
  ): Promise<CourseTemplateListItem[]> {
    const templates = await templateRepo.findAll(filters)
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      categoryIds: t.categoryIds,
      format: t.format,
      status: t.status,
      hasAssociations: t.hasAssociations,
      frequency: t.frequency,
      prerequisiteCount: t.prerequisites.length,
    }))
  }

  /**
   * 取得單一課程模板詳情。
   */
  async getById(id: string): Promise<CourseTemplate> {
    const template = await templateRepo.findById(id)
    if (!template) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }
    return template
  }

  /**
   * 建立新課程模板。
   */
  async create(
    payload: CreateCourseTemplatePayload,
  ): Promise<CourseTemplate> {
    // 強制大寫
    payload.code = payload.code.toUpperCase()

    // 唯一性檢查
    const existing = await templateRepo.findByCode(payload.code)
    if (existing) {
      throw createError({
        statusCode: 409,
        message: `課程代號 ${payload.code} 已存在於「${existing.name}」`,
      })
    }

    return templateRepo.create(payload)
  }

  /**
   * 更新課程模板。
   */
  async update(
    id: string,
    payload: UpdateCourseTemplatePayload,
  ): Promise<CourseTemplate> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }

    // code 變更保護
    if (payload.code && payload.code !== existing.code) {
      if (existing.hasAssociations) {
        throw createError({
          statusCode: 400,
          message: '此課程已有關聯資料，無法修改課程代號',
        })
      }
      payload.code = payload.code.toUpperCase()
      const codeConflict = await templateRepo.findByCode(payload.code)
      if (codeConflict && codeConflict.id !== id) {
        throw createError({
          statusCode: 409,
          message: `課程代號 ${payload.code} 已存在於「${codeConflict.name}」`,
        })
      }
    }

    const updated = await templateRepo.update(id, payload)
    if (!updated) {
      throw createError({ statusCode: 500, message: '更新失敗' })
    }
    return updated
  }

  /**
   * 切換課程模板狀態。
   */
  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<void> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }
    await templateRepo.updateStatus(id, status)
  }

  /**
   * 驗證學生是否滿足課程擋修條件。
   */
  async checkPrerequisites(
    templateId: string,
    memberCompletedCodes: string[],
    memberStatus: { isBaptised: boolean; isNewcomer: boolean },
  ): Promise<{ passed: boolean; failedPrerequisites: string[] }> {
    const template = await this.getById(templateId)
    const failed: string[] = []

    for (const prereq of template.prerequisites) {
      if (prereq.type === 'COURSE') {
        if (!memberCompletedCodes.includes(prereq.value)) {
          failed.push(prereq.value)
        }
      } else if (prereq.type === 'STATUS') {
        if (prereq.value === 'BAPTISED' && !memberStatus.isBaptised) {
          failed.push('需已受洗')
        }
        if (prereq.value === 'IS_NEWCOMER' && !memberStatus.isNewcomer) {
          failed.push('需為新進教友')
        }
      }
    }

    return { passed: failed.length === 0, failedPrerequisites: failed }
  }

  /**
   * 新增附件到課程模板。
   */
  async addAttachment(
    id: string,
    fileBuffer: Buffer,
    mimeType: string,
    filename: string,
  ): Promise<CourseAttachment> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }

    // 檔案類型轉為 AttachmentType
    let type: AttachmentType = 'DOCUMENT'
    if (mimeType.startsWith('image/')) {
      type = 'IMAGE'
    } else if (mimeType === 'application/pdf') {
      type = 'PDF'
    }

    const fileUrl = await uploadCourseAttachment(
      fileBuffer,
      mimeType,
      id,
      filename,
    )

    const now = new Date().toISOString()
    const newAttachment: CourseAttachment = {
      name: filename,
      url: fileUrl,
      type,
      size: fileBuffer.length,
      mimeType,
      createdAt: now,
      updatedAt: now,
    }

    const currentAttachments = existing.attachments || []
    const updatedAttachments = [...currentAttachments, newAttachment]

    const updated = await templateRepo.update(id, {
      attachments: updatedAttachments,
    })

    if (!updated) {
      // 嘗試復原 Storage 檔案
      await deleteCourseAttachment(fileUrl)
      throw createError({ statusCode: 500, message: '更新課程模板附件失敗' })
    }

    return newAttachment
  }

  /**
   * 從課程模板移除附件。
   */
  async removeAttachment(id: string, fileUrl: string): Promise<void> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }

    // 1. 刪除 Storage 中的檔案
    await deleteCourseAttachment(fileUrl)

    // 2. 從 Firestore 移除該附件
    const currentAttachments = existing.attachments || []
    const updatedAttachments = currentAttachments.filter(
      (att) => att.url !== fileUrl,
    )

    const updated = await templateRepo.update(id, {
      attachments: updatedAttachments,
    })

    if (!updated) {
      throw createError({ statusCode: 500, message: '更新課程模板附件失敗' })
    }
  }
}

