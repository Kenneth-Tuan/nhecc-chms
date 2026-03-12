# ST015 - 課程模板管理 (Course Template Management) 開發與設計規格

## 1. 模組簡介

課程模板 (Course Template) 定義課程的核心屬性，包含代號、名稱、授課方式、擋修條件、課綱、附件教材等。

**開放意願登記日期範圍**存於模板層級，供學生在該區間內填寫選課意願。教務人員再依據回收名單與時段意願，另排開班時間（開班管理為後續獨立模組）。

---

## 2. 資料模型 (Data Schema)

### 2.1 CourseTemplate

| 欄位名稱 | 類型 | 必填 | 說明 |
|---|---|---|---|
| `id` | `string` | 自動 | Firestore Document ID |
| `name` | `string` | 是 | 課程名稱（例：成長班 - 基礎信仰建立）|
| `code` | `string` | 是 | 課程代號，全大寫，唯一值（例：S101）。**有任一關聯後禁止修改。** |
| `categoryIds` | `string[]` | 否 | 參照 `courseCategories` 設定表的 ID 陣列 |
| `format` | `CourseFormat` | 否 | 授課方式（見 2.2）|
| `prerequisites` | `Prerequisite[]` | 否 | 擋修條件（見 2.3），系統自動比對 |
| `estimatedDuration` | `CourseDuration` | 否 | 預計花費時間（見 2.4）|
| `frequency` | `FrequencyType` | 否 | 開課頻率（見 2.5）|
| `attachments` | `CourseAttachment[]` | 否 | 課程教材附件（見 2.6）|
| `syllabus` | `string` | 否 | 課程大綱，Rich Text HTML 格式 |
| `registrationDateRange` | `{ start: Timestamp, end: Timestamp }` | 否 | 開放意願登記的日期區間 |
| `status` | `'ACTIVE' \| 'INACTIVE'` | 是 | 課程狀態，預設 `ACTIVE` |
| `createdAt` | `Timestamp` | 自動 | 建立時間 |
| `updatedAt` | `Timestamp` | 自動 | 最後更新時間 |

---

### 2.2 CourseFormat（授課方式 Enum）

Hardcode 於前端，不建設定表。

```typescript
type CourseFormat =
  | 'LARGE_GROUP'      // 大班制
  | 'SMALL_GROUP'      // 小班制
  | 'ONE_ON_ONE'       // 一對一（同伴者）
  | 'CORPORATE'        // 團體制
  | 'VIDEO_LARGE'      // 影片 / 大班制
  | 'YT_CORPORATE'     // YT 團體制
  | 'OUTREACH'         // 短宣 / 團體出擊
```

---

### 2.3 Prerequisite（擋修條件）

選項來源合併自兩處，由前端組合成統一下拉清單：

| 來源 | type | value | 說明 |
|---|---|---|---|
| 系統固定條件（前端 hardcode）| `STATUS` | `BAPTISED` | 需已受洗 |
| 系統固定條件（前端 hardcode）| `STATUS` | `IS_NEWCOMER` | 需為新進教友 |
| 現有課程模板（API 拉取）| `COURSE` | `S101`、`M200`等 | 需已修畢該課程代號 |

```typescript
interface Prerequisite {
  type: 'COURSE' | 'STATUS'
  value: string  // 課程 code 或 STATUS key
}
```

**後端驗證邏輯：**
```
forEach prerequisite:
  if type === 'COURSE'  → 查 memberCourseHistory 中是否有修畢該 code
  if type === 'STATUS'  → 查 member.isBaptised / member.isNewcomer 對應欄位
```

---

### 2.4 CourseDuration（預計花費時間）

規範化為結構化物件，以利統計分析：

```typescript
type DurationType = 'WEEKLY' | 'EVENT'

interface CourseDuration {
  type: DurationType
  weeks?: number          // type=WEEKLY 時填，例如 12（代表 12 週）
  hoursPerSession?: number // type=EVENT 時填，例如 2（代表每次 2 小時）
}
```

範例：
- `{ type: 'WEEKLY', weeks: 12 }` → 12 週課程
- `{ type: 'EVENT', hoursPerSession: 2 }` → 單次 2 小時活動

---

### 2.5 FrequencyType（開課頻率 Enum）

