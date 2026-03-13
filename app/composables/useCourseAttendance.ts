import { ref } from 'vue'
import type { CourseAttendance } from '~/types/course-attendance'

export const useCourseAttendance = () => {
  const isSubmitting = ref(false)

  const submitAttendance = async (qrCodePayload: string) => {
    isSubmitting.value = true
    try {
      const data = await $fetch<CourseAttendance>('/api/courses/attendances', {
        method: 'POST',
        body: { payload: qrCodePayload }
      })
      return data
    } finally {
      isSubmitting.value = false
    }
  }

  const getAttendanceQrCode = async (classId: string, sessionId: string) => {
    return $fetch<{ qrCode: string }>(`/api/courses/classes/${classId}/sessions/${sessionId}/qrcode`)
  }

  return {
    isSubmitting,
    submitAttendance,
    getAttendanceQrCode
  }
}
