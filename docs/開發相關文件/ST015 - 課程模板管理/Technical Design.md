# ST015 - 課程模板管理 Technical Design

## 1. 檔案結構

```
app/
├── types/
│   └── course.ts                          # 所有課程相關型別定義
├── schemas/
│   └── course.schema.ts                   # Zod 驗證 schema
├── pages/
│   └── dashboard/
│       └── courses/
│           └── templates/
│               ├── index.vue              # 列表頁
│               ├── create.vue             # 建立頁
│               └── [id].vue              # 編輯頁
├── components/
│   └── course/
│       ├── TemplateForm.vue              # 建立/編輯共用表單
│       ├── TemplateTable.vue             # 列表 DataTable
│       └── PrerequisiteSelect.vue        # 擋修條件選擇器（組合下拉）
└── composables/
    ├── useCourseTemplates.ts             # 模板 CRUD composable
    └── useCourseCategories.ts            # 分類設定表 composable

server/
├── api/
│   ├── courses/
│   │   └── templates/
│   │       ├── index.get.ts              # GET /api/courses/templates
│   │       ├── index.post.ts             # POST /api/courses/templates
│   │       ├── [id].get.ts              # GET /api/courses/templates/:id
│   │       ├── [id].put.ts              # PUT /api/courses/templates/:id
│   │       └── [id]/
│   │           └── status.patch.ts       # PATCH /api/courses/templates/:id/status
│   └── course-categories/
│       ├── index.get.ts                  # GET /api/course-categories
│       ├── index.post.ts                 # POST /api/course-categories
│       ├── [id].put.ts                  # PUT /api/course-categories/:id
│       └── [id].delete.ts              # DELETE /api/course-categories/:id
├── services/
│   ├── courseTemplate.service.ts
│   └── courseCategory.service.ts
└── repositories/
    ├── courseTemplate.repository.ts
    └── courseCategory.repository.ts
```

---

## 2. 型別定義

**檔案：`app/types/course.ts`**

```typescript
/**
 * 課程相關型別定義 (ST015)
 */

/** 授課方式 */
export type CourseFormat =
  | 'LARGE_GROUP'    // 大班制
  | 'SMALL_GROUP'    // 小班制
  | 'ONE_ON_ONE'     // 一對一（同伴者）
  | 'CORPORATE'      // 團體制
  | 'VIDEO_LARGE'    // 影片 / 大班制
  | 'YT_CORPORATE'   // YT 團體制
  | 'OUTREACH'       // 短宣 / 團體出擊

/** 開課頻率 */
export type FrequencyType =
  | 'MONTHLY'             // 每月一次
  | 'TWICE_YEARLY'        // 一年兩次
  | 'YEARLY'              // 一年一次
  | 'ONE_TO_TWICE_YEARLY' // 一年一到兩次
  | 'AS_PLANNED'          // 隨教會行事曆安排
  | 'IRREGULAR'           // 不定期

/** 擋修條件類型 */
export type PrerequisiteType = 'COURSE' | 'STATUS'

/** 擋修條件 */
export interface Prerequisite {
  type: PrerequisiteType
  /** type=COURSE: 課程代號 (e.g. 'S101') | type=STATUS: 系統 key (e.g. 'BAPTISED') */
  value: string
}

/** 系統固定狀態條件（前端 hardcode） */
export const SYSTEM_STATUS_CONDITIONS = [
  { type: 'STATUS' as const, value: 'BAPTISED',    label: '需已受洗' },
  { type: 'STATUS' as const, value: 'IS_NEWCOMER', label: '需為新進教友' },
] satisfies Array<Prerequisite & { label: string }>

/** 課程時間類型 */
export type DurationType = 'WEEKLY' | 'EVENT'

/** 預計花費時間 */
export interface CourseDuration {
  type: DurationType
  /** type=WEEKLY 時：總週數 */
  weeks?: number
  /** type=EVENT 時：每次小時數 */
  hoursPerSession?: number
}

/** 課程教材附件 */
export interface CourseAttachment {
  name: string
  url: string
  size?: number
  mimeType?: string
  uploadedAt: string // ISO string
}

/** 課程模板狀態 */
export type CourseTemplateStatus = 'ACTIVE' | 'INACTIVE'

/** 意願登記日期範圍 */
export interface RegistrationDateRange {
  start: string // ISO date string
  end: string
}

/** 課程模板 (Firestore document) */
export interface CourseTemplate {
  id: string
  name: string
  code: string
  categoryIds: string[]
  format?: CourseFormat
  prerequisites: Prerequisite[]
  estimatedDuration?: CourseDuration
  frequency?: FrequencyType
  attachments: CourseAttachment[]
  syllabus?: string
  registrationDateRange?: RegistrationDateRange
  status: CourseTemplateStatus
  /** 是否已有關聯（學生登記 or 被設為擋修條件）—— 若為 true，code 不可修改 */
  hasAssociations: boolean
  createdAt: string
  updatedAt: string
}

/** 課程分類 */
export interface CourseCategory {
  id: string
  name: string
  order: number
  description?: string
}

// ───── Payload 型別 ─────

export type CreateCourseTemplatePayload = Omit<
  CourseTemplate,
  'id' | 'hasAssociations' | 'createdAt' | 'updatedAt'
>

export type UpdateCourseTemplatePayload = Partial<
  Omit<CourseTemplate, 'id' | 'code' | 'hasAssociations' | 'createdAt' | 'updatedAt'>
> & {
  /** code 僅在 hasAssociations=false 時允許更新 */
  code?: string
}

export interface CourseTemplateListItem {
  id: string
  name: string
  code: string
  categoryIds: string[]
  format?: CourseFormat
  status: CourseTemplateStatus
  hasAssociations: boolean
  frequency?: FrequencyType
  prerequisiteCount: number
}

export interface CourseTemplateFilters {
  search?: string
  status?: CourseTemplateStatus | 'all'
  categoryId?: string
}

export type CreateCourseCategoryPayload = Omit<CourseCategory, 'id'>
export type UpdateCourseCategoryPayload = Partial<CreateCourseCategoryPayload>
```

