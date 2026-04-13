import { CourseCategoryRepository } from '../repositories/courseCategory.repository'
import { CourseClassRepository } from '../repositories/courseClass.repository'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { CourseEnrollmentRepository } from '../repositories/courseEnrollment.repository'
import { MemberRepository } from '../repositories/member.repository'
import { CourseTemplateService } from './courseTemplate.service'
import { createError } from 'h3'
import type { AppAbility } from '~/utils/casl/ability'
import type { UserContext } from '~/types/auth'
import type { CourseClass, CreateCourseClassPayload, ClassSession, CourseClassStatus } from '~/types/course-class'
import type { Prerequisite } from '~/types/course'
import { filterByScope, applyScopeConstraints } from '../utils/rbac/scopes'

// Repositories are initialized lazily within methods to avoid initialization order issues

export interface CourseClassFilters {
  teacherId?: string;
  categoryId?: string;
  status?: CourseClassStatus | "all";
  search?: string;
}

export class CourseClassService {
  /**
   * 獲取發佈中的班級清單 (含模板與類別資訊)
   */
  async listPublished(): Promise<(CourseClass & { templateName: string, templateCode: string, categoryId: string, categoryName: string, prerequisites: Prerequisite[] })[]> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()
    const categoryRepo = new CourseCategoryRepository()
    
    const [classes, templates, categories] = await Promise.all([
      classRepo.findPublished(),
      templateRepo.findAll(),
      categoryRepo.findAll()
    ])

