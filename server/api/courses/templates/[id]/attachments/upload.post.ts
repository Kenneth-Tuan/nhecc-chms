import { readMultipartFormData } from "h3"
import { CourseTemplateService } from "../../../../../services/courseTemplate.service"
import { requireAbility } from "../../../../../utils/validation"

const service = new CourseTemplateService()
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp'
]

export default defineEventHandler(async (event) => {
  requireAbility(event, 'manage', 'CourseTemplate')
  const id = getRouterParam(event, 'id')!

  const formData = await readMultipartFormData(event)
  if (!formData) {
    throw createError({ statusCode: 400, message: '缺少上傳資料' })
  }

  const fileField = formData.find((f) => f.name === 'file')
  if (!fileField || !fileField.data) {
    throw createError({ statusCode: 400, message: '缺少檔案' })
  }

  const contentType = fileField.type || ''
  const filename = fileField.filename || 'attachment'

  // 驗證檔案類型
  if (!ACCEPTED_TYPES.includes(contentType)) {
    throw createError({
      statusCode: 400,
      message: '不支援的檔案格式，請上傳 PDF、Office 檔案或圖片格式。',
    })
  }

  // 驗證檔案大小
  if (fileField.data.length > MAX_FILE_SIZE) {
    throw createError({ statusCode: 400, message: '檔案大小不可超過 10MB' })
  }

  try {
    const attachment = await service.addAttachment(
      id,
      fileField.data,
      contentType,
      filename,
    )

    return {
      success: true,
      data: attachment,
      message: '檔案上傳成功',
    }
  } catch (error: any) {
    console.error('[Course Attachment Upload] Error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || '上傳檔案失敗',
    })
  }
})