---

## 3. Zod Schema

**檔案：`app/schemas/course.schema.ts`**

```typescript
/**
 * 課程模板 Zod 驗證 Schema (ST015)
 */
import { z } from 'zod'

const prerequisiteSchema = z.object({
  type: z.enum(['COURSE', 'STATUS']),
  value: z.string().min(1),
})

const courseDurationSchema = z.object({
  type: z.enum(['WEEKLY', 'EVENT']),
  weeks: z.number().int().positive().optional(),
  hoursPerSession: z.number().positive().optional(),
})

const courseAttachmentSchema = z.object({
  name: z.string().min(1),
  url: z.string().url(),
  size: z.number().optional(),
  mimeType: z.string().optional(),
  uploadedAt: z.string(),
})

const registrationDateRangeSchema = z.object({
  start: z.string(),
  end: z.string(),
}).refine((v) => new Date(v.start) <= new Date(v.end), {
  message: '開始日期不可晚於結束日期',
  path: ['end'],
})

export const createCourseTemplateSchema = z.object({
  name: z.string().min(1, '課程名稱為必填').max(100),
  code: z
    .string()
    .min(1, '課程代號為必填')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, '課程代號只能包含大寫英文、數字與連字號'),
  categoryIds: z.array(z.string()).default([]),
  format: z.enum([
    'LARGE_GROUP', 'SMALL_GROUP', 'ONE_ON_ONE',
    'CORPORATE', 'VIDEO_LARGE', 'YT_CORPORATE', 'OUTREACH',
  ]).optional(),
  prerequisites: z.array(prerequisiteSchema).default([]),
  estimatedDuration: courseDurationSchema.optional(),
  frequency: z.enum([
    'MONTHLY', 'TWICE_YEARLY', 'YEARLY',
    'ONE_TO_TWICE_YEARLY', 'AS_PLANNED', 'IRREGULAR',
  ]).optional(),
  attachments: z.array(courseAttachmentSchema).default([]),
  syllabus: z.string().optional(),
  registrationDateRange: registrationDateRangeSchema.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const updateCourseTemplateSchema = createCourseTemplateSchema.partial()

export const courseTemplateFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'all']).default('all'),
  categoryId: z.string().optional(),
})

export const createCourseCategorySchema = z.object({
  name: z.string().min(1, '分類名稱為必填').max(50),
  order: z.number().int().nonnegative().default(0),
  description: z.string().max(200).optional(),
})

export const updateCourseCategorySchema = createCourseCategorySchema.partial()

// 型別推導
export type CreateCourseTemplateInput = z.infer<typeof createCourseTemplateSchema>
export type UpdateCourseTemplateInput = z.infer<typeof updateCourseTemplateSchema>
export type CourseTemplateFiltersInput = z.infer<typeof courseTemplateFiltersSchema>
export type CreateCourseCategoryInput = z.infer<typeof createCourseCategorySchema>
export type UpdateCourseCategoryInput = z.infer<typeof updateCourseCategorySchema>
```

