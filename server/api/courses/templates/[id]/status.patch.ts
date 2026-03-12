/**
 * PATCH /api/courses/templates/:id/status
 * 切換課程模板狀態。
 */
import { readBody } from 'h3'
import { z } from 'zod'
import { CourseTemplateService } from '../../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../../utils/validation'

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })
const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'update', 'Course')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { status } = validateWithSchema(statusSchema, body)
  await service.updateStatus(id, status)
  return { success: true, message: '狀態更新成功' }
})
