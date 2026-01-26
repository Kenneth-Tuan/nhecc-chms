# 課程資料系統設計 (Course Data Structure)

此文件定義「課程 (Course)」的實體資料結構。課程代表系統中所有班級共用的模板與基礎屬性。

## 一、課程基本欄位 (Course Fields)

### 1. 核心識別

- **課程ID** (`id`): `string (UUID)`
  - 系統唯一識別碼，使用 UUID v4 生成。
- **課程代碼** (`code`): `string`
  - 格式：大寫英數組合，最大長度 25 字元。
- **課程名稱** (`name`): `string`
- **課程圖片** (`coverImage`): `string (URL/FileID)`
  - 課程的代表縮圖或封面底。

### 2. 分類與狀態

- **課程類型** (`types`): `string[] (Enum Array)`
  - 可多選，參考「門徒建造程序」分類：
    - `S1_SEEDING`: S1 生養
    - `S2_FEEDING`: S2 餵養
    - `S3_SHEPHERDING`: S3 牧養
    - `S4_SENDING`: S4 培養
    - `LEADER_TRAINING`: 領袖培訓
    - `ADVANCED_STUDY`: 進修
- **報名狀態** (`enrollmentStatus`): `string (Enum)`
  - `PREPARING`: 準備中 (不對外顯示或僅預告)
  - `OPEN_FOR_REGISTRATION`: 開放報名 (用戶可於前台申請)

### 3. 條件與規範

- **擋修條件 / 修課條件** (`prerequisites`): `string[]`
  - 固定選項：`BAPTIZED` (已受洗)
  - 動態選項：系統中其餘課程的 **課程代碼 (code)**。
- **教材** (`materials`): `Array<Object>`
  - 由後台人員上傳之檔案。
  - 格式：`[{ fileName: string, fileUrl: string, fileId: string }]`

### 4. 預計資源 (建議選項)

- **預計上課時間選項** (`estimatedTimeOptions`): `Array<Object>`
  - 提供用戶報名時可選擇或參考的時段。
  - 格式：`[{ dayOfWeek: number, startTime: string, duration: number }]`
- **預計上課地點** (`estimatedLocation`): `string`
  - 課程通常進行的地點或建議空間。

### 5. 介紹與內容

- **課程介紹 / 目標** (`description`): `text`
  - 描述課程的目標、內容大綱或是對會友的收穫。

---

## 二、系統管理欄位 (System Fields)

- **建立時間** (`createdAt`): `Timestamp`
- **更新時間** (`updatedAt`): `Timestamp`
- **建立者** (`createdBy`): `string (UserID)`
- **最後修改者** (`updatedBy`): `string (UserID)`

---

## 三、範例資料 (Example Course JSON)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "code": "S201",
  "name": "聖經綜覽",
  "coverImage": "https://storage.nhecc.org/images/courses/s201_cover.jpg",
  "types": ["S2_FEEDING"],
  "enrollmentStatus": "OPEN_FOR_REGISTRATION",
  "prerequisites": ["BAPTIZED", "S101"],
  "materials": [
    {
      "fileName": "聖經綜覽講義.pdf",
      "fileUrl": "https://storage.nhecc.org/files/materials/s201_handout.pdf",
      "fileId": "file_abc_123"
    }
  ],
  "estimatedTimeOptions": [
    { "dayOfWeek": 7, "startTime": "10:00", "duration": 120 }
  ],
  "estimatedLocation": "201 教室",
  "description": "介紹聖經範圍，幫助弟兄姊妹有效地閱讀聖經。",
  "createdAt": "2026-01-26T06:50:00Z",
  "updatedAt": "2026-01-26T06:50:00Z",
  "createdBy": "system_admin",
  "updatedBy": "system_admin"
}
```
