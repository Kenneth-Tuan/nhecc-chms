import type {
  CourseClass,
  CreateCourseClassPayload,
  UpdateCourseClassPayload,
} from '~/types/course-class'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseClasses'

export class CourseClassRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  async findAll(): Promise<CourseClass[]> {
    const snapshot = await this.col.get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseClass))
  }

  async findById(id: string): Promise<CourseClass | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseClass
  }

  async findByTeacher(teacherId: string): Promise<CourseClass[]> {
    const snapshot = await this.col.where('teacherIds', 'array-contains', teacherId).get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseClass))
  }

  async create(payload: CreateCourseClassPayload): Promise<CourseClass> {
    const now = new Date().toISOString()
    const data = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await this.col.add(data)
    return { ...data, id: ref.id } as CourseClass
  }

  async update(id: string, payload: UpdateCourseClassPayload): Promise<CourseClass | undefined> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return undefined

    const updateData = { ...payload, updatedAt: new Date().toISOString() }
    await ref.update(updateData)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseClass
  }
}
