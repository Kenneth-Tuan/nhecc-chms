# Story 5: 敏感資料解鎖機制 (Sensitive Data Reveal)

**ID**: ST-005  
**Priority**: Must Have (Security Feature)  
**Phase**: 2 - 核心 CRUD 功能

## User Story

**As a** 擁有敏感資料查看權限的使用者（如超級管理員、牧區長、小組長），  
**I want to** 在查看會友詳情時，能對遮罩的敏感資料進行解鎖，並留下完整的審計追蹤紀錄，  
**So that** 我能在必要時取得聯繫資訊，同時確保系統對個資存取行為有完整的追蹤與問責機制，符合隱私保護原則。

---

## Background & Context

根據 **System Architecture Blueprint** 的設計，系統對以下 5 種敏感欄位採用「預設遮罩 (Privacy by Default)」策略：

| **欄位**                  | **遮罩格式範例**                  | **說明**                           |
| ------------------------- | --------------------------------- | ---------------------------------- |
| `mobile`                  | `092*-3**-6**`                    | 保留前 3 碼第一位、第 2 段第一位、第 3 段第一位 |
| `email`                   | `pe***@example.com`               | 保留前 2 字元和 domain             |
| `lineId`                  | `pe***_123`                       | 保留前 2 字元和最後 3 字元         |
| `address`                 | `台北市內湖區***`                 | 保留前 10 字元                     |
| `emergencyContactPhone`   | `092*-1**-4**`                    | 同 mobile                          |

**核心設計原則**：
- **Privacy by Default**: 所有敏感資料預設遮罩，需明確授權與主動操作才能查看
- **Principle of Least Privilege**: 僅給予必要角色解鎖權限
- **Audit Trail**: 所有解鎖行為必須記錄（誰、何時、查看了誰的哪個欄位）

---

## Acceptance Criteria (AC)

### AC1: 敏感資料遮罩顯示 (Default Masked State)

**條件**：當使用者透過以下 API 取得會友資料時：
- `GET /api/members` (列表)
- `GET /api/members/:id` (詳情)

**要求**：
1. **後端 API 強制遮罩**：敏感欄位必須在 Service Layer 進行遮罩處理，回傳格式如：
   ```json
   {
     "mobile": "092*-3**-6**",
     "mobileCanReveal": true,
     "email": "pe***@example.com",
     "emailCanReveal": false,
     "lineId": "pe***_123",
     "lineIdCanReveal": true,
     "address": "台北市內湖區***",
     "addressCanReveal": true,
     "emergencyContact": {
       "name": "林大衛",
       "relationship": "父親",
       "phone": "092*-1**-4**"
     },
     "emergencyContactCanReveal": true
   }
   ```

2. **`canReveal` 標記邏輯**：
   - 後端檢查 `userContext.revealAuthority[fieldName]` 是否為 `true`
   - 若為 `true`，前端才顯示「眼睛 icon」

3. **遮罩格式實作**：
   - 使用 Service 層 Helper Function：`maskSensitiveField(value, fieldType)`
   - 支援 5 種欄位類型：`mobile`, `email`, `lineId`, `address`, `emergencyContact`

**驗證方式**：
- [ ] 一般會友登入後查看自己資料，所有敏感欄位無 icon（roleIds: ['general']）
- [ ] 小組長查看組員資料，僅 mobile 有 icon（revealAuthority: { mobile: true }）
- [ ] 超級管理員查看任何人，所有欄位都有 icon（revealAuthority: 全 true）

---

### AC2: 解鎖互動 - 單一欄位解鎖 (Single Field Reveal)

**觸發情境**：使用者在會友詳情頁或 Quick View Modal 中，點擊敏感欄位旁的「眼睛 icon」。

**前端互動流程**：
1. 使用者點擊 icon → 前端顯示 Loading 狀態（眼睛 icon 變為 spinner）
2. 呼叫 API：`POST /api/members/:memberId/reveal/:fieldName`
3. 成功回應 → 前端將該欄位的遮罩值替換為明碼
4. 失敗處理：
   - 若無權限（403）→ Toast 提示「無權限查看此欄位」
   - 若 Token 過期（401）→ 重新登入
   - 若系統錯誤（500）→ Toast 提示「系統錯誤，請稍後再試」

