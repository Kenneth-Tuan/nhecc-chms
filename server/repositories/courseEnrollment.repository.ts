import type {
  CourseEnrollment,
  CreateCourseEnrollmentPayload,
  UpdateCourseEnrollmentPayload,
} from '~/types/course-enrollment'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseEnrollments'

export class CourseEnrollmentRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  async findById(id: string): Promise<CourseEnrollment | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseEnrollment
  }

  async findByClassId(classId: string): Promise<CourseEnrollment[]> {
    const snapshot = await this.col.where('classId', '==', classId).get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseEnrollment))
  }

  async findByUserId(userId: string): Promise<CourseEnrollment[]> {
    const snapshot = await this.col.where('userId', '==', userId).get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseEnrollment))
  }

  async findByUserIdAndTemplateId(userId: string, templateId: string): Promise<CourseEnrollment | undefined> {
    const snapshot = await this.col
      .where('userId', '==', userId)
      .where('templateId', '==', templateId)
      .limit(1).get()
    if (snapshot.empty) return undefined
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as CourseEnrollment
  }

  async create(payload: CreateCourseEnrollmentPayload): Promise<CourseEnrollment> {
    const now = new Date().toISOString()
    const data = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await this.col.add(data)
    return { ...data, id: ref.id } as CourseEnrollment
  }

  async update(id: string, payload: UpdateCourseEnrollmentPayload): Promise<CourseEnrollment | undefined> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return undefined

    const updateData = { ...payload, updatedAt: new Date().toISOString() }
    await ref.update(updateData)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseEnrollment
  }
}
