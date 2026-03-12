/**
 * 課程分類儲存庫 (CourseCategory Repository)
 * 資料來源：Firestore
 */
import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseCategories'

export class CourseCategoryRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  /**
   * 查詢所有分類，依 order 排序。
   */
  async findAll(): Promise<CourseCategory[]> {
    const snapshot = await this.col.orderBy('order').get()
    return snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    })) as CourseCategory[]
  }

  /**
   * 根據 ID 查找單一分類。
   */
  async findById(id: string): Promise<CourseCategory | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseCategory
  }

  /**
   * 建立新分類。
   */
  async create(payload: CreateCourseCategoryPayload): Promise<CourseCategory> {
    const ref = await this.col.add(payload)
    return { ...payload, id: ref.id }
  }

  /**
   * 更新分類。
   */
  async update(
    id: string,
    payload: UpdateCourseCategoryPayload,
  ): Promise<CourseCategory | undefined> {
    const ref = this.col.doc(id)
    if (!(await ref.get()).exists) return undefined
    await ref.update(payload)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseCategory
  }

  /**
   * 刪除分類。
   */
  async delete(id: string): Promise<boolean> {
    const ref = this.col.doc(id)
    if (!(await ref.get()).exists) return false
    await ref.delete()
    return true
  }
}
