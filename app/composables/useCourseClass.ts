import { ref } from 'vue'
import type { CourseClass, CreateCourseClassPayload } from '~/types/course-class'

export const useCourseClass = () => {
  const isCreating = ref(false)

  const createClass = async (payload: CreateCourseClassPayload, forceOverride = false) => {
    isCreating.value = true
    try {
      const data = await $fetch<CourseClass>('/api/courses/classes', {
        method: 'POST',
        body: { ...payload, forceOverride }
      })
      return data
    } finally {
      isCreating.value = false
    }
  }

  const startCourse = async (classId: string) => {
    return $fetch<CourseClass>(`/api/courses/classes/${classId}/start`, { method: 'POST' })
  }

  const concludeCourse = async (classId: string) => {
    return $fetch<CourseClass>(`/api/courses/classes/${classId}/conclude`, { method: 'POST' })
  }

  return {
    isCreating,
    createClass,
    startCourse,
    concludeCourse
  }
}
