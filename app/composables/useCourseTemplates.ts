import type {
  CourseTemplateListItem,
  CourseTemplate,
  CourseTemplateFilters,
  CreateCourseTemplatePayload,
  UpdateCourseTemplatePayload,
} from '~/types/course'

export function useCourseTemplates() {
  const list = (filters?: CourseTemplateFilters) =>
    $fetch<CourseTemplateListItem[]>('/api/courses/templates', {
      query: filters,
    })

  const getById = (id: string) =>
    $fetch<CourseTemplate>(`/api/courses/templates/${id}`)

  const create = (payload: CreateCourseTemplatePayload) =>
    $fetch<{ data: CourseTemplate }>('/api/courses/templates', {
      method: 'POST',
      body: payload,
    })

  const update = (id: string, payload: UpdateCourseTemplatePayload) =>
    $fetch<{ data: CourseTemplate }>(`/api/courses/templates/${id}`, {
      method: 'PUT',
      body: payload,
    })

  const updateStatus = (id: string, status: 'ACTIVE' | 'INACTIVE') =>
    $fetch(`/api/courses/templates/${id}/status`, {
      method: 'PATCH',
      body: { status },
    })

  return { list, getById, create, update, updateStatus }
}
