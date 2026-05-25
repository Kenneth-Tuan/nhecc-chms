import type { CourseClass } from '~/types/course-class';

export const mockCourseClasses: CourseClass[] = [
  {
    id: 'class-s101-2025spring',
    templateId: 'tpl-s101',
    name: '2025年春季啟發課程',
    teachers: [{ id: 'member-chen-teacher', name: '陳詩恩' }],
    teacherIds: ['member-chen-teacher'],
    status: 'IN_PROGRESS',
    startDate: '2025-03-01',
    endDate: '2025-05-31',
    scheduleDescription: '每週六 10:00 - 12:00',
    sessions: [
      { sessionId: 'sess-s101-1', startTime: '2025-03-01T10:00:00.000Z', endTime: '2025-03-01T12:00:00.000Z' },
      { sessionId: 'sess-s101-2', startTime: '2025-03-08T10:00:00.000Z', endTime: '2025-03-08T12:00:00.000Z' },
      { sessionId: 'sess-s101-3', startTime: '2025-03-15T10:00:00.000Z', endTime: '2025-03-15T12:00:00.000Z' }
    ],
    currentSessionId: 'sess-s101-3',
    location: '副堂A',
    description: '歡迎新朋友與初信者參加，一同探索信仰與生命。',
    attachments: [
      {
        name: '啟發手冊 - 第一週講義',
        url: 'https://example.com/course-material/S101/1',
        type: 'LINK',
        source: 'template',
        createdAt: '2025-01-15T08:00:00.000Z',
        updatedAt: '2025-01-15T08:00:00.000Z'
      }
    ],
    maxCapacity: 30,
    enrollmentCount: 3,
    isPublished: true,
    studentIds: ['member-053', 'member-054', 'member-055'],
    createdAt: '2025-02-15T08:00:00.000Z',
    updatedAt: '2025-02-15T08:00:00.000Z'
  },
  {
    id: 'class-s104-2025q2',
    templateId: 'tpl-s104',
    name: '2025年第二季如何QT班',
    teachers: [{ id: 'member-chen-teacher', name: '陳詩恩' }],
    teacherIds: ['member-chen-teacher'],
    status: 'SETUP',
    startDate: '2025-06-01',
    endDate: '2025-06-01',
    scheduleDescription: '週日 14:00 - 16:00 (單次課程)',
    sessions: [
      { sessionId: 'sess-s104-1', startTime: '2025-06-01T14:00:00.000Z', endTime: '2025-06-01T16:00:00.000Z' }
    ],
    currentSessionId: null,
    location: '教室101',
    description: '教導如何進行每日QT默想，與神建立更親密的關係。',
    attachments: [
      {
        name: '每日嗎哪讀經指引',
        url: 'https://example.com/course-material/S104/1',
        type: 'LINK',
        source: 'template',
        createdAt: '2025-01-15T08:00:00.000Z',
        updatedAt: '2025-01-15T08:00:00.000Z'
      }
    ],
    maxCapacity: 50,
    enrollmentCount: 2,
    isPublished: true,
    studentIds: ['member-058', 'member-059'],
    createdAt: '2025-05-10T08:00:00.000Z',
    updatedAt: '2025-05-10T08:00:00.000Z'
  },
  {
    id: 'class-s201-2024fall',
    templateId: 'tpl-s201',
    name: '2024年秋季聖經綜覽',
    teachers: [{ id: 'member-chen-teacher', name: '陳詩恩' }],
    teacherIds: ['member-chen-teacher'],
    status: 'COMPLETED',
    startDate: '2024-09-01',
    endDate: '2024-11-30',
    scheduleDescription: '每週一 19:00 - 21:00',
    sessions: [
      { sessionId: 'sess-s201-1', startTime: '2024-09-02T19:00:00.000Z', endTime: '2024-09-02T21:00:00.000Z' }
    ],
    currentSessionId: null,
    location: '主堂',
    description: '系統性概覽新舊約聖經，建立紮實的聖經真理根基。',
    attachments: [
      {
        name: '新舊約聖經導讀手冊',
        url: 'https://example.com/course-material/S201/1',
        type: 'LINK',
        source: 'template',
        createdAt: '2025-01-15T08:00:00.000Z',
        updatedAt: '2025-01-15T08:00:00.000Z'
      }
    ],
    maxCapacity: 40,
    enrollmentCount: 2,
    isPublished: true,
    studentIds: ['member-li-group', 'member-001'],
    createdAt: '2024-08-01T08:00:00.000Z',
    updatedAt: '2024-11-30T08:00:00.000Z'
  }
];
