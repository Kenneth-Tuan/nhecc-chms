# Phase 4 - 角色與權限管理 (Role & Permission Management)

**Phase ID**: Phase 4  
**Priority**: Must Have (Core Feature)  
**Status**: 📝 Planning (Documentation Complete)

---

## Phase Overview

Phase 4 聚焦於「角色與權限管理」，實作為會友指派角色的介面，以及帳號安全管理功能（密碼重設、強制登出、登入歷史）。此階段完成後，系統管理員能夠靈活管理會友的角色與權限，並處理帳號安全問題。

---

## Stories Summary

### ST009 - 角色指派介面 (Role Assignment Interface)

**Priority**: Must Have (Core Feature)  
**Status**: 📝 Planning (Documentation Complete)

**核心功能**:
- 會友編輯頁的角色管理（新增、移除、預覽角色）
- 會友詳情頁的角色顯示
- 會友列表的角色篩選與統計
- 批次角色指派（選填）
- UserContext 快取清除機制

**技術亮點**:
- UserContext 快取管理（Node Memory Cache）
- 批次更新（Firestore Batch Write）
- 角色權限預覽（XYZ 三軸）
- 靈活的指派模式（新增 / 取代）

**詳細文件**:
- [ST009 Summary](../ST009%20-%20角色指派介面/Summary.md)
- [ST009 Description](../ST009%20-%20角色指派介面/Description.md)
- [ST009 Technical Design](../ST009%20-%20角色指派介面/Technical%20Design.md)
- [ST009 Questions](../ST009%20-%20角色指派介面/Questions.md)

---

### ST010 - 帳號安全與密碼管理 (Account Security & Password Management)

**Priority**: Should Have  
**Status**: 📝 Planning (Documentation Complete)

**核心功能**:
- 重設密碼（發送連結 / 手動設定）
- 強制登出（撤銷所有 Token）
- 密碼強度檢查（前後端驗證）
- 登入歷史記錄與查詢
- 帳號鎖定功能（選填，可後續迭代）

**技術亮點**:
- 密碼 Hash（Firebase Auth bcrypt）
- Token 安全（UUID v4，1 小時有效期）
- 強制登出（Firebase Auth `revokeRefreshTokens`）
- 登入歷史非同步寫入
- Email 發送（Firebase Extensions 或 SendGrid）

**詳細文件**:
- [ST010 Summary](../ST010%20-%20帳號安全與密碼管理/Summary.md)
- [ST010 Description](../ST010%20-%20帳號安全與密碼管理/Description.md)
- [ST010 Technical Design](../ST010%20-%20帳號安全與密碼管理/Technical%20Design.md)
- [ST010 Questions](../ST010%20-%20帳號安全與密碼管理/Questions.md)

---

## Dependencies & Relationships

### External Dependencies (前置依賴)

- ✅ **ST001**: 資料核心與 Schema 定義
  - `members.roleIds` 欄位（ST009）
  - `members.account` 欄位（ST010）
  
- ✅ **ST002**: RBAC Configuration
  - 角色定義與權限矩陣（ST009）
  - `system:config` 權限檢查（ST009, ST010）
  - UserContext 解析與快取機制（ST009）
  
- ✅ **ST004**: 會友資料 CRUD
  - 會友編輯頁與詳情頁（ST009, ST010）
  - 會友列表頁（ST009）

- ⚠️ **Email 發送服務** (ST010)
  - 需配置 Firebase Extensions 或第三方 Email 服務
  - 需確認 Email 模板與發送邏輯

### Internal Dependencies (內部依賴)

```
ST009 (角色指派介面)
  ├─ 可選擇「強制重新登入」
  └─ 需整合 ST010 的強制登出功能 (optional)

ST010 (帳號安全與密碼管理)
  └─ 獨立功能，無內部依賴
```

### Post Dependencies (後置依賴)

- 🔜 **ST027**: 審計日誌
  - 記錄角色變更歷史（ST009）
  - 記錄密碼重設、強制登出等操作（ST010）

---

## Development Sequence

建議的開發順序（可並行開發）：

### Week 1-2: ST009 角色指派介面