**後端 API 規格**：

**Endpoint**: `POST /api/members/:memberId/reveal`

**Request**:
- Path Params:
  - `memberId`: 目標會友 UUID
- Headers:
  - `Authorization`: Bearer Token
- Body:
  ```json
  {
    "fields": ["mobile", "email"]  // 欲解鎖的欄位名稱陣列
  }
  ```
  - 特殊值：`"fields": ["*"]` 表示解鎖所有有權限的欄位（批次解鎖）

**Response** (Success - 200):
```json
{
  "success": true,
  "revealedFields": {
    "mobile": {
      "value": "0921-345-678",
      "auditLogId": "audit_20260211_001"
    },
    "email": {
      "value": "peter@example.com",
      "auditLogId": "audit_20260211_002"
    }
  },
  "failedFields": {
    "lineId": {
      "error": "REVEAL_PERMISSION_DENIED",
      "message": "您無權限查看此欄位"
    }
  }
}
```

**Response** (Forbidden - 403) - 當所有欄位都無權限時：
```json
{
  "success": false,
  "error": "REVEAL_PERMISSION_DENIED",
  "message": "您無權限查看任何指定欄位"
}
```

**Response** (Bad Request - 400) - 當欄位名稱無效時：
```json
{
  "success": false,
  "error": "INVALID_FIELD_NAME",
  "message": "無效的欄位名稱: invalidField"
}
```

**後端驗證邏輯**：
```typescript
// Step 1: 驗證 fields 參數
const validFields = ['mobile', 'email', 'lineId', 'address', 'emergencyContact'];
const requestedFields = body.fields[0] === '*' 
  ? validFields 
  : body.fields;

// 檢查是否有無效欄位
const invalidFields = requestedFields.filter(f => !validFields.includes(f));
if (invalidFields.length > 0) {
  throw createError({ 
    statusCode: 400, 
    message: `無效的欄位名稱: ${invalidFields.join(', ')}` 
  });
}

// Step 2: Scope 檢查（是否有權查看該會友）
const member = await getMemberById(memberId);
if (!canAccessMember(userContext, member)) {
  throw createError({ statusCode: 403, message: 'MEMBER_ACCESS_DENIED' });
}

// Step 3: 逐一處理每個欄位
const revealedFields = {};
const failedFields = {};

for (const fieldName of requestedFields) {
  // 權限檢查
  if (!userContext.revealAuthority[fieldName]) {
    failedFields[fieldName] = {
      error: 'REVEAL_PERMISSION_DENIED',
      message: '您無權限查看此欄位'
    };
    continue;
  }

  // 記錄審計日誌
  const auditLogId = await createAuditLog({
    action: 'REVEAL_SENSITIVE_DATA',
    userId: userContext.userId,
    targetMemberId: memberId,
    fieldName,
    timestamp: new Date(),
  });

  // 回傳明碼
  revealedFields[fieldName] = {
    value: member[fieldName],
    auditLogId
  };
}

// Step 4: 若所有欄位都失敗，回傳 403
if (Object.keys(revealedFields).length === 0) {
  throw createError({ 
    statusCode: 403, 
    message: '您無權限查看任何指定欄位' 
  });
}

return { revealedFields, failedFields };
```

**驗證方式**：
- [ ] 小組長點擊組員 mobile icon → 呼叫 API `{ fields: ["mobile"] }` → 成功取得明碼
- [ ] 小組長點擊組員 email icon → 呼叫 API `{ fields: ["email"] }` → 回傳 failedFields（無權限）
- [ ] 小組長點擊其他牧區會友 mobile → 回傳 403（Scope 限制）
- [ ] 同時解鎖 mobile + email → 呼叫 API `{ fields: ["mobile", "email"] }` → mobile 成功，email 在 failedFields

