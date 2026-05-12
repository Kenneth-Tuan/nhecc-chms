/**
 * Mock 課程模板 — 依 docs/開發相關文件/S系統/courseTemplate.json 轉成 CourseTemplate
 */
import type {
  CourseDuration,
  CourseFormat,
  CourseTemplate,
  FrequencyType,
  Prerequisite,
} from '~/types/course'

const CREATED = '2025-01-15T08:00:00.000Z'
const UPDATED = '2025-01-15T08:00:00.000Z'

const CAT = {
  S1: 'course-cat-s1',
  S2: 'course-cat-s2',
  S3: 'course-cat-s3',
  S4: 'course-cat-s4',
  ELECTIVE: 'course-cat-elective',
} as const

/** S2/S3 擋修用：以各階最末堂當「完成 S1 / S2」的課程代號錨點 */
const CODE_LAST_S1 = 'S105'
const CODE_LAST_S2 = 'S206'

const PRE: Record<string, Prerequisite[]> = {
  newcomer: [{ type: 'STATUS', value: 'IS_NEWCOMER' }],
  baptisedAfterS1: [
    { type: 'STATUS', value: 'BAPTISED' },
    { type: 'COURSE', value: CODE_LAST_S1 },
  ],
  baptisedAfterS2: [
    { type: 'STATUS', value: 'BAPTISED' },
    { type: 'COURSE', value: CODE_LAST_S2 },
  ],
  none: [],
}

function materialLinks(
  code: string,
  material: string[],
): CourseTemplate['attachments'] {
  return material.map((name, i) => ({
    name,
    url: `https://example.com/course-material/${code}/${i + 1}`,
    type: 'LINK' as const,
    createdAt: CREATED,
    updatedAt: UPDATED,
  }))
}

function formatFromCourseType(courseType: string): CourseFormat | undefined {
  const t = courseType.trim()
  if (!t) return undefined
  if (t.includes('大班')) return 'LARGE_GROUP'
  if (t.includes('小班')) return 'SMALL_GROUP'
  if (t.includes('一對一/一對多')) return 'ONE_ON_ONE'
  if (t.startsWith('一對一')) return 'ONE_ON_ONE'
  if (t.includes('YT')) return 'YT_CORPORATE'
  if (t.includes('團體出擊')) return 'OUTREACH'
  if (t.includes('影片')) return 'VIDEO_LARGE'
  if (t.includes('團體')) return 'CORPORATE'
  if (t.includes('福音小組')) return 'SMALL_GROUP'
  return undefined
}

function frequencyFromSchedule(schedule: string): FrequencyType | undefined {
  const s = schedule.trim().toLowerCase()
  if (!s) return undefined
  if (s.includes('per month')) return 'MONTHLY'
  if (s.includes('1～2') || s.includes('1-2')) return 'ONE_TO_TWICE_YEARLY'
  if (s.includes('2 times') || s.includes('2 tims')) return 'TWICE_YEARLY'
  if (s.includes('1 time') && s.includes('per year')) return 'YEARLY'
  if (s.includes('隨時') || s.includes('per season')) return 'AS_PLANNED'
  return undefined
}

function estimatedDurationFromText(
  duration: string,
): CourseDuration | undefined {
  const d = duration.trim()
  if (!d) return undefined

  const rangeW = d.match(/(\d+)\s*[～~]\s*(\d+)\s*w/i)
  if (rangeW) {
    return {
      type: 'WEEKLY',
      weeks: Math.max(parseInt(rangeW[1], 10), parseInt(rangeW[2], 10)),
    }
  }
  const singleW = d.match(/(\d+)\s*w/i)
  if (singleW) return { type: 'WEEKLY', weeks: parseInt(singleW[1], 10) }

  if (/1次\s*2\s*hrs?/i.test(d) || /1次2小時/i.test(d)) {
    return { type: 'EVENT', hoursPerSession: 2 }
  }
  if (/2次\s*2\s*hrs?/i.test(d)) {
    return { type: 'EVENT', hoursPerSession: 2 }
  }
  if (/6\s*or\s*12/i.test(d)) {
    return { type: 'WEEKLY', weeks: 12 }
  }
  return undefined
}

