# 會員註冊資料結構 (Member Registration Data Structure)

此文件定義會員註冊時所需填寫的欄位。註冊流程分為兩個階段：

## 階段一：建立新帳號 (Account Creation)

### 1. 帳號安全

- **真實姓名** (`fullName`): `string` **(必填)**
  - 用戶的真實全名。
- **手機號碼** (`phone`): `string` **(必填)**
  - 格式：台灣手機號碼，例如 `0912-345-678`
- **電子信箱** (`email`): `string` **(必填)**
  - 格式：標準 Email 格式
- **設定密碼** (`password`): `string` **(必填)**
  - 密碼需符合安全規範（建議 8 碼以上，包含英數）
- **確認密碼** (`confirmPassword`): `string` **(必填)**
  - 需與設定密碼相符

---

## 階段二：完成個人資料 (Profile Completion)

### 1. 個人照片

- **大頭貼** (`avatar`): `string (URL/FileID)`
  - 用戶上傳的個人照片。

### 2. 基本資料

- **姓名** (`name`): `string` **(必填)**
  - 與階段一的真實姓名可能相同或重複確認。
- **性別** (`gender`): `string (Enum)`
  - 選項：`MALE` (男) / `FEMALE` (女)
- **出生年月日** (`birthDate`): `Date`
  - 格式：YYYY-MM-DD
- **婚姻狀態** (`maritalStatus`): `string (Enum)`
  - 選項：
    - `SINGLE`: 單身
    - `MARRIED`: 已婚
    - `OTHER`: 其他

### 3. 聯絡資訊

- **手機號碼** (`phone`): `string` **(必填)**
  - 與階段一相同，可能預填。
- **Line ID** (`lineId`): `string`
  - 用戶的 Line 帳號 ID。
- **Email** (`email`): `string`
  - 與階段一相同，可能預填。
- **通訊地址** (`address`): `string`
  - 完整的聯絡地址。

### 4. 緊急聯絡人

- **聯絡人姓名** (`emergencyContactName`): `string`
- **聯絡人電話** (`emergencyContactPhone`): `string`

### 5. 信仰狀態

- **是否已經受洗** (`isBaptized`): `boolean`
  - 預設值：`true` (根據 UI 設計)
- **受洗日期** (`baptismDate`): `Date`
  - 格式：YYYY-MM-DD
  - 若 `isBaptized` 為 `true`，此欄位建議填寫。
- **歸屬牧區** (`pastoralZone`): `string`
  - 第一層選擇：選擇所屬的牧區。
  - 範例：`林牧區`, `張牧區`, `李牧區`
- **歸屬小組** (`homeGroup`): `string`
  - 第二層聯級選擇：根據所選牧區，顯示該牧區下的小組。
  - 需先選擇牧區後才能選擇小組。
  - 範例：`喜樂小組`, `平安小組`, `恩慈小組`

### 6. 過去經歷

- **曾經參與過的福音課程** (`previousCourses`): `string[]`
  - 多選，選項包括：
    - `ALPHA`: 啟發課程
    - `HAPPINESS_GROUP`: 幸福小組
    - `ENCOUNTER_GOD`: 經歷神營會
    - `DOUBT_TO_FAITH`: 從懷疑到相信
    - `OTHER`: 其他
  - 註記：僅供教務處參考，非必填。

---

## 完整範例 (Example Member Registration JSON)

```json
{
  "account": {
    "fullName": "王小明",
    "phone": "0912-345-678",
    "email": "wang.xiaoming@example.com",
    "password": "securePassword123",
    "confirmPassword": "securePassword123"
  },
  "profile": {
    "avatar": "https://storage.nhecc.org/avatars/user_123.jpg",
    "name": "王小明",
    "gender": "MALE",
    "birthDate": "1990-05-15",
    "maritalStatus": "SINGLE",
    "phone": "0912-345-678",
    "lineId": "wangxiaoming",
    "email": "wang.xiaoming@example.com",
    "address": "台北市內湖區成功路四段 168 號",
    "emergencyContactName": "王大華",
    "emergencyContactPhone": "0922-123-456",
    "isBaptized": true,
    "baptismDate": "2020-12-25",
    "pastoralZone": "林牧區",
    "homeGroup": "喜樂小組",
    "previousCourses": ["ALPHA", "HAPPINESS_GROUP"]
  },
  "createdAt": "2026-01-26T07:01:00Z",
  "updatedAt": "2026-01-26T07:01:00Z"
}
```

---

## 系統管理欄位 (System Fields)

- **會員ID** (`id`): `string (UUID)`
  - 系統唯一識別碼，註冊時自動生成。
- **建立時間** (`createdAt`): `Timestamp`
- **更新時間** (`updatedAt`): `Timestamp`
- **帳號狀態** (`status`): `string (Enum)`
  - `PENDING_VERIFICATION`: 待驗證
  - `ACTIVE`: 啟用中
  - `SUSPENDED`: 停權
  - `DELETED`: 已刪除

---

## 欄位驗證規則建議

### 必填欄位 (Required)

- 階段一：`fullName`, `phone`, `email`, `password`, `confirmPassword`
- 階段二：`name`, `phone`

### 格式驗證

- **phone**: 台灣手機號碼格式 (09XX-XXX-XXX)
- **email**: 標準 Email 格式
- **password**: 至少 8 碼，建議包含英文、數字
- **birthDate**, **baptismDate**: YYYY-MM-DD 格式

### 選項限制

- **gender**: 僅接受 `MALE` 或 `FEMALE`
- **maritalStatus**: 僅接受 `SINGLE`, `MARRIED`, `OTHER`
- **previousCourses**: 僅接受預定義的課程代碼

---

## 註冊流程建議

1. **階段一完成**後，建立基本帳號並發送驗證信/簡訊。
2. **階段二完成**後，會員資料完整，可正式使用系統。
3. 使用者可以在階段一後即登入系統，但部分功能可能需完成階段二才能使用。
