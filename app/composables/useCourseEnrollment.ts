import { ref } from 'vue'
import type { CourseEnrollment } from '~/types/course-enrollment'

export const useCourseEnrollment = () => {
  const isJoining = ref(false)

  const joinWaitlist = async (templateId: string) => {
    isJoining.value = true
    try {
      const data = await $fetch<CourseEnrollment>('/api/courses/enrollments/waitlist', {
        method: 'POST',
        body: { templateId }
      })
      return data
    } finally {
      isJoining.value = false
    }
  }

  const assignStudents = async (classId: string, enrollmentIds: string[]) => {
    return $fetch('/api/courses/classes/assign', {
      method: 'POST',
      body: { classId, enrollmentIds }
    })
  }

  return {
    isJoining,
    joinWaitlist,
    assignStudents
  }
}
