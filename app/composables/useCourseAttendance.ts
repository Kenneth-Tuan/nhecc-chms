import { ref } from 'vue'
import type { AttendanceStatus, CourseAttendance } from '~/types/course-attendance'

interface QrCodeResponse {
  token: string
  url: string
}

interface VerifyResponse {
  valid: boolean
  expired: boolean
  className?: string
  sessionDate?: string
  classId?: string
  sessionId?: string
}

export const useCourseAttendance = () => {
  const isSubmitting = ref(false)
  const isUpdating = ref(false)

  const submitAttendance = async (token: string) => {
    isSubmitting.value = true
    try {
      return await $fetch<CourseAttendance>('/api/courses/attendances', {
        method: 'POST',
        body: { token },
      })
    } finally {
      isSubmitting.value = false
    }
  }

  const getAttendanceQrCode = async (classId: string, sessionId: string) => {
    return $fetch<QrCodeResponse>(
      `/api/courses/classes/${classId}/sessions/${sessionId}/qrcode`,
    )
  }

  const verifyAttendanceToken = async (token: string) => {
    return $fetch<VerifyResponse>(`/api/courses/attendances/verify?token=${token}`)
  }

  const fetchClassAttendance = async (classId: string, sessionId?: string) => {
    const query = sessionId ? `?sessionId=${sessionId}` : ''
    return $fetch<CourseAttendance[]>(`/api/courses/classes/${classId}/attendance${query}`)
  }

  const fetchMyAttendance = async (classId: string) => {
    return $fetch<CourseAttendance[]>(`/api/courses/classes/${classId}/attendance/mine`)
  }

  const updateAttendanceStatus = async (
    classId: string,
    attendanceId: string,
    status: AttendanceStatus,
  ) => {
    isUpdating.value = true
    try {
      return await $fetch<CourseAttendance>(
        `/api/courses/classes/${classId}/attendance/${attendanceId}`,
        { method: 'PATCH', body: { status } },
      )
    } finally {
      isUpdating.value = false
    }
  }

  return {
    isSubmitting,
    isUpdating,
    submitAttendance,
    getAttendanceQrCode,
    verifyAttendanceToken,
    fetchClassAttendance,
    fetchMyAttendance,
    updateAttendanceStatus,
  }
}
