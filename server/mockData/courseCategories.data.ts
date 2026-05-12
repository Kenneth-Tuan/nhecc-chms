/**
 * Mock 課程分類 — 對應 docs/開發相關文件/S系統/courseTemplate.json 頂層階段
 */
import type { CourseCategory } from '~/types/course'

export const mockCourseCategories: CourseCategory[] = [
  {
    id: 'course-cat-s1',
    name: 'S1 生養',
    order: 1,
    description:
      '傳福音給未信者、幫助其確立基要真理，並受洗，加入教會。',
  },
  {
    id: 'course-cat-s2',
    name: 'S2 餵養',
    order: 2,
    description:
      '幫助初信者在真理上紮根、穩定靈命，並開始參與事奉及傳福音',
  },
  {
    id: 'course-cat-s3',
    name: 'S3 牧養',
    order: 3,
    description: '培養教會與小組的核心同工',
  },
  {
    id: 'course-cat-s4',
    name: 'S4 培養',
    order: 4,
    description: '領袖培訓',
  },
  {
    id: 'course-cat-elective',
    name: '選修課程',
    order: 5,
    description: '其他輔助靈命增長之專題課程',
  },
]