function syllabusBlock(input: {
  stageName: string
  courseType: string
  goal: string
  schedule: string
  prerequisite: string
  material: string[]
}): string {
  const mat =
    input.material.length > 0
      ? input.material.map((m) => `- ${m}`).join('\n')
      : '- （原檔未列教材）'
  return [
    `【階段】${input.stageName}`,
    '',
    '【課程目標】',
    input.goal || '（原檔未填）',
    '',
    '【S 系統原檔 — 授課型態】',
    input.courseType || '（未指定）',
    '',
    '【教材清單】',
    mat,
    '',
    '【開課節奏 / 備註】',
    input.schedule || '（原檔未填）',
    '',
    '【先修條件（文件原文）】',
    input.prerequisite || '（原檔未填）',
  ].join('\n')
}

type Row = {
  id: string
  code: string
  name: string
  categoryId: (typeof CAT)[keyof typeof CAT]
  stageName: string
  courseType: string
  material: string[]
  goal: string
  duration: string
  prerequisite: string
  schedule: string
  prerequisites: Prerequisite[]
  format?: CourseFormat
  frequency?: FrequencyType
}

function rowToTemplate(r: Row): CourseTemplate {
  const fmt = r.format ?? formatFromCourseType(r.courseType)
  const freq = r.frequency ?? frequencyFromSchedule(r.schedule)
  const est = estimatedDurationFromText(r.duration)
  return {
    id: r.id,
    name: r.name,
    code: r.code,
    categoryIds: [r.categoryId],
    format: fmt,
    prerequisites: r.prerequisites,
    estimatedDuration: est,
    frequency: freq,
    attachments: materialLinks(r.code, r.material),
    syllabus: syllabusBlock({
      stageName: r.stageName,
      courseType: r.courseType,
      goal: r.goal,
      schedule: r.schedule,
      prerequisite: r.prerequisite,
      material: r.material,
    }),
    status: 'ACTIVE',
    hasAssociations: false,
    createdAt: CREATED,
    updatedAt: UPDATED,
  }
}