---

### AC3: 批次解鎖 - Quick View Modal 一鍵顯示 (Batch Reveal)

**情境**：使用者在 Quick View Modal 中，需要一次性查看該會友的所有敏感資料（如需聯絡對方處理緊急狀況）。

**前端 UI 設計**：
- Modal 頂部提供「顯示所有敏感資料」按鈕（僅對有 `revealAuthority` 權限者顯示）
- 點擊按鈕後：
  1. 前端顯示「解鎖中...」Loading 狀態
  2. 呼叫解鎖 API：`POST /api/members/:memberId/reveal` with `{ fields: ["*"] }`
  3. 成功後一次性更新所有有權限的欄位為明碼
  4. 按鈕變為「已顯示」狀態（Disabled）

**API 呼叫方式**：

使用相同的 Reveal API（參考 AC2），傳入特殊值 `"*"` 表示批次解鎖：

```typescript
// 前端呼叫範例
const response = await fetch(`/api/members/${memberId}/reveal`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: ['*'] })  // "*" 表示所有欄位
});

// Response 格式同 AC2
// revealedFields 僅包含有權限的欄位
// failedFields 包含無權限的欄位（若有）
```

**後端邏輯**：
- `fields: ["*"]` 時，展開為所有敏感欄位 `['mobile', 'email', 'lineId', 'address', 'emergencyContact']`
- 依序檢查使用者對每個欄位的 `revealAuthority`
- 僅回傳有權限的欄位明碼
- 為每個解鎖欄位分別記錄審計日誌

**驗證方式**：
- [ ] 超級管理員點擊「顯示全部」→ 呼叫 API `{ fields: ["*"] }` → 所有欄位在 revealedFields 中
- [ ] 小組長點擊「顯示全部」→ 呼叫 API `{ fields: ["*"] }` → 僅 mobile 在 revealedFields，其他在 failedFields
- [ ] 前端根據 response 更新 UI：revealedFields 的欄位顯示明碼，failedFields 的欄位維持遮罩

---

### AC4: 審計日誌記錄 (Audit Log)

**目的**：追蹤所有敏感資料存取行為，供未來稽核與問責。

**記錄時機**：
- 每次呼叫 `/api/members/:id/reveal/:field` 成功時
- 每次呼叫 `/api/members/:id/reveal-all` 成功時（每個欄位分別記錄）

**Audit Log Schema**：
```typescript
interface AuditLog {
  id: string;                      // PK
  action: 'REVEAL_SENSITIVE_DATA'; // 操作類型
  userId: string;                  // 操作者 UUID
  userName: string;                // 操作者姓名（快取）
  targetMemberId: string;          // 目標會友 UUID
  targetMemberName: string;        // 目標會友姓名（快取）
  fieldName: string;               // 解鎖欄位名稱
  timestamp: Timestamp;            // 操作時間
  ipAddress?: string;              // 操作者 IP（選填）
  userAgent?: string;              // 操作者 User Agent（選填）
}
```

**儲存位置**：
- Firebase Collection: `audit_logs`
- 索引設定：
  - `(userId, timestamp)` - 查詢某使用者的操作歷史
  - `(targetMemberId, timestamp)` - 查詢某會友被誰查看過
  - `(action, timestamp)` - 查詢特定操作類型

**驗證方式**：
- [ ] 解鎖後，`audit_logs` Collection 有新記錄
- [ ] 記錄包含正確的 userId, targetMemberId, fieldName
- [ ] 記錄時間戳正確

**未來擴充（不在本 Story Scope）**：
- Admin 可查詢審計日誌（`GET /api/audit-logs`）
- 提供視覺化報表（如「本月解鎖次數前 10 名」）

---

### AC5: 前端 UX 細節 (Frontend UX)

