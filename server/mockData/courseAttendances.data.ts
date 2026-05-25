import type { CourseAttendance } from '~/types/course-attendance';

export const mockCourseAttendances: CourseAttendance[] = [
  {
    id: 'att-s201-1-li',
    classId: 'class-s201-2024fall',
    sessionId: 'sess-s201-1',
    userId: 'member-li-group',
    status: 'PRESENT',
    scannedAt: '2024-09-02T18:55:00.000Z',
    scannedBy: 'member-wang-admin',
    createdAt: '2024-09-02T19:00:00.000Z',
    updatedAt: '2024-09-02T19:00:00.000Z'
  },
  {
    id: 'att-s201-1-zhao',
    classId: 'class-s201-2024fall',
    sessionId: 'sess-s201-1',
    userId: 'member-001',
    status: 'PRESENT',
    scannedAt: '2024-09-02T18:58:00.000Z',
    scannedBy: 'member-wang-admin',
    createdAt: '2024-09-02T19:00:00.000Z',
    updatedAt: '2024-09-02T19:00:00.000Z'
  },
  {
    id: 'att-s101-1-hu',
    classId: 'class-s101-2025spring',
    sessionId: 'sess-s101-1',
    userId: 'member-053',
    status: 'PRESENT',
    scannedAt: '2025-03-01T09:50:00.000Z',
    scannedBy: 'member-chen-teacher',
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2025-03-01T10:00:00.000Z'
  },
  {
    id: 'att-s101-1-long',
    classId: 'class-s101-2025spring',
    sessionId: 'sess-s101-1',
    userId: 'member-054',
    status: 'PRESENT',
    scannedAt: '2025-03-01T09:55:00.000Z',
    scannedBy: 'member-chen-teacher',
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2025-03-01T10:00:00.000Z'
  },
  {
    id: 'att-s101-1-wan',
    classId: 'class-s101-2025spring',
    sessionId: 'sess-s101-1',
    userId: 'member-055',
    status: 'ABSENT',
    scannedAt: null,
    scannedBy: null,
    createdAt: '2025-03-01T10:00:00.000Z',
    updatedAt: '2025-03-01T10:00:00.000Z'
  }
];
