import { CourseEnrollmentRepository } from '../repositories/courseEnrollment.repository'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { createError } from 'h3'
import type { CourseEnrollment } from '~/types/course-enrollment'

const enrollmentRepo = new CourseEnrollmentRepository()
const templateRepo = new CourseTemplateRepository()

export class CourseEnrollmentService {
  async joinWaitlist(userId: string, templateId: string): Promise<CourseEnrollment> {
    const template = await templateRepo.findById(templateId)
    if (!template) {
      throw createError({ statusCode: 404, message: '找不到該課程模板' })
    }

    // TODO: Check prerequisites (擋修條件) here in the future
    
    // Check if already enrolled or in waitlist
    const existing = await enrollmentRepo.findByUserIdAndTemplateId(userId, templateId)
    if (existing) {
      throw createError({ statusCode: 400, message: '您已經報名或在等候名單中' })
    }

    return enrollmentRepo.create({
      userId,
      templateId,
      classId: null,
      status: 'PENDING_WAITLIST',
      credits: 0
    })
  }
}
