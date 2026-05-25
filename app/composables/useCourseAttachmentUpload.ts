import type { CourseAttachment } from '~/types/course'

export function useCourseAttachmentUpload() {
  const isUploading = ref(false)
  const uploadError = ref<string | null>(null)
  const uploadProgress = ref(0)

  /**
   * 上傳課程附件
   * 針對傳入的 File[] 陣列，逐一打 API 上傳到特定模板。
   */
  async function uploadAttachments(
    templateId: string,
    files: File[],
  ): Promise<CourseAttachment[]> {
    if (files.length === 0) return []

    isUploading.value = true
    uploadError.value = null
    uploadProgress.value = 0

    const uploadedAttachments: CourseAttachment[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append('file', file)

        const response = await $fetch<{ success: boolean; data: CourseAttachment; message: string }>(
          `/api/courses/templates/${templateId}/attachments/upload`,
          {
            method: 'POST',
            body: formData,
          },
        )

        if (response.success && response.data) {
          uploadedAttachments.push(response.data)
        }
      } catch (error: any) {
        console.error(`檔案 ${file.name} 上傳失敗:`, error)
        uploadError.value = `檔案 ${file.name} 上傳失敗`
        throw new Error(`檔案 ${file.name} 上傳失敗：${error.message || '伺服器錯誤'}`)
      } finally {
        uploadProgress.value = Math.round(((i + 1) / files.length) * 100)
      }
    }

    isUploading.value = false
    return uploadedAttachments
  }

  /**
   * 刪除課程附件
   * 打 API 移除特定模板的指定 URL 檔案。
   */
  async function deleteAttachment(
    templateId: string,
    attachmentUrl: string,
  ): Promise<void> {
    isUploading.value = true
    uploadError.value = null

    try {
      await $fetch(`/api/courses/templates/${templateId}/attachments/delete`, {
        method: 'POST',
        body: { url: attachmentUrl },
      })
    } catch (error: any) {
      console.error('刪除附件失敗:', error)
      uploadError.value = '刪除附件失敗，請稍後再試'
      throw new Error(`刪除附件失敗：${error.message || '伺服器錯誤'}`)
    } finally {
      isUploading.value = false
    }
  }

  return {
    isUploading,
    uploadError,
    uploadProgress,
    uploadAttachments,
    deleteAttachment,
  }
}
