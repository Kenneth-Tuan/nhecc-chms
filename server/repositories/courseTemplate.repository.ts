/**
 * 課程模板儲存庫 (CourseTemplate Repository)
 * 資料來源：Firestore
 */
import type {
  CourseTemplate,
  CourseTemplateFilters,
  CreateCourseTemplatePayload,
  UpdateCourseTemplatePayload,
} from '~/types/course'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseTemplates'

export class CourseTemplateRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  /**
   * 查詢所有課程模板，支援狀態與分類篩選。
   */
  async findAll(filters?: CourseTemplateFilters): Promise<CourseTemplate[]> {
    let query: any = this.col

    if (filters?.status && filters.status !== 'all') {
      query = query.where('status', '==', filters.status)
    }
    if (filters?.categoryId) {
      query = query.where('categoryIds', 'array-contains', filters.categoryId)
    }

    const snapshot = await query.orderBy('code').get()
    let results = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    })) as CourseTemplate[]

    // 記憶體模糊搜尋
    if (filters?.search) {
      const term = filters.search.toLowerCase()
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.code.toLowerCase().includes(term),
      )
    }

    return results
  }

  /**
   * 根據 ID 查找單一課程模板。
   */
  async findById(id: string): Promise<CourseTemplate | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseTemplate
  }

  /**
   * 根據課程代號查找模板（用於唯一性檢查）。
   */
  async findByCode(code: string): Promise<CourseTemplate | undefined> {
    const snapshot = await this.col.where('code', '==', code).limit(1).get()
    if (snapshot.empty) return undefined
    const doc = snapshot.docs[0]
    return { ...doc.data(), id: doc.id } as CourseTemplate
  }

  /**
   * 檢查某課程代號是否被其他模板設為擋修條件。
   */
  async isUsedAsPrerequisite(code: string): Promise<boolean> {
    const all = await this.findAll()
    return all.some((t) =>
      t.prerequisites.some((p) => p.type === 'COURSE' && p.value === code),
    )
  }

  /**
   * 建立新課程模板。
   */
  async create(payload: CreateCourseTemplatePayload): Promise<CourseTemplate> {
    const now = new Date().toISOString()
    const data = {
      ...payload,
      hasAssociations: false,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await this.col.add(data)
    return { ...data, id: ref.id }
  }

  /**
   * 更新課程模板。
   */
  async update(
    id: string,
    payload: UpdateCourseTemplatePayload,
  ): Promise<CourseTemplate | undefined> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return undefined

    const updateData = { ...payload, updatedAt: new Date().toISOString() }
    await ref.update(updateData)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseTemplate
  }

  /**
   * 切換模板狀態。
   */
  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<boolean> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return false
    await ref.update({ status, updatedAt: new Date().toISOString() })
    return true
  }

  /**
   * 標記模板已有關聯資料（code 不可再修改）。
   */
  async markHasAssociations(id: string): Promise<void> {
    await this.col.doc(id).update({
      hasAssociations: true,
      updatedAt: new Date().toISOString(),
    })
  }
}
