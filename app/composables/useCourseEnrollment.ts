import type { CourseEnrollment } from "~/types/course-enrollment";

export const useCourseEnrollment = () => {
  const isJoining = ref(false);

  const joinWaitlist = async (templateId: string) => {
    isJoining.value = true;
    try {
      const data = await $fetch<CourseEnrollment>(
        "/api/courses/enrollments/waitlist",
        {
          method: "POST",
          body: { templateId },
        }
      );
      return data;
    } finally {
      isJoining.value = false;
    }
  };

  const assignStudents = async (classId: string, enrollmentIds: string[]) => {
    return $fetch("/api/courses/classes/assign", {
      method: "POST",
      body: { classId, enrollmentIds },
    });
  };

  const fetchAssignableMembers = async (classId: string) => {
    const res = await $fetch<{ data: { userId: string; fullName: string; mobile: string }[] }>(
      `/api/courses/classes/${classId}/assignable-members`,
      { method: "GET" }
    );
    return res.data;
  };

  const adminAssignStudents = async (classId: string, userIds: string[]) => {
    return $fetch(`/api/courses/classes/${classId}/assign-members`, {
      method: "POST",
      body: { userIds },
    });
  };

  return {
    isJoining,
    joinWaitlist,
    assignStudents,
    fetchAssignableMembers,
    adminAssignStudents,
  };
};
