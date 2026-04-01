import { ref } from 'vue'
import type { CourseClass, CreateCourseClassPayload } from '~/types/course-class'

export const useCourseClass = () => {
  const isCreating = ref(false)
  const isLoading = ref(false)

  const fetchClasses = async (filters?: any) => {
    isLoading.value = true
    try {
      const { data } = await $fetch<{ data: any[] }>('/api/courses/classes', {
        query: filters
      })
      return data
    } finally {
      isLoading.value = false
    }
  }

  const fetchClassById = async (id: string) => {
    isLoading.value = true
    try {
      const { data } = await $fetch<{ data: CourseClass & { templateName: string, templateCode: string } }>(`/api/courses/classes/${id}`)
      return data
    } finally {
      isLoading.value = false
    }
  }

  const fetchClassStudents = async (classId: string) => {
    const { data } = await $fetch<{ data: any[] }>(`/api/courses/classes/${classId}/students`)
    return data
  }

  const fetchTeachers = async () => {
    const { data } = await $fetch<{ data: { id: string; name: string }[] }>('/api/courses/classes/teachers')
    return data
  }

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

  const updateClass = async (id: string, payload: any, forceOverride = false) => {
    isCreating.value = true
    try {
      const data = await $fetch<CourseClass>(`/api/courses/classes/${id}`, {
        method: 'PUT',
        body: { ...payload, forceOverride }
      })
      return data
    } finally {
      isCreating.value = false
    }
  }

  return {
    isCreating,
    isLoading,
    fetchClasses,
    fetchClassById,
    fetchClassStudents,
    fetchTeachers,
    createClass,
    updateClass,
    startCourse,
    concludeCourse
  }
}