**眼睛 Icon 狀態管理**：
| **狀態**   | **Icon 外觀**         | **互動**              |
| ---------- | --------------------- | --------------------- |
| **遮罩中** | 👁️ 灰色              | 可點擊，Hover 提示「點擊查看」 |
| **載入中** | ⏳ Spinner            | 不可點擊              |
| **已解鎖** | 👁️‍🗨️ 藍色 + Slash   | 已顯示明碼，不可再點擊 |

**便利性優化**：
- **記憶解鎖狀態**：在同一個 Modal Session 中，使用者解鎖過的欄位維持明碼狀態，不需重複點擊
- **關閉 Modal 清除狀態**：關閉 Modal 後，下次重新開啟時，所有欄位重置為遮罩（避免背後偷窺風險）

**Toast 提示訊息**：
- 成功解鎖：「已顯示 {欄位名稱}」（2 秒後自動消失）
- 無權限：「您無權限查看此欄位」（需手動關閉）
- 系統錯誤：「系統錯誤，請稍後再試」（需手動關閉）

**驗證方式**：
- [ ] 點擊 icon 後變為 spinner
- [ ] 成功後 icon 變為已解鎖狀態（藍色 + Slash）
- [ ] 關閉 Modal 後重新開啟，欄位重置為遮罩

---

### AC6: 列表頁行為 (List View Behavior)

**列表頁不提供解鎖功能**：
- 參考 ST-003 AC，列表頁的敏感欄位（如 mobile）**僅顯示遮罩**，不提供眼睛 icon
- **原因**：避免在列表中大量觸發 Audit Log（如使用者滑過 20 筆資料就產生 20 筆 Log），造成 Log Spam

**查看明碼方式**：
- 使用者需點擊「查看詳情」進入 Quick View Modal 或詳情頁
- 在 Modal/詳情頁中才提供解鎖互動

**驗證方式**：
- [ ] 列表頁的 mobile 欄位無眼睛 icon
- [ ] 列表頁的 mobile 欄位顯示遮罩格式

---

## Technical Notes

### 統一 API 設計理由 (Unified API Design Rationale)

**設計決策**：使用單一 API endpoint (`POST /api/members/:id/reveal`) 搭配 `fields` 陣列參數，取代原本的兩個 endpoints（`/reveal/:field` 與 `/reveal-all`）。

**優勢分析**：

1. **更靈活的組合**：
   - 支援單一欄位：`{ fields: ["mobile"] }`
   - 支援多個欄位：`{ fields: ["mobile", "email"] }`
   - 支援全部欄位：`{ fields: ["*"] }`
   - 未來可輕鬆擴充（如解鎖緊急聯絡人的多個子欄位）

2. **減少網路請求**：
   - 舊設計：若需解鎖 mobile + email，需呼叫 2 次 API
   - 新設計：只需 1 次 API 呼叫，降低延遲和伺服器負載

3. **Partial Success 支援**：
   - 回應同時包含 `revealedFields`（成功）和 `failedFields`（失敗）
   - 前端可一次性處理，UX 更順暢

4. **易於維護**：
   - 只需維護一套權限檢查邏輯
   - 統一的錯誤處理和審計日誌記錄

**實作複雜度**：略微增加（需驗證 fields 陣列），但可接受。

---

### 遮罩演算法實作 (Masking Algorithm)

**Helper Function**: `maskSensitiveField(value: string, fieldType: SensitiveFieldType): string`

```typescript
export function maskSensitiveField(
  value: string,
  fieldType: 'mobile' | 'email' | 'lineId' | 'address' | 'emergencyContact'
): string {
  if (!value) return '';

  switch (fieldType) {
    case 'mobile':
      // 0921-345-678 → 092*-3**-6**
      return value.replace(/(\d{3})\d(-\d)\d{2}(-\d)\d{2}/, '$1*$2**$3**');
    
    case 'email':
      // peter@example.com → pe***@example.com
      const [localPart, domain] = value.split('@');
      return `${localPart.slice(0, 2)}***@${domain}`;
    
    case 'lineId':
      // peter_lin → pe***_lin
      if (value.length <= 5) return value.slice(0, 2) + '***';
      return value.slice(0, 2) + '***' + value.slice(-3);
    
    case 'address':
      // 保留前 10 字元
      return value.slice(0, 10) + '***';
    
    case 'emergencyContact':
      // 同 mobile
      return maskSensitiveField(value, 'mobile');
    
    default:
      return value;
  }
}
```

