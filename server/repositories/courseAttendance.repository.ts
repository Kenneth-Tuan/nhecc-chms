import type {
  AttendanceToken,
  CourseAttendance,
  CreateCourseAttendancePayload,
  UpdateCourseAttendancePayload,
} from '~/types/course-attendance'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseAttendances'
const TOKEN_COLLECTION = 'attendanceTokens'

export class CourseAttendanceRepository {
  private get db() {
    return getAdminFirestore()
  }

  private get col() {
    return this.db.collection(COLLECTION)
  }

  private get tokenCol() {
    return this.db.collection(TOKEN_COLLECTION)
  }

  async findByClassAndSession(classId: string, sessionId: string): Promise<CourseAttendance[]> {
    const snapshot = await this.col
      .where('classId', '==', classId)
      .where('sessionId', '==', sessionId)
      .get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseAttendance))
  }

  async findByClass(classId: string): Promise<CourseAttendance[]> {
    const snapshot = await this.col
      .where('classId', '==', classId)
      .get()
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CourseAttendance))
  }

  async findByUserAndClass(userId: string, classId: string): Promise<CourseAttendance[]> {
    const snapshot = await this.col
      .where('userId', '==', userId)
      .where('classId', '==', classId)
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

  async findById(id: string): Promise<CourseAttendance | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseAttendance
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

  async update(id: string, payload: UpdateCourseAttendancePayload): Promise<CourseAttendance | undefined> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return undefined
    const updateData = { ...payload, updatedAt: new Date().toISOString() }
    await ref.update(updateData)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseAttendance
  }

  // --- Token CRUD ---

  async findTokenByClassSession(classId: string, sessionId: string): Promise<AttendanceToken | undefined> {
    const snapshot = await this.tokenCol
      .where('classId', '==', classId)
      .where('sessionId', '==', sessionId)
      .limit(1)
      .get()
    if (snapshot.empty) return undefined
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AttendanceToken
  }

  async findTokenByValue(token: string): Promise<AttendanceToken | undefined> {
    const snapshot = await this.tokenCol
      .where('token', '==', token)
      .limit(1)
      .get()
    if (snapshot.empty) return undefined
    return { ...snapshot.docs[0].data(), id: snapshot.docs[0].id } as AttendanceToken
  }

  async createToken(payload: Omit<AttendanceToken, 'id'>): Promise<AttendanceToken> {
    const ref = await this.tokenCol.add(payload)
    return { ...payload, id: ref.id }
  }
}