const ROWS: Row[] = [
  {
    id: 'tpl-s101',
    code: 'S101',
    name: '啟發/幸福小組',
    categoryId: CAT.S1,
    stageName: 'S1 生養',
    courseType: '福音小組',
    material: ['啟發影片', '幸福信息'],
    goal: '接觸未信者的前端平台/認識耶穌並接受耶穌為生命的救主',
    duration: '12～13w',
    prerequisite: '慕道/新加入教會',
    schedule: '',
    prerequisites: PRE.newcomer,
  },
  {
    id: 'tpl-s102',
    code: 'S102',
    name: '抉擇之路（上）',
    categoryId: CAT.S1,
    stageName: 'S1 生養',
    courseType: '一對一/一對多',
    material: ['抉擇之路（上）'],
    goal: '認識耶穌並接受耶穌為生命的救主',
    duration: '6w',
    prerequisite: '慕道/新加入教會',
    schedule: '小組內隨時進行',
    prerequisites: PRE.newcomer,
  },
  {
    id: 'tpl-s103',
    code: 'S103',
    name: '信仰造就手冊（洗禮課）',
    categoryId: CAT.S1,
    stageName: 'S1 生養',
    courseType: '一對一/一對多',
    material: ['信仰造就手冊'],
    goal: '了解與遵行基要真理，願意加入教會與小組。',
    duration: '12w',
    prerequisite: '慕道/新加入教會',
    schedule: '小組內隨時進行',
    prerequisites: PRE.newcomer,
  },
  {
    id: 'tpl-s104',
    code: 'S104',
    name: '如何QT/每日嗎哪',
    categoryId: CAT.S1,
    stageName: 'S1 生養',
    courseType: '大班制',
    material: ['每日嗎哪', '聖經', '初信者>標竿人生42天+馬可福音'],
    goal: '教導慕道友或初信者如何建立個人與神的關係，學習默想和禱告。',
    duration: '1次2hrs',
    prerequisite: '慕道/新加入教會',
    schedule: '1 time / per season',
    prerequisites: PRE.newcomer,
  },
  {
    id: 'tpl-s105',
    code: 'S105',
    name: '遇見神營會1',
    categoryId: CAT.S1,
    stageName: 'S1 生養',
    courseType: '團體制',
    material: [
      '預備手冊',
      '棄絕偶像',
      '七個釋放禱告',
      '六個生命破口',
      '天父的愛（楊道諾牧師）',
      '饒恕的大能（楊道諾牧師）',
      '真理',
      '被聖靈充滿',
    ],
    goal: '遇見神，關閉生命破口與拆除舊有的黑暗權勢，開始新生活、被聖靈充滿',
    duration: '2週個人預備+2次禱告會+2天1夜營會',
    prerequisite: '慕道/新加入教會/已受洗尚未參加過營會者',
    schedule: '2 times / per year',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-s201',
    code: 'S201',
    name: '聖經綜覽',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: '大班制',
    material: ['新舊約'],
    goal: '介紹聖經藍圖，幫助弟兄姊妹有效地閱讀聖經',
    duration: '1次2hrs',
    prerequisite: '1. 想了解聖經、有意願者 2. 完成 S1 3. 已受洗',
    schedule: '2 times / per year',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s202',
    code: 'S202',
    name: '一對一（同伴者）',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: '一對一',
    material: ['輪子生活'],
    goal: '建立初信者清楚的基督徒生活觀並以耶穌基督為中心的生活',
    duration: '16w',
    prerequisite: '1. 已受洗 2. 完成 S1',
    schedule: '2 times / per year',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s203',
    code: 'S203',
    name: '如何進行一對一陪讀',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: '大班制',
    material: ['聖經', '抉擇之路', '初信造就手冊'],
    goal: '幫助初信者能以陪讀的方式陪伴他人相信耶穌',
    duration: '1次2hrs',
    prerequisite: '1. 已受洗 2. 完成 S1',
    schedule: '2 times / per year',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s204',
    code: 'S204',
    name: '禱告課程1',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: 'YT團體制',
    material: ['楊道諾牧師《求主教導我們禱告》'],
    goal: '幫助初信者清楚禱告的基本真理，並操練禱告。',
    duration: '6 or 12課',
    prerequisite: '1. 已受洗 2. 完成 S1',
    schedule: '1～2 times / per year',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s205',
    code: 'S205',
    name: '短宣（本地）',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: '團體出擊',
    material: ['參加福音爆發'],
    goal: '實踐福音第一線接觸',
    duration: '1次2hrs',
    prerequisite: '1. 已受洗 2. 完成 S1',
    schedule: '1 time / per month',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s206',
    code: 'S206',
    name: '遇見神營會2',
    categoryId: CAT.S2,
    stageName: 'S2 餵養',
    courseType: '團體制',
    material: ['性格測驗', '恩賜調查', '人生腳本測驗'],
    goal: '幫助初信者在此遇見神，認識自己的性格，與同工美好配搭、認識自己的恩賜，並破除人生重複的謊言。',
    duration: '2週個人預備+2次禱告會+2天1夜營會',
    prerequisite: '1. 已受洗 2. 完成 S1',
    schedule: '2 times / per year',
    prerequisites: PRE.baptisedAfterS1,
  },
  {
    id: 'tpl-s301',
    code: 'S301',
    name: '宣教基礎課程 2',
    categoryId: CAT.S3,
    stageName: 'S3 牧養',
    courseType: '影片+團體討論',
    material: ['大樹牧師錄製影片', '討論提綱'],
    goal: '進階宣教訓練，涵蓋跨文化宣教等概念',
    duration: '2次2hrs',
    prerequisite: '1. 已受洗 2. 完成 S2',
    schedule: '1 time / per year',
    prerequisites: PRE.baptisedAfterS2,
  },
  {
    id: 'tpl-s302',
    code: 'S302',
    name: '短宣（國內外）',
    categoryId: CAT.S3,
    stageName: 'S3 牧養',
    courseType: '團體出擊',
    material: ['參加短宣隊'],
    goal: '實踐福音第一線接觸',
    duration: '',
    prerequisite: '1. 已受洗 2. 完成 S2',
    schedule: '1～2 times / per year',
    prerequisites: PRE.baptisedAfterS2,
  },
  {
    id: 'tpl-s303',
    code: 'S303',
    name: '一對一（養育班）',
    categoryId: CAT.S3,
    stageName: 'S3 牧養',
    courseType: '一對一養育者小組實習與督導',
    material: ['1. 輪子生活', '2. 養育者指南'],
    goal: '培養能夠帶領一對一同伴者訓練的導師。此階段著重於操練與實用性。',
    duration: '16～18w',
    prerequisite: '1. 已受洗 2. 完成 S2',
    schedule: '2 tims / per year',
    prerequisites: PRE.baptisedAfterS2,
  },
  {
    id: 'tpl-s304',
    code: 'S304',
    name: '禱告課程 2',
    categoryId: CAT.S3,
    stageName: 'S3 牧養',
    courseType: 'YT團體制',
    material: ['楊道諾牧師《求主教導我們的家禱告》'],
    goal: '幫助同工清楚為家庭禱告的真理，並操練為家庭禱告征戰，守住各人的家',
    duration: '6 or 12 課',
    prerequisite: '1. 已受洗 2. 完成 S2',
    schedule: '1～2 times / per year',
    prerequisites: PRE.baptisedAfterS2,
  },
  {
    id: 'tpl-s305',
    code: 'S305',
    name: '幸福大學上',
    categoryId: CAT.S3,
    stageName: 'S3 牧養',
    courseType: '小班制',
    material: ['幸福大學上（改版）'],
    goal: '訓練小組同工成為啟發/幸福小組帶領者或小組實習同工',
    duration: '12w',
    prerequisite: '1. 已受洗 2. 完成 S2',
    schedule: '1 time / per year',
    prerequisites: PRE.baptisedAfterS2,
  },
  {
    id: 'tpl-s401',
    code: 'S401',
    name: '短宣（國內外）',
    categoryId: CAT.S4,
    stageName: 'S4 培養',
    courseType: '團體出擊',
    material: [],
    goal: '參與海內外具挑戰性的宣教活動，被差派。',
    duration: '',
    prerequisite: '',
    schedule: '1～2 times / per year',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-s402',
    code: 'S402',
    name: '好牧人營會',
    categoryId: CAT.S4,
    stageName: 'S4 培養',
    courseType: '團體制',
    material: [],
    goal: '服事領袖與牧人。',
    duration: '2週個人預備+2次禱告會+2天1夜營會',
    prerequisite: '現有與培訓中的牧養領袖',
    schedule: '1 time / per year',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-s403',
    code: 'S403',
    name: '禱告課程 3',
    categoryId: CAT.S4,
    stageName: 'S4 培養',
    courseType: 'YT團體制',
    material: ['楊道諾牧師《求主教導我們的教會禱告》'],
    goal: '幫助同工清楚為教會禱告的真理，並操練為教會禱告征戰',
    duration: '6 or 12 課',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-s404',
    code: 'S404',
    name: '領袖力/小組長訓練',
    categoryId: CAT.S4,
    stageName: 'S4 培養',
    courseType: '團體制',
    material: [],
    goal: '',
    duration: '1次2hrs',
    prerequisite: '',
    schedule: '1 time / per year',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e01',
    code: 'E01',
    name: '<選>抉擇之路(下)',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '一對一/一對多',
    material: ['抉擇之路(下)'],
    goal: '認識耶穌並接受耶穌為生命的救主',
    duration: '6w',
    prerequisite:
      '已上完前述課程但還未信主，須持續跟進者，可使用此材料繼續跟進。',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e02',
    code: 'E02',
    name: '<選>事工訓練',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '各事工決定',
    material: [
      '控台',
      '影音媒體',
      '招待',
      '敬拜團',
      '兒童',
      '青少年',
      '幼兒',
      '悠活',
    ],
    goal: '幫助弟兄姊妹進入服事，共同建造教會!',
    duration: '',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e03',
    code: 'E03',
    name: '<選>家庭相關課程',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '',
    material: ['個人覺察', '主前再立約', '家長課程', '婚姻'],
    goal: '',
    duration: '',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e04',
    code: 'E04',
    name: '<選>醫治釋放訓練課程+營會',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '',
    material: ['劉興本牧師訓練材料'],
    goal: '',
    duration: '',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e05',
    code: 'E05',
    name: '<選>屬靈爭戰',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '',
    material: [],
    goal: '',
    duration: '',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
  {
    id: 'tpl-e06',
    code: 'E06',
    name: '<電影>The Forge鑄鐵爐?',
    categoryId: CAT.ELECTIVE,
    stageName: '選修課程',
    courseType: '',
    material: [],
    goal: '',
    duration: '',
    prerequisite: '',
    schedule: '',
    prerequisites: PRE.none,
  },
]

export const mockCourseTemplates: CourseTemplate[] = ROWS.map(rowToTemplate)