---

## 4. Repository 層

### 4.1 CourseTemplateRepository

**檔案：`server/repositories/courseTemplate.repository.ts`**

```typescript
import type {
  CourseTemplate,
  CourseTemplateFilters,
  CreateCourseTemplatePayload,
  UpdateCourseTemplatePayload,
} from '~/types/course'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseTemplates'

export class CourseTemplateRepository {
  private get db() { return getAdminFirestore() }
  private get col() { return this.db.collection(COLLECTION) }

  async findAll(filters?: CourseTemplateFilters): Promise<CourseTemplate[]> {
    let query: any = this.col

    if (filters?.status && filters.status !== 'all') {
      query = query.where('status', '==', filters.status)
    }
    if (filters?.categoryId) {
      query = query.where('categoryIds', 'array-contains', filters.categoryId)
    }

    const snapshot = await query.orderBy('code').get()
    let results = snapshot.docs.map((doc: any) => ({
      ...doc.data(),
      id: doc.id,
    })) as CourseTemplate[]

    // 記憶體模糊搜尋（Firestore 不支援原生模糊搜尋）
    if (filters?.search) {
      const term = filters.search.toLowerCase()
      results = results.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.code.toLowerCase().includes(term),
      )
    }

    return results
  }

  async findById(id: string): Promise<CourseTemplate | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseTemplate
  }

  async findByCode(code: string): Promise<CourseTemplate | undefined> {
    const snapshot = await this.col.where('code', '==', code).limit(1).get()
    if (snapshot.empty) return undefined
    const doc = snapshot.docs[0]
    return { ...doc.data(), id: doc.id } as CourseTemplate
  }

  /** 是否有任何模板以此 code 為擋修條件 */
  async isUsedAsPrerequisite(code: string): Promise<boolean> {
    // prerequisites 為 Prerequisite[] 物件陣列，無法直接 array-contains
    // 在記憶體中過濾
    const all = await this.findAll()
    return all.some((t) =>
      t.prerequisites.some((p) => p.type === 'COURSE' && p.value === code),
    )
  }

  async create(payload: CreateCourseTemplatePayload): Promise<CourseTemplate> {
    const now = new Date().toISOString()
    const data = {
      ...payload,
      hasAssociations: false,
      createdAt: now,
      updatedAt: now,
    }
    const ref = await this.col.add(data)
    return { ...data, id: ref.id }
  }

  async update(
    id: string,
    payload: UpdateCourseTemplatePayload,
  ): Promise<CourseTemplate | undefined> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return undefined

    const updateData = { ...payload, updatedAt: new Date().toISOString() }
    await ref.update(updateData)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseTemplate
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<boolean> {
    const ref = this.col.doc(id)
    const doc = await ref.get()
    if (!doc.exists) return false
    await ref.update({ status, updatedAt: new Date().toISOString() })
    return true
  }

  async markHasAssociations(id: string): Promise<void> {
    await this.col.doc(id).update({
      hasAssociations: true,
      updatedAt: new Date().toISOString(),
    })
  }
}
```

### 4.2 CourseCategoryRepository

