import type {
  CourseAttendance,
  CreateCourseAttendancePayload,
} from '~/types/course-attendance'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseAttendances'

export class CourseAttendanceRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  async findByClassAndSession(classId: string, sessionId: string): Promise<CourseAttendance[]> {
    const snapshot = await this.col
      .where('classId', '==', classId)
      .where('sessionId', '==', sessionId)
      .get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseAttendance))
  }

  async findByUserClassSession(userId: string, classId: string, sessionId: string): Promise<CourseAttendance | undefined> {
    const snapshot = await this.col
      .where('userId', '==', userId)
      .where('classId', '==', classId)
      .where('sessionId', '==', sessionId)
      .limit(1).get()
    if (snapshot.empty) return undefined
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as CourseAttendance
  }

  async create(payload: CreateCourseAttendancePayload): Promise<CourseAttendance> {
    const now = new Date().toISOString()
    const data = {
      ...payload,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await this.col.add(data)
    return { ...data, id: ref.id } as CourseAttendance
  }
}
