import type { AttendanceToken } from '~/types/course-attendance'

export const mockAttendanceTokens: AttendanceToken[] = [
  {
    id: 'token-s101-1',
    token: 'aabbccdd-1111-2222-3333-444455556666',
    classId: 'class-s101-2025spring',
    sessionId: 'sess-s101-1',
    createdBy: 'member-chen-teacher',
    createdAt: '2025-03-01T09:45:00.000Z',
  },
  {
    id: 'token-s201-1',
    token: 'bbccddee-2222-3333-4444-555566667777',
    classId: 'class-s201-2024fall',
    sessionId: 'sess-s201-1',
    createdBy: 'member-wang-admin',
    createdAt: '2024-09-02T18:50:00.000Z',
  },
]
