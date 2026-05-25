import type { CourseEnrollment } from '~/types/course-enrollment';

export const mockCourseEnrollments: CourseEnrollment[] = [
  {
    id: 'enroll-s101-hu',
    userId: 'member-053',
    templateId: 'tpl-s101',
    classId: 'class-s101-2025spring',
    status: 'IN_PROGRESS',
    credits: 0,
    createdAt: '2025-02-20T08:00:00.000Z',
    updatedAt: '2025-02-20T08:00:00.000Z'
  },
  {
    id: 'enroll-s101-long',
    userId: 'member-054',
    templateId: 'tpl-s101',
    classId: 'class-s101-2025spring',
    status: 'IN_PROGRESS',
    credits: 0,
    createdAt: '2025-02-22T08:00:00.000Z',
    updatedAt: '2025-02-22T08:00:00.000Z'
  },
  {
    id: 'enroll-s101-wan',
    userId: 'member-055',
    templateId: 'tpl-s101',
    classId: 'class-s101-2025spring',
    status: 'IN_PROGRESS',
    credits: 0,
    createdAt: '2025-02-25T08:00:00.000Z',
    updatedAt: '2025-02-25T08:00:00.000Z'
  },
  {
    id: 'enroll-s104-yan',
    userId: 'member-058',
    templateId: 'tpl-s104',
    classId: 'class-s104-2025q2',
    status: 'ASSIGNED',
    credits: 0,
    createdAt: '2025-05-12T08:00:00.000Z',
    updatedAt: '2025-05-12T08:00:00.000Z'
  },
  {
    id: 'enroll-s104-hou',
    userId: 'member-059',
    templateId: 'tpl-s104',
    classId: 'class-s104-2025q2',
    status: 'ASSIGNED',
    credits: 0,
    createdAt: '2025-05-15T08:00:00.000Z',
    updatedAt: '2025-05-15T08:00:00.000Z'
  },
  {
    id: 'enroll-s201-li',
    userId: 'member-li-group',
    templateId: 'tpl-s201',
    classId: 'class-s201-2024fall',
    status: 'COMPLETED',
    credits: 1,
    createdAt: '2024-08-15T08:00:00.000Z',
    updatedAt: '2024-11-30T08:00:00.000Z'
  },
  {
    id: 'enroll-s201-zhao',
    userId: 'member-001',
    templateId: 'tpl-s201',
    classId: 'class-s201-2024fall',
    status: 'COMPLETED',
    credits: 1,
    createdAt: '2024-08-20T08:00:00.000Z',
    updatedAt: '2024-11-30T08:00:00.000Z'
  }
];