**Day 1-2: 前置準備**
- [ ] 建立 Type Definitions (`app/types/role-assignment.ts`)
- [ ] 建立 Composables (`useMemberRole.ts`, `useRolePreview.ts`)
- [ ] 建立 Components 骨架

**Day 3-5: 核心功能**
- [ ] 實作角色管理 Component (`MemberRoleManager.vue`)
- [ ] 實作角色卡片 Component (`MemberRoleCard.vue`)
- [ ] 實作角色預覽 Component (`RolePreviewDialog.vue`)
- [ ] 實作 API Routes (`/api/members/roles/assign`, `/api/members/roles/batch-assign`)
- [ ] 實作 Service Layer (`member.service.ts` 新增方法)
- [ ] 實作 Repository Methods (`role.repository.ts` 新增方法)

**Day 6-7: 會友頁面整合**
- [ ] 整合會友編輯頁（新增角色管理區塊）
- [ ] 整合會友詳情頁（新增角色顯示區塊）
- [ ] 整合會友列表頁（新增角色欄位與篩選器）

**Day 8-9: 快取清除與測試**
- [ ] 實作 UserContext 快取清除機制 (`cache.ts`)
- [ ] 撰寫 Unit Tests
- [ ] 撰寫 Integration Tests
- [ ] 撰寫 E2E Tests

**Day 10: 批次指派（選填）**
- [ ] 實作批次指派對話框 (`BatchRoleAssignDialog.vue`)
- [ ] 實作批次指派 API 與邏輯
- [ ] 測試批次指派功能

---

### Week 3-4: ST010 帳號安全與密碼管理

**Day 1-2: 前置準備**
- [ ] 建立 Type Definitions (`app/types/account-security.ts`)
- [ ] 建立 Composables (`useAccountSecurity.ts`, `usePasswordValidation.ts`)
- [ ] 建立 Components 骨架
- [ ] 配置 Email 發送服務（Firebase Extensions 或 SendGrid）

**Day 3-5: 密碼重設功能**
- [ ] 實作密碼重設對話框 (`ResetPasswordDialog.vue`)
- [ ] 實作手動設定密碼對話框 (`SetPasswordDialog.vue`)
- [ ] 實作密碼重設 API Routes (`/api/auth/send-reset-link`, `/api/auth/set-password`)
- [ ] 實作 Service Layer (`auth.service.ts` 新增方法)
- [ ] 實作 Repository Layer (`password-reset-token.repository.ts`)
- [ ] 實作 Email 模板與發送邏輯

**Day 6-7: 強制登出與登入歷史**
- [ ] 實作強制登出 API (`/api/auth/force-logout`)
- [ ] 實作登入歷史對話框 (`LoginHistoryDialog.vue`)
- [ ] 實作登入歷史 API (`/api/auth/login-logs`)
- [ ] 實作 Repository Layer (`login-log.repository.ts`)
- [ ] 整合 Middleware (`01.auth.ts` 記錄登入歷史)

**Day 8-9: 會友編輯頁整合與測試**
- [ ] 整合會友編輯頁（新增帳號安全區塊）
- [ ] 實作密碼重設頁面 (`/auth/reset-password`)
- [ ] 撰寫 Unit Tests
- [ ] 撰寫 Integration Tests
- [ ] 撰寫 E2E Tests

**Day 10: 選填功能（若時間允許）**
- [ ] 實作帳號鎖定功能（連續登入失敗 5 次）
- [ ] 實作密碼過期提醒功能

---

## Definition of Done (DoD)

### ST009 - 角色指派介面

**Functionality:**
- [x] 能夠在會友編輯頁新增、移除角色
- [x] 能夠在會友詳情頁查看角色與權限
- [x] 能夠在會友列表依角色篩選
- [x] 角色變更後 UserContext 快取正確清除
- [x] 至少一個角色的防呆機制正常運作
- [ ] 批次角色指派功能正常運作（選填）

**UI/UX:**
- [x] 角色管理區塊顯示正確
- [x] 角色預覽對話框顯示 XYZ 三軸資訊
- [x] Toast 確認訊息正確顯示
- [x] 確認對話框（移除角色）正確顯示