**檔案：`server/repositories/courseCategory.repository.ts`**

```typescript
import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'
import { getAdminFirestore } from '../utils/firebase-admin'

const COLLECTION = 'courseCategories'

export class CourseCategoryRepository {
  private get db() { return getAdminFirestore() }
  private get col() { return this.db.collection(COLLECTION) }

  async findAll(): Promise<CourseCategory[]> {
    const snapshot = await this.col.orderBy('order').get()
    return snapshot.docs.map((doc: any) => ({ ...doc.data(), id: doc.id })) as CourseCategory[]
  }

  async findById(id: string): Promise<CourseCategory | undefined> {
    const doc = await this.col.doc(id).get()
    if (!doc.exists) return undefined
    return { ...doc.data(), id: doc.id } as CourseCategory
  }

  async create(payload: CreateCourseCategoryPayload): Promise<CourseCategory> {
    const ref = await this.col.add(payload)
    return { ...payload, id: ref.id }
  }

  async update(
    id: string,
    payload: UpdateCourseCategoryPayload,
  ): Promise<CourseCategory | undefined> {
    const ref = this.col.doc(id)
    if (!(await ref.get()).exists) return undefined
    await ref.update(payload)
    const updated = await ref.get()
    return { ...updated.data(), id: updated.id } as CourseCategory
  }

  async delete(id: string): Promise<boolean> {
    const ref = this.col.doc(id)
    if (!(await ref.get()).exists) return false
    await ref.delete()
    return true
  }
}
```

---

## 5. Service 層

### 5.1 CourseTemplateService

**檔案：`server/services/courseTemplate.service.ts`**

```typescript
import type {
  CourseTemplate,
  CourseTemplateListItem,
  CourseTemplateFilters,
  CreateCourseTemplatePayload,
  UpdateCourseTemplatePayload,
} from '~/types/course'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { createError } from 'h3'

const templateRepo = new CourseTemplateRepository()

export class CourseTemplateService {
  async list(filters: CourseTemplateFilters): Promise<CourseTemplateListItem[]> {
    const templates = await templateRepo.findAll(filters)
    return templates.map((t) => ({
      id: t.id,
      name: t.name,
      code: t.code,
      categoryIds: t.categoryIds,
      format: t.format,
      status: t.status,
      hasAssociations: t.hasAssociations,
      frequency: t.frequency,
      prerequisiteCount: t.prerequisites.length,
    }))
  }

  async getById(id: string): Promise<CourseTemplate> {
    const template = await templateRepo.findById(id)
    if (!template) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }
    return template
  }

  async create(payload: CreateCourseTemplatePayload): Promise<CourseTemplate> {
    // 確保 code 大寫
    payload.code = payload.code.toUpperCase()

    // 唯一性檢查
    const existing = await templateRepo.findByCode(payload.code)
    if (existing) {
      throw createError({ statusCode: 409, message: `課程代號 ${payload.code} 已存在` })
    }

    return templateRepo.create(payload)
  }

  async update(
    id: string,
    payload: UpdateCourseTemplatePayload,
  ): Promise<CourseTemplate> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }

    // code 變更保護
    if (payload.code && payload.code !== existing.code) {
      if (existing.hasAssociations) {
        throw createError({
          statusCode: 400,
          message: '此課程已有關聯資料，無法修改課程代號',
        })
      }
      // 確保新 code 唯一
      payload.code = payload.code.toUpperCase()
      const codeConflict = await templateRepo.findByCode(payload.code)
      if (codeConflict && codeConflict.id !== id) {
        throw createError({ statusCode: 409, message: `課程代號 ${payload.code} 已存在` })
      }
    }

    const updated = await templateRepo.update(id, payload)
    if (!updated) {
      throw createError({ statusCode: 500, message: '更新失敗' })
    }
    return updated
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<void> {
    const existing = await templateRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程模板' })
    }
    await templateRepo.updateStatus(id, status)
  }

  /**
   * 驗證學生是否滿足課程擋修條件
   * @param templateId - 目標課程模板 ID
   * @param memberCompletedCodes - 學生已修畢的課程代號清單
   * @param memberStatus - 學生的系統狀態欄位
   */
  async checkPrerequisites(
    templateId: string,
    memberCompletedCodes: string[],
    memberStatus: { isBaptised: boolean; isNewcomer: boolean },
  ): Promise<{ passed: boolean; failedPrerequisites: string[] }> {
    const template = await this.getById(templateId)
    const failed: string[] = []

    for (const prereq of template.prerequisites) {
      if (prereq.type === 'COURSE') {
        if (!memberCompletedCodes.includes(prereq.value)) {
          failed.push(prereq.value)
        }
      } else if (prereq.type === 'STATUS') {
        if (prereq.value === 'BAPTISED' && !memberStatus.isBaptised) {
          failed.push('需已受洗')
        }
        if (prereq.value === 'IS_NEWCOMER' && !memberStatus.isNewcomer) {
          failed.push('需為新進教友')
        }
      }
    }

    return { passed: failed.length === 0, failedPrerequisites: failed }
  }
}
```

