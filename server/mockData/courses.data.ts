/**
 * Mock Course Data
 * Gospel and discipleship courses
 */
import type { Course } from '~/types/organization';

export const mockCourses: Course[] = [
  {
    id: 'course-alpha',
    name: '啟發課程',
    code: 'ALPHA',
    category: 'Gospel',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-happiness',
    name: '幸福小組',
    code: 'HAPPINESS',
    category: 'Gospel',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-encounter',
    name: '經歷神營會',
    code: 'ENCOUNTER',
    category: 'Gospel',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-doubt-to-faith',
    name: '從懷疑到相信',
    code: 'DTF',
    category: 'Gospel',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-new-life',
    name: '新生命課程',
    code: 'NEWLIFE',
    category: 'Discipleship',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-grow',
    name: '成長班',
    code: 'GROW',
    category: 'Discipleship',
    status: 'Active',
    createdAt: '2024-01-01T08:00:00Z',
  },
  {
    id: 'course-leadership',
    name: '領袖訓練',
    code: 'LEADER',
    category: 'Ministry',
    status: 'Active',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'course-worship',
    name: '敬拜讚美課程',
    code: 'WORSHIP',
    category: 'Ministry',
    status: 'Active',
    createdAt: '2024-02-01T08:00:00Z',
  },
  {
    id: 'course-counseling',
    name: '輔導基礎課程',
    code: 'COUNSEL',
    category: 'Other',
    status: 'Active',
    createdAt: '2024-03-01T08:00:00Z',
  },
  {
    id: 'course-bible-study',
    name: '聖經研讀班',
    code: 'BIBLE',
    category: 'Discipleship',
    status: 'Active',
    createdAt: '2024-03-01T08:00:00Z',
  },
];