**Technical:**
- [x] API Routes 實作完成並通過測試
- [x] Service Layer 實作完成並通過測試
- [x] UserContext 快取清除機制實作完成
- [x] 前後端驗證邏輯一致
- [x] 權限檢查正確套用（`system:config`）

**Testing:**
- [ ] Unit Tests (Coverage >= 80%)
- [ ] Integration Tests
- [ ] E2E Tests

**Documentation:**
- [x] Description.md 完成
- [x] Technical Design.md 完成
- [x] Questions.md 完成
- [x] Summary.md 更新

---

### ST010 - 帳號安全與密碼管理

**Functionality:**
- [x] 能夠發送密碼重設連結，會友收到 Email 並成功重設密碼
- [x] 能夠由管理員手動設定會友密碼
- [x] 能夠強制會友登出，會友下次請求時需重新登入
- [x] 能夠查看會友的登入歷史（最近 30 天）
- [x] 密碼強度檢查正常運作（前後端驗證）
- [ ] 帳號鎖定功能正常運作（選填）

**UI/UX:**
- [x] 帳號安全區塊顯示正確
- [x] 重設密碼對話框（兩種方式選擇）顯示正確
- [x] 手動設定密碼對話框（含密碼強度指示器）顯示正確
- [x] 強制登出確認對話框顯示正確
- [x] 登入歷史對話框（DataTable）顯示正確
- [x] Toast 確認訊息正確顯示

**Technical:**
- [x] API Routes 實作完成並通過測試
- [x] Service Layer 實作完成並通過測試
- [x] Repository Layer 實作完成並通過測試
- [x] Email 發送服務配置完成
- [x] 密碼 Hash 機制正確（Firebase Auth）
- [x] Token 安全機制正確（UUID v4，1 小時有效期）
- [x] 登入歷史非同步寫入正常運作
- [x] 權限檢查正確套用（`system:config`）

**Testing:**
- [ ] Unit Tests (Coverage >= 80%)
- [ ] Integration Tests
- [ ] E2E Tests
- [ ] Email 發送測試

**Documentation:**
- [x] Description.md 完成
- [x] Technical Design.md 完成
- [x] Questions.md 完成
- [x] Summary.md 更新

---

## Key Questions & Decisions

### Critical Questions (需立即確認)

1. **ST009 - UserContext 快取機制** (Q1)
   - 決策：使用 Node Memory Cache
   - 原因：實作簡單，適合中小型教會
   - 待確認：是否需要改用 Redis？

2. **ST009 - 角色篩選邏輯** (Q2)
   - 決策：OR 邏輯（擁有任一選定角色即顯示）
   - 原因：符合一般使用者預期
   - 待確認：是否需要提供 AND 邏輯切換？

3. **ST010 - Email 發送服務** (Q1)
   - 決策：待確認
   - 選項：Firebase Extensions 或 SendGrid
   - 影響：Email 模板管理、發送邏輯

4. **ST010 - 強制登出實作方式** (Q2)
   - 決策：使用 Firebase Auth `revokeRefreshTokens`
   - 原因：官方推薦，穩定可靠
   - 待確認：是否需要立即生效（需額外實作）？

5. **ST010 - 登入歷史儲存位置** (Q3)
   - 決策：Subcollection `members/{memberId}/loginLogs`
   - 原因：資料隔離，查詢快
   - 待確認：是否需要跨會友查詢功能？

### High Priority Questions (影響 UX)

6. **ST009 - 批次指派模式** (Q6)
   - 決策：同時支援「新增」和「取代」兩種模式
   - 原因：給予管理員彈性

7. **ST009 - 角色卡片排序** (Q12)
   - 決策：按 Scope 排序（Global > Zone > Group > Self）
   - 原因：符合權限重要性

8. **ST010 - 密碼重設 Token 有效期** (Q4)
   - 決策：1 小時
   - 原因：符合一般網站做法

9. **ST010 - 密碼變更通知時機** (Q6)
   - 決策：Checkbox 讓管理員選擇，預設勾選
   - 原因：符合資安最佳實踐

10. **ST010 - 登入歷史保留期限** (Q7)
    - 決策：30 天
    - 原因：平衡儲存成本與安全審計需求