### 5.2 CourseCategoryService

**檔案：`server/services/courseCategory.service.ts`**

```typescript
import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'
import { CourseCategoryRepository } from '../repositories/courseCategory.repository'
import { CourseTemplateRepository } from '../repositories/courseTemplate.repository'
import { createError } from 'h3'

const categoryRepo = new CourseCategoryRepository()
const templateRepo = new CourseTemplateRepository()

export class CourseCategoryService {
  async list(): Promise<CourseCategory[]> {
    return categoryRepo.findAll()
  }

  async create(payload: CreateCourseCategoryPayload): Promise<CourseCategory> {
    return categoryRepo.create(payload)
  }

  async update(
    id: string,
    payload: UpdateCourseCategoryPayload,
  ): Promise<CourseCategory> {
    const existing = await categoryRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程分類' })
    }
    const updated = await categoryRepo.update(id, payload)
    if (!updated) throw createError({ statusCode: 500, message: '更新失敗' })
    return updated
  }

  async delete(id: string): Promise<void> {
    const existing = await categoryRepo.findById(id)
    if (!existing) {
      throw createError({ statusCode: 404, message: '找不到此課程分類' })
    }

    // 保護：有模板正在使用此分類時禁止刪除
    const templates = await templateRepo.findAll({ categoryId: id })
    if (templates.length > 0) {
      throw createError({
        statusCode: 409,
        message: `尚有 ${templates.length} 個課程模板使用此分類，無法刪除`,
      })
    }

    await categoryRepo.delete(id)
  }
}
```

---

## 6. API 路由層

### 6.1 課程模板

**`server/api/courses/templates/index.get.ts`**
```typescript
// GET /api/courses/templates
import { getQuery } from 'h3'
import { courseTemplateFiltersSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'view', 'Course')
  const query = getQuery(event)
  const filters = validateWithSchema(courseTemplateFiltersSchema, query)
  return service.list(filters)
})
```

**`server/api/courses/templates/index.post.ts`**
```typescript
// POST /api/courses/templates
import { readBody } from 'h3'
import { createCourseTemplateSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'create', 'Course')
  const body = await readBody(event)
  const payload = validateWithSchema(createCourseTemplateSchema, body)
  const template = await service.create(payload)
  return { success: true, data: template, message: '課程模板建立成功' }
})
```

**`server/api/courses/templates/[id].put.ts`**
```typescript
// PUT /api/courses/templates/:id
import { readBody } from 'h3'
import { updateCourseTemplateSchema } from '~/schemas/course.schema'
import { CourseTemplateService } from '../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../utils/validation'

const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'update', 'Course')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const payload = validateWithSchema(updateCourseTemplateSchema, body)
  const template = await service.update(id, payload)
  return { success: true, data: template, message: '課程模板更新成功' }
})
```