    return classes.map((c: CourseClass) => {
      const template = templates.find((t: import('~/types/course').CourseTemplate) => t.id === c.templateId)
      const categoryId = template?.categoryIds?.[0] || 'uncategorized'
      const category = categories.find((cat: any) => cat.id === categoryId)
      return {
        ...c,
        templateName: template?.name || '未知課程',
        templateCode: template?.code || 'N/A',
        categoryId,
        categoryName: category?.name || '未分類',
        prerequisites: template?.prerequisites || []
      }
    }).sort((a: any, b: any) => a.startDate.localeCompare(b.startDate))
  }

  /**
   * 根據 ID 獲取已發佈的班級 (含模板與類別資訊)
   */
  async getPublishedById(id: string): Promise<CourseClass & { templateName: string, templateCode: string, categoryId: string, categoryName: string, prerequisites: Prerequisite[] }> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()
    const categoryRepo = new CourseCategoryRepository()
    
    const targetClass = await classRepo.findById(id)
    if (!targetClass || !targetClass.isPublished) {
      throw createError({ statusCode: 404, message: '找不到此班級或課程尚未發佈' })
    }

    const template = await templateRepo.findById(targetClass.templateId)
    const allCategories = await categoryRepo.findAll()
    const categoryId = template?.categoryIds?.[0] || 'uncategorized'
    const foundCategory = allCategories.find((cat: any) => cat.id === categoryId)

    return {
      ...targetClass,
      templateName: template?.name || '未知課程',
      templateCode: template?.code || 'N/A',
      categoryId,
      categoryName: foundCategory?.name || '未分類',
      prerequisites: template?.prerequisites || []
    }
  }

  /**
   * 獲取使用者當前的報名相關狀態
   */
  async getUserEnrollmentStatus(userId: string): Promise<{ completedCodes: string[], isBaptised: boolean, isNewcomer: boolean }> {
    const memberRepo = new MemberRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    const templateRepo = new CourseTemplateRepository()

    const member = await memberRepo.findById(userId)
    if (!member) throw createError({ statusCode: 404, message: '找不到會員資料' })

    const userEnrollments = await enrollmentRepo.findByUserId(userId)
    const completedTemplateIds = userEnrollments
      .filter((e: any) => e.status === 'COMPLETED')
      .map((e: any) => e.templateId)
    
    const allTemplates = await templateRepo.findAll()
    const completedCodes = allTemplates
      .filter((t: any) => completedTemplateIds.includes(t.id))
      .map((t: any) => t.code)

    return {
      completedCodes,
      isBaptised: member.baptismStatus || false,
      isNewcomer: !member.zoneId // 如果沒有分配牧區，暫視為新進教友
    }
  }

  /**
   * 會員自主報名
   */
  async enrollUser(classId: string, userId: string): Promise<void> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    const templateService = new CourseTemplateService()
    const memberRepo = new MemberRepository()

    // 1. 取得班級與基礎校驗
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) throw createError({ statusCode: 404, message: '找不到此班級' })
    if (!targetClass.isPublished) throw createError({ statusCode: 400, message: '此課程尚未發佈，無法報名' })
    
    // 2. 檢查名額
    if (targetClass.enrollmentCount >= targetClass.maxCapacity) {
      throw createError({ statusCode: 400, message: '此班級已額滿' })
    }

    // 3. 檢查是否已報名
    if (targetClass.studentIds?.includes(userId)) {
      throw createError({ statusCode: 400, message: '您已在報名名單中' })
    }

    // 4. 檢查先修條件
    const template = await templateRepo.findById(targetClass.templateId)
    if (!template) throw createError({ statusCode: 404, message: '找不到相關課程模板' })

    const userStatus = await this.getUserEnrollmentStatus(userId)

    const { passed, failedPrerequisites } = await templateService.checkPrerequisites(
      targetClass.templateId,
      userStatus.completedCodes,
      {
        isBaptised: userStatus.isBaptised,
        isNewcomer: userStatus.isNewcomer
      }
    )

    if (!passed) {
      throw createError({ 
        statusCode: 400, 
        message: `不符合先修條件：需完成 ${failedPrerequisites.join(', ')}` 
      })
    }

    // 5. 建立 Enroll 紀錄 (自動關聯)
    await enrollmentRepo.create({
      userId,
      templateId: targetClass.templateId,
      classId: targetClass.id,
      status: 'ASSIGNED', // 直接進入已分配狀態
      credits: 0
    })

    // 6. 更新班級報名人數
    const updatedStudentIds = [...(targetClass.studentIds || []), userId]
    await classRepo.update(targetClass.id, {
      studentIds: updatedStudentIds,
      enrollmentCount: updatedStudentIds.length
    })
  }

  /**
   * 獲取班級列表 (核心權限過濾)
   */
  async list(filters: CourseClassFilters, ability: AppAbility): Promise<(CourseClass & { templateName: string, templateCode: string })[]> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()

    const [classes, templates] = await Promise.all([
      classRepo.findAll(),
      templateRepo.findAll()
    ])

    // 1. Join 模板資訊並進行基礎過濾
    const joined = classes.map(c => {
      const template = templates.find(t => t.id === c.templateId)
      return {
        ...c,
        templateName: template?.name || '未知課程',
        templateCode: template?.code || 'N/A',
        templateCategoryIds: template?.categoryIds || []
      }
    })

    // 2. 核心過濾邏輯
    let result = joined.filter(c => {
      // 權限檢查 (CASL)
      if (!ability.can('view', { ...c, __type: 'CourseClass' } as any)) {
        return false
      }

      // 老師過濾
      if (filters.teacherId && !c.teacherIds.includes(filters.teacherId)) {
        return false
      }

      // 狀態過濾
      if (filters.status && filters.status !== 'all' && c.status !== filters.status) {
        return false
      }

      // 類別過濾 (從模板層級判斷)
      if (filters.categoryId && !c.templateCategoryIds.includes(filters.categoryId)) {
        return false
      }

      // 關鍵字搜尋 (班級名稱、模板名稱、模板代碼)
      if (filters.search) {
        const s = filters.search.toLowerCase()
        const match = 
          c.name.toLowerCase().includes(s) || 
          c.templateName.toLowerCase().includes(s) || 
          c.templateCode.toLowerCase().includes(s)
        if (!match) return false
      }

      return true
    })

    return result
  }

  /**
   * 根據 ID 獲取單一班級
   */
  async getById(id: string, ability: AppAbility): Promise<CourseClass & { templateName: string, templateCode: string }> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()
    
    const targetClass = await classRepo.findById(id)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到此班級' })
    }

    // 權限檢查
    if (!ability.can('view', { ...targetClass, __type: 'CourseClass' } as any)) {
      throw createError({ statusCode: 403, message: '您無權查看此班級' })
    }

    const template = await templateRepo.findById(targetClass.templateId)
    
    return {
      ...targetClass,
      templateName: template?.name || '未知課程',
      templateCode: template?.code || 'N/A'
    }
  }

  /**
   * 獲取班級成員清單
   */
  async getClassStudents(classId: string, ability: AppAbility, ctx?: UserContext): Promise<any[]> {
    const classRepo = new CourseClassRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    const memberRepo = new MemberRepository()

    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到此班級' })
    }

    // 權限檢查 (能看班級才能看成員)
    if (!ability.can('view', { ...targetClass, __type: 'CourseClass' } as any)) {
      throw createError({ statusCode: 403, message: '您無權查看此班級成員' })
    }

    const enrollments = await enrollmentRepo.findByClassId(classId)
    
    // [資料校正機制] 
    // 如果發現 enrollments 數量與 class 的快取數量不符，自動觸發同步
    if (enrollments.length !== targetClass.enrollmentCount || 
       (targetClass.studentIds && enrollments.length !== targetClass.studentIds.length)) {
      const actualStudentIds = enrollments.map(e => e.userId).filter(Boolean) as string[]
      await classRepo.update(classId, {
        studentIds: actualStudentIds,
        enrollmentCount: actualStudentIds.length
      })
    }

    // 將 scope 條件轉換為 repository 查詢過濾條件
    // 如此一來，Group leader 只能看到自己小組的學生列表
    const scopedFilters = ctx ? applyScopeConstraints(ctx, {}) : {}
    const members = await memberRepo.findAll(scopedFilters)

    return enrollments.map((enroll: import('~/types/course-enrollment').CourseEnrollment) => {
      const member = members.find((m: import('~/types/member').Member) => m.uuid === enroll.userId)
      // 如果因為 scope filter 導致找不到該 member (例如某學生不在該小組長的小組內)
      // 可以選擇過濾掉，或者僅顯示有限資訊
      if (!member) return null

      return {
        id: enroll.id,
        userId: enroll.userId,
        name: member.fullName,
        mobile: member.mobile || '',
        status: enroll.status,
        completedDate: enroll.updatedAt
      }
    }).filter(Boolean)
  }

  /**
   * 檢查老師授課時間是否衝突
   */
  async checkTeacherScheduleConflict(teacherIds: string[], newSessions: ClassSession[], excludeClassId?: string): Promise<{ hasConflict: boolean, conflicts: any[] }> {
    const classRepo = new CourseClassRepository()
    const conflicts = []

    for (const teacherId of teacherIds) {
      const activeClasses = await classRepo.findByTeacher(teacherId)
      const classesToCheck = activeClasses.filter((c: CourseClass) => 
        (c.status === 'SETUP' || c.status === 'IN_PROGRESS') && c.id !== excludeClassId
      )

      for (const existingClass of classesToCheck) {
        for (const existSession of existingClass.sessions) {
          const existStart = new Date(existSession.startTime).getTime()
          const existEnd = new Date(existSession.endTime).getTime()

          for (const newSession of newSessions) {
            const newStart = new Date(newSession.startTime).getTime()
            const newEnd = new Date(newSession.endTime).getTime()

            // Overlap condition: start1 < end2 && end1 > start2
            if (newStart < existEnd && newEnd > existStart) {
              conflicts.push({
                teacherId,
                classId: existingClass.id,
                className: existingClass.name,
                conflictSession: newSession,
                existingSession: existSession
              })
            }
          }
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts
    }
  }

  /**
   * 建立班級
   */
  async createClass(payload: CreateCourseClassPayload, forceOverride = false): Promise<CourseClass> {
    const classRepo = new CourseClassRepository()
    const templateRepo = new CourseTemplateRepository()
    
    // 確保 teacherIds 與 teachers 物件陣列同步，用於資料庫查詢
    const teacherIds = payload.teachers?.map(t => t.id) || payload.teacherIds || [];
    const normalizedPayload = { ...payload, teacherIds };

    const { hasConflict, conflicts } = await this.checkTeacherScheduleConflict(normalizedPayload.teacherIds, normalizedPayload.sessions)
    if (hasConflict && !forceOverride) {
      throw createError({ 
        statusCode: 409, 
        message: '老師授課時間衝突', 
        data: { conflicts } 
      })
    }

    const newClass = await classRepo.create({
      ...normalizedPayload,
      status: 'SETUP',
      currentSessionId: null
    })

    // 同步更新模板狀態
    await templateRepo.markHasAssociations(payload.templateId)

    return newClass
  }

  /**
   * 更新班級
   */
  async updateClass(id: string, payload: Partial<CreateCourseClassPayload>, ability: AppAbility, forceOverride = false): Promise<CourseClass> {
    const classRepo = new CourseClassRepository()
    const targetClass = await classRepo.findById(id)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到此班級' })
    }

    // 權限檢查
    if (!ability.can('update', { ...targetClass, __type: 'CourseClass' } as any)) {
      throw createError({ statusCode: 403, message: '您無權編輯此班級' })
    }

    // 確保 teacherIds 與 teachers 同步
    const teacherIds = payload.teachers?.map(t => t.id) || payload.teacherIds || targetClass.teacherIds;
    const sessions = payload.sessions || targetClass.sessions;
    
    // 排除不應透過此路徑更新的欄位 (避免覆蓋報名狀態)
    const { studentIds: _, enrollmentCount: __, ...cleanPayload } = payload;
    const normalizedPayload = { ...cleanPayload, teacherIds };

    // 如果有提供 sessions 或 teacherIds，需要重新檢查衝突
    if (payload.sessions || payload.teachers || payload.teacherIds) {
      const { hasConflict, conflicts } = await this.checkTeacherScheduleConflict(teacherIds, sessions, id)
      if (hasConflict && !forceOverride) {
        throw createError({ 
          statusCode: 409, 
          message: '老師授課時間衝突', 
          data: { conflicts } 
        })
      }
    }

    const updated = await classRepo.update(id, normalizedPayload as any)
    if (!updated) {
      throw createError({ statusCode: 500, message: '更新班級失敗' })
    }

    return updated
  }

  /**
   * 指派學生到班級
   */
  async assignStudentsToClass(classId: string, enrollmentIds: string[]): Promise<void> {
    const classRepo = new CourseClassRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    // 更新 Enrollment 狀態與關聯
    const studentIds: string[] = [...(targetClass.studentIds || [])]
    
    for (const enrollmentId of enrollmentIds) {
      const enroll = await enrollmentRepo.findById(enrollmentId)
      if (enroll && enroll.userId) {
        await enrollmentRepo.update(enrollmentId, {
          classId,
          status: 'ASSIGNED'
        })
        if (!studentIds.includes(enroll.userId)) {
          studentIds.push(enroll.userId)
        }
      }
    }

    // 同步更新 CourseClass 中的 studentIds 陣列以利權限過濾
    await classRepo.update(classId, { 
      studentIds,
      enrollmentCount: studentIds.length 
    })
  }

  /**
   * 開始課程
   */
  async startCourse(classId: string, teacherId: string): Promise<CourseClass> {
    const classRepo = new CourseClassRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    if (!targetClass.teacherIds.includes(teacherId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師，無法開始課程' })
    }

    const updatedClass = await classRepo.update(classId, { status: 'IN_PROGRESS' })
    if (!updatedClass) {
      throw createError({ statusCode: 500, message: '更新班級狀態失敗' })
    }

    const enrollments = await enrollmentRepo.findByClassId(classId)
    for (const enroll of enrollments) {
      if (enroll.status === 'ASSIGNED') {
        await enrollmentRepo.update(enroll.id, { status: 'IN_PROGRESS' })
      }
    }

    return updatedClass
  }

  /**
   * 結業課程
   */
  async concludeCourse(classId: string, teacherId: string): Promise<CourseClass> {
    const classRepo = new CourseClassRepository()
    const enrollmentRepo = new CourseEnrollmentRepository()
    
    const targetClass = await classRepo.findById(classId)
    if (!targetClass) {
      throw createError({ statusCode: 404, message: '找不到指定的班級' })
    }

    if (!targetClass.teacherIds.includes(teacherId)) {
      throw createError({ statusCode: 403, message: '您不是此班級的老師，無法結業課程' })
    }

    const updatedClass = await classRepo.update(classId, { status: 'COMPLETED' })
    if (!updatedClass) {
      throw createError({ statusCode: 500, message: '更新班級狀態失敗' })
    }

    const enrollments = await enrollmentRepo.findByClassId(classId)
    for (const enroll of enrollments) {
      if (enroll.status === 'IN_PROGRESS') {
        await enrollmentRepo.update(enroll.id, { 
          status: 'COMPLETED',
          credits: 1
        })
      }
    }

    return updatedClass
  }

  async deleteClass(classId: string): Promise<void> {
    const classRepo = new CourseClassRepository()
    await classRepo.delete(classId)
  }
}