### 權限檢查優化 (Permission Check Optimization)

**問題**：每次解鎖都需要重新檢查權限，可能造成效能問題。

**解決方案**：
- 使用 UserContext 快取（TTL: 5 分鐘）
- 前端在初始化時取得 `userContext.revealAuthority`，決定哪些欄位顯示眼睛 icon
- 後端仍需再次驗證，避免前端繞過（Zero Trust）

### 審計日誌清理策略 (Audit Log Retention)

**問題**：審計日誌會隨時間累積，需要清理策略。

**建議方案**（不在本 Story Scope，僅供參考）：
- 保留最近 1 年的日誌
- 超過 1 年的日誌轉存至 Cold Storage（如 BigQuery）
- 提供自動化 Cloud Function 每月執行清理

---

## Dependencies

**必須完成的前置 Stories**：
- ✅ **ST001**: 資料核心與 Schema 定義（`members` Collection 已包含敏感欄位）
- ✅ **ST002**: RBAC Configuration（`Role.revealAuthority` 已定義 Z 軸權限）
- ✅ **ST003**: 會友資料列表（Quick View Modal 已實作）

**需要的系統元件**：
- Firebase Firestore: 儲存 `audit_logs` Collection
- UserContext Middleware: 提供 `userContext.revealAuthority`
- Service Layer: `maskSensitiveField` Helper Function

---

## Non-Functional Requirements (NFR)

### Security
- [ ] 所有 Reveal API 必須驗證 JWT Token
- [ ] 後端必須檢查 Y 軸 Scope（避免跨牧區查看）
- [ ] 審計日誌記錄不可被使用者刪除或修改

### Performance
- [ ] 單一欄位解鎖 API 回應時間 < 300ms (P95)
- [ ] 批次解鎖 API 回應時間 < 500ms (P95)
- [ ] 審計日誌寫入採用 Async Write（不阻塞主要流程）

### Usability
- [ ] 眼睛 icon 符合 WCAG 2.1 AA 標準（對比度 > 4.5:1）
- [ ] 支援鍵盤操作（Tab + Enter 觸發解鎖）
- [ ] 提供 Loading 狀態回饋（避免使用者重複點擊）

---

## Out of Scope (明確不做)

以下功能**不在本 Story 範圍內**，留待後續 Story 處理：

- [ ] 審計日誌查詢介面（Admin 查看 Log 的 UI）
- [ ] 批次匯出時的敏感資料處理（Excel 匯出是否需遮罩）
- [ ] 敏感資料編輯時的審計紀錄（本 Story 僅處理「查看」）
- [ ] 多因素驗證 (MFA) 要求（高風險操作如解鎖敏感資料是否需 MFA）
- [ ] 審計日誌自動告警（如同一使用者短時間內解鎖 > 100 筆資料）

---

## Testing Scenarios

### Test Case 1: 小組長解鎖組員手機號碼
**Given**: 小組長登入，進入組員 Peter 的詳情頁  
**When**: 點擊 mobile 欄位旁的眼睛 icon  
**Then**:
- 前端呼叫 `POST /api/members/peter_id/reveal` with `{ fields: ["mobile"] }`
- API 回傳 `{ revealedFields: { mobile: { value: "0921-345-678", auditLogId: "..." } } }`
- 前端顯示明碼
- `audit_logs` 有新記錄

### Test Case 2: 小組長嘗試解鎖無權限欄位
**Given**: 小組長登入，進入組員 Peter 的詳情頁  
**When**: 點擊 email 欄位旁的眼睛 icon（小組長無 email 解鎖權限）  
**Then**:
- 前端呼叫 `POST /api/members/peter_id/reveal` with `{ fields: ["email"] }`
- API 回傳 403 錯誤（因所有欄位都無權限）
- Toast 提示「您無權限查看任何指定欄位」
- `audit_logs` 無新記錄

