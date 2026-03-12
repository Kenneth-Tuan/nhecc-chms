import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'

export function useCourseCategories() {
  const list = () => $fetch<CourseCategory[]>('/api/course-categories')

  const create = (payload: CreateCourseCategoryPayload) =>
    $fetch<{ data: CourseCategory }>('/api/course-categories', {
      method: 'POST',
      body: payload,
    })

  const update = (id: string, payload: UpdateCourseCategoryPayload) =>
    $fetch<{ data: CourseCategory }>(`/api/course-categories/${id}`, {
      method: 'PUT',
      body: payload,
    })

  const remove = (id: string) =>
    $fetch(`/api/course-categories/${id}`, { method: 'DELETE' })

  return { list, create, update, remove }
}