### Medium Priority Questions (功能細節)

詳見各 Story 的 Questions.md

---

## Risks & Mitigation

### 風險 1: Email 發送服務未配置

**風險描述**: ST010 需要 Email 發送服務，若未配置則無法發送密碼重設連結

**影響**: 阻擋 ST010 開發（密碼重設功能）

**緩解措施**:
- 在開發 ST010 前，先確認 Email 發送服務
- 若使用 Firebase Extensions，需確認專案已啟用
- 若使用第三方服務（SendGrid），需確認 API Key 與額度

**優先級**: 高

---

### 風險 2: UserContext 快取機制效能問題

**風險描述**: 若使用 Node Memory Cache，在大量會友同時角色變更時，可能導致記憶體不足

**影響**: 系統效能下降，可能導致服務中斷

**緩解措施**:
- 監控 Memory Cache 使用量
- 設定 TTL（5 分鐘），自動清理過期快取
- 若會友數量超過 10,000，考慮改用 Redis

**優先級**: 中

---

### 風險 3: 登入歷史資料量過大

**風險描述**: 若未定期清理登入歷史，Firestore 儲存成本可能增加

**影響**: 增加系統成本

**緩解措施**:
- 使用 Firebase Cloud Functions 定期清理過期登入歷史（30 天）
- 使用 Subcollection 隔離資料
- 監控 Firestore 使用量

**優先級**: 中

---

### 風險 4: 強制登出無法立即生效

**風險描述**: 使用 `revokeRefreshTokens` 僅撤銷 Refresh Token，Access Token 仍有效（最多 1 小時）

**影響**: 強制登出無法立即生效，會友仍可在 1 小時內存取系統

**緩解措施**:
- 在 Description.md 中明確說明此限制
- 若需立即生效，可實作 `tokensRevokedAfter` 欄位 + Middleware 檢查

**優先級**: 低（可接受）

---

## Testing Strategy

### Unit Tests

**Frontend:**
- Composables: `useMemberRole`, `useRolePreview`, `useAccountSecurity`, `usePasswordValidation`
- Components: `MemberRoleManager`, `RolePreviewDialog`, `SetPasswordDialog`, `LoginHistoryDialog`

**Backend:**
- Services: `member.service.ts`, `auth.service.ts`
- Repositories: `role.repository.ts`, `password-reset-token.repository.ts`, `login-log.repository.ts`
- Utils: `cache.ts`

### Integration Tests

- API Routes: 測試完整的 Request/Response 流程
- UserContext Cache: 測試快取清除與重新計算
- Email 發送: 測試 Email 模板與發送邏輯

### E2E Tests

**ST009:**
- 測試完整的角色指派流程（新增、移除、預覽）
- 測試至少一個角色的防呆機制
- 測試批次指派流程

**ST010:**
- 測試完整的密碼重設流程（發送連結 + 會友重設）
- 測試管理員手動設定密碼流程
- 測試強制登出流程
- 測試登入歷史查詢流程

---

## References

### System Architecture
- [Stories Roadmap.md](../Stories%20Roadmap.md)
- [System Architecture Blue Print.md](../System%20Architecture%20Blue%20Print.md)

### Related Stories
- [ST001 - 資料核心與 Schema 定義](../ST001%20-%20資料核心與%20Schema%20定義/Summary.md)
- [ST002 - RBAC Configuration](../ST002%20-%20RBAC%20Configuration/Summary.md)
- [ST004 - 會友資料 CRUD](../ST004%20-%20會友資料%20CRUD/Summary.md)

### Phase Stories
- [ST009 - 角色指派介面](../ST009%20-%20角色指派介面/Summary.md)
- [ST010 - 帳號安全與密碼管理](../ST010%20-%20帳號安全與密碼管理/Summary.md)

### External Resources
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Extensions - Trigger Email](https://extensions.dev/extensions/firebase/firestore-send-email)
- [PrimeVue Documentation](https://primevue.org/)
- [Zod Documentation](https://zod.dev/)

---

**Last Updated**: 2026-02-16  
**Maintained By**: Development Team  
**Version**: 1.0