**`server/api/courses/templates/[id]/status.patch.ts`**
```typescript
// PATCH /api/courses/templates/:id/status
import { readBody } from 'h3'
import { z } from 'zod'
import { CourseTemplateService } from '../../../../services/courseTemplate.service'
import { requireAbility, validateWithSchema } from '../../../../utils/validation'

const statusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })
const service = new CourseTemplateService()

export default defineEventHandler(async (event) => {
  requireAbility(event, 'update', 'Course')
  const id = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const { status } = validateWithSchema(statusSchema, body)
  await service.updateStatus(id, status)
  return { success: true, message: '狀態更新成功' }
})
```

---

## 7. 前端 Composable

**檔案：`app/composables/useCourseTemplates.ts`**

```typescript
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
```

**檔案：`app/composables/useCourseCategories.ts`**

```typescript
import type {
  CourseCategory,
  CreateCourseCategoryPayload,
  UpdateCourseCategoryPayload,
} from '~/types/course'

export function useCourseCategories() {
  const list = () => $fetch<CourseCategory[]>('/api/course-categories')

  const create = (payload: CreateCourseCategoryPayload) =>
    $fetch<CourseCategory>('/api/course-categories', {
      method: 'POST',
      body: payload,
    })

  const update = (id: string, payload: UpdateCourseCategoryPayload) =>
    $fetch<CourseCategory>(`/api/course-categories/${id}`, {
      method: 'PUT',
      body: payload,
    })

  const remove = (id: string) =>
    $fetch(`/api/course-categories/${id}`, { method: 'DELETE' })

  return { list, create, update, remove }
}
```

---

## 8. 前端關鍵元件設計

### 8.1 PrerequisiteSelect.vue

擋修條件選擇器，組合「系統固定條件」與「現有課程模板」清單：

```vue
<script setup lang="ts">
import type { Prerequisite } from '~/types/course'
import { SYSTEM_STATUS_CONDITIONS } from '~/types/course'

const props = defineProps<{ modelValue: Prerequisite[] }>()
const emit = defineEmits<{ 'update:modelValue': [Prerequisite[]] }>()

const { list } = useCourseTemplates()
const { data: templates } = await useAsyncData('templates-for-prereq', () => list())

// 合併兩個來源成統一選項格式
const options = computed(() => [
  ...SYSTEM_STATUS_CONDITIONS.map((c) => ({
    ...c,
    label: c.label,
    group: '系統條件',
  })),
  ...(templates.value ?? []).map((t) => ({
    type: 'COURSE' as const,
    value: t.code,
    label: `${t.code} - ${t.name}`,
    group: '前置課程',
  })),
])

const selected = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})
</script>

<template>
  <MultiSelect
    v-model="selected"
    :options="options"
    option-label="label"
    option-group-label="group"
    option-group-children="items"
    data-key="value"
    placeholder="選擇擋修條件"
    display="chip"
    filter
  />
</template>
```

### 8.2 表單中 code 強制大寫

```vue
<InputText
  v-model="form.code"
  :disabled="template?.hasAssociations"
  @input="form.code = (form.code ?? '').toUpperCase()"
/>
```

---

## 9. RBAC 權限設定

在 CASL ability 中需新增 `Course` subject：

```typescript
// 對應到現有的 ability.ts
// 所有能管理課程的角色（教務主任、Super Admin）
can('view',   'Course')
can('create', 'Course')
can('update', 'Course')
```

---

## 10. Firebase Storage 教材上傳流程

1. 前端呼叫 `<FileUpload>` 選擇檔案
2. 前端直接上傳至 Firebase Storage（路徑：`courseTemplates/{templateId}/attachments/{filename}`）
3. 取得 download URL 後，將 `CourseAttachment` 物件 push 進表單的 `attachments` 陣列
4. 最後整體 submit 表單時，`attachments[]` 已含有完整的 URL，一起寫進 Firestore

> **注意**：Storage Security Rules 須設定只有認證用戶且具有 `course:manage` scope 才能上傳。

---

## 11. Firestore Index 需求

| Collection | Fields | 用途 |
|---|---|---|
| `courseTemplates` | `status ASC`, `code ASC` | 列表頁篩選 + 排序 |
| `courseTemplates` | `categoryIds ARRAY`, `code ASC` | 分類篩選 |
