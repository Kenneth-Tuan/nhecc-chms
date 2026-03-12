/**
 * 課程分類服務 (CourseCategory Service)
 * 處理課程分類相關操作的業務邏輯。
 */
import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'
import { CourseCategoryRepository } from '../repositories/courseCategory.repository'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { createError } from 'h3'

const categoryRepo = new CourseCategoryRepository()
const templateRepo = new CourseTemplateRepository()

export class CourseCategoryService {
  /**
   * 取得所有課程分類。
   */
  async list(): Promise<CourseCategory[]> {
    return categoryRepo.findAll()
  }

  /**
   * 建立新課程分類。
   */
  async create(
    payload: CreateCourseCategoryPayload,
  ): Promise<CourseCategory> {
    return categoryRepo.create(payload)
  }

  /**
   * 更新課程分類。
   */
  async update(
    id: string,
    payload: UpdateCourseCategoryPayload,
  ): Promise<CourseCategory> {
    const existing = await categoryRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程分類' })
    }
    const updated = await categoryRepo.update(id, payload)
    if (!updated) {
      throw createError({ statusCode: 500, message: '更新失敗' })
    }
    return updated
  }

  /**
   * 刪除課程分類（有模板使用中時禁止刪除）。
   */
  async delete(id: string): Promise<void> {
    const existing = await categoryRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程分類' })
    }

    // 保護：有模板正在使用此分類時禁止刪除
    const templates = await templateRepo.findAll({ categoryId: id })
    if (templates.length > 0) {
      throw createError({
        statusCode: 409,
        message: `尚有 ${templates.length} 個課程模板使用此分類，無法刪除`,
      })
    }

    await categoryRepo.delete(id)
  }
}