### Test Case 3: 小組長嘗試解鎖其他牧區會友資料
**Given**: 小組長登入（僅管理 Group A），嘗試存取 Group B 會友資料  
**When**: 呼叫 `POST /api/members/group_b_member/reveal` with `{ fields: ["mobile"] }`  
**Then**:
- API 回傳 403 錯誤（Scope 限制，在 Step 2 就被攔截）
- Toast 提示「您無權限查看此會友資料」

### Test Case 4: 超級管理員批次解鎖
**Given**: 超級管理員登入，進入會友詳情頁  
**When**: 點擊「顯示所有敏感資料」按鈕  
**Then**:
- 前端呼叫 `POST /api/members/:id/reveal` with `{ fields: ["*"] }`
- API 回傳所有欄位在 `revealedFields` 中（mobile, email, lineId, address, emergencyContact）
- 前端一次性更新所有欄位為明碼
- `audit_logs` 有 5 筆記錄（每個欄位一筆）

### Test Case 5: 一般會友查看自己資料
**Given**: 一般會友登入，查看自己的詳情頁  
**When**: 開啟頁面  
**Then**:
- 所有敏感欄位無眼睛 icon（roleIds: ['general'], revealAuthority 全為 false）
- 所有敏感欄位顯示遮罩

### Test Case 6: 小組長同時解鎖多個欄位（展示 API 靈活性）
**Given**: 小組長登入，進入組員詳情頁  
**When**: 前端需要同時顯示 mobile 和 lineId（假設小組長有這兩個權限）  
**Then**:
- 前端呼叫 `POST /api/members/:id/reveal` with `{ fields: ["mobile", "lineId"] }`
- API 回傳 `{ revealedFields: { mobile: {...}, lineId: {...} } }`
- 前端一次性更新兩個欄位為明碼
- `audit_logs` 有 2 筆記錄

**優勢**：相比舊設計需要呼叫兩次 API，新設計只需一次，減少網路延遲和 Audit Log 碎片化

---

## Definition of Done (DoD)

- [ ] 後端 API 實作完成（統一的 `/reveal` endpoint，支援單一與批次）
- [ ] 前端眼睛 icon 互動實作完成
- [ ] 審計日誌記錄功能實作完成
- [ ] 遮罩演算法通過 Unit Test（5 種欄位類型）
- [ ] 權限檢查邏輯通過 Integration Test
- [ ] Quick View Modal 整合解鎖功能
- [ ] 所有 AC 驗證通過
- [ ] Code Review 通過
- [ ] 部署到 Staging 環境並通過 UAT
- [ ] 更新 API 文件（Swagger/OpenAPI）
- [ ] 更新 Technical Design 文件（若有架構變更）

---

## Estimated Effort

**Backend**: 3 天
- 統一 Reveal API 實作（含 fields 陣列驗證、Partial Success 處理）: 1.5 天
- Audit Log 實作: 1 天
- Unit Test & Integration Test: 0.5 天

**Frontend**: 2 天
- 眼睛 icon 互動（支援單一與批次）: 1 天
- Quick View Modal 整合: 0.5 天
- Error Handling & Partial Success UX: 0.5 天

**Total**: 5 天

**備註**：統一 API 設計雖略增實作複雜度，但降低了前端多次呼叫的處理邏輯，整體工作量不變。

---

## Related Documentation

- [System Architecture Blueprint - Part 2.2 敏感資料遮罩機制](/docs/開發相關文件/System%20Architecture%20blue%20print.md#22-敏感資料遮罩機制)
- [System Architecture Blueprint - Part 3.4 Z 軸 - 解鎖權限](/docs/開發相關文件/System%20Architecture%20blue%20print.md#34-z-軸---解鎖權限-reveal-authority)
- [ST003 - 會友資料列表 - AC: 快速預覽視窗](/docs/開發相關文件/ST003%20-%20會友資料列表/Description.md)