```typescript
type FrequencyType =
  | 'MONTHLY'              // 每月一次
  | 'TWICE_YEARLY'         // 一年兩次
  | 'YEARLY'               // 一年一次
  | 'ONE_TO_TWICE_YEARLY'  // 一年一到兩次
  | 'AS_PLANNED'           // 隨教會行事曆安排
  | 'IRREGULAR'            // 不定期
```

---

### 2.6 CourseAttachment（課程教材附件）

教材存放於 Firebase Storage，Firestore 僅存 URL 及 metadata。

```typescript
interface CourseAttachment {
  name: string    // 顯示檔名，例如「第一章教材.pdf」
  url: string     // Firebase Storage 下載 URL
  size?: number   // 檔案大小（bytes）
  type?: string   // MIME type，例如 'application/pdf'
  uploadedAt: Timestamp
}
```

學生可透過 `url` 直接下載教材。

---

### 2.7 courseCategories 設定表（獨立 Collection）

課程分類為可由管理員維護的設定表，**不 hardcode**。

| 欄位 | 類型 | 說明 |
|---|---|---|
| `id` | `string` | Firestore Document ID |
| `name` | `string` | 分類名稱（例：S1 生養、S2 餵養、門徒培育）|
| `order` | `number` | 排序 |
| `description` | `string` | 選填，分類說明 |

---

## 3. 前端實作規格

### 路由
- 列表頁：`/admin/courses/templates`
- 建立頁：`/admin/courses/templates/create`
- 編輯頁：`/admin/courses/templates/[id]`

### UI 元件規範（PrimeVue）

| 欄位 | 元件 | 備註 |
|---|---|---|
| 課程名稱 | `<InputText v-model.trim>` | |
| 課程代號 | `<InputText>` | `@input` 強制轉大寫；有關聯後設為 `disabled` |
| 課程分類 | `<MultiSelect>` | 選項由 `GET /api/course-categories` 拉取 |
| 授課方式 | `<Select>` | 選項 hardcode `CourseFormat` enum |
| 擋修條件 | `<MultiSelect>` | 選項 = 系統固定條件 + `GET /api/courses/templates` |
| 預計時間 | `<Select>` (type) + `<InputNumber>` (value) | |
| 開課頻率 | `<Select>` | 選項 hardcode `FrequencyType` enum |
| 課程教材 | `<FileUpload>` | 上傳至 Firebase Storage，取得 URL 後存入 `attachments` |
| 課程大綱 | `<Editor>` | PrimeVue 內建（Quill.js）|
| 意願登記日期 | `<DatePicker selectionMode="range">` | |
| 課程狀態 | `<ToggleSwitch>` | 列表頁直接切換，呼叫 PATCH status endpoint |

---

## 4. 後端 API 規格（Nitro + Service Layer）

所有 endpoints 需通過 middleware 驗證 `course:manage` 權限。

| Method | 路徑 | 說明 |
|---|---|---|
| `GET` | `/api/courses/templates` | 取得模板清單（含分頁/篩選）|
| `POST` | `/api/courses/templates` | 建立模板。Service 層驗證 `code` 唯一性，重複拋 `409 Conflict` |
| `GET` | `/api/courses/templates/:id` | 取得單一模板 |
| `PUT` | `/api/courses/templates/:id` | 更新模板。Service 層須阻擋修改已有關聯的 `code` |
| `PATCH` | `/api/courses/templates/:id/status` | 切換 `ACTIVE` / `INACTIVE` |
| `GET` | `/api/course-categories` | 取得分類設定表清單 |
| `POST` | `/api/course-categories` | 新增分類 |
| `PUT` | `/api/course-categories/:id` | 編輯分類 |
| `DELETE` | `/api/course-categories/:id` | 刪除分類（需確認無模板使用中）|

---

## 5. 長期維護原則（Long-term Maintenance）

適用於 5 年以上、大量歷史關聯資料的情境：

1. **`code` 不可變更**：一旦有學生登記意願或被其他課程設為擋修條件，`code` 永久禁止修改，前端對此欄位設為 `disabled`。
2. **文字欄位可軟性修改**：`name`、`syllabus` 等可隨時維護。
3. **重大課程變更用版本策略**：將舊模板設為 `INACTIVE`，建立新模板（例：`S101-V2`）。舊模板保留供歷史紀錄查詢。
4. **擋修條件調整不追溯**：修改 `prerequisites` 僅影響修改後的新報名，對歷史已完成的學生無影響。
5. **分類刪除保護**：`courseCategories` 中若有模板仍在使用，禁止刪除該分類（後端 Service 層驗證）。
