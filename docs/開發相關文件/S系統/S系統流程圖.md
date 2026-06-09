```mermaid
sequenceDiagram
autonumber
participant Admin as 管理員 (Admin)
participant Student as 學生 (User A)
participant Teacher as 老師 (User B)
participant System as 系統 (System)

    Note over Admin, System: 階段一：開課準備 (Setup & Allocation) - MVP

    Admin->>System: 1. 建立課程模板 (S101) & 實體班級 (S101-A)
    Admin->>System: 2. 指派老師
    
    alt 學生自行報名
        Student->>System: 3a. 瀏覽課程 & 直接報名班級
    else 管理員後台指派
        Admin->>System: 3b. 搜尋並直接指派學生
    end

    System-->>Student: 發送「開課通知」 (狀態變更: Assigned)
    System-->>Teacher: 發送「授課通知」

    Note over Admin, System: 階段二：學期進行中 (Active Semester)

    Teacher->>System: 4. 第一堂課點擊 "Start Course"
    System->>System: 課程狀態變更為 "In Progress"

    rect rgb(240, 248, 255)
        Note right of Teacher: 每週重複此流程
        Teacher->>System: 5. 產生當日簽到 QR Code
        Note right of Student: 無需先開 App，直接掃碼
        Student->>System: 6. 手機相機掃描 QR Code -> 開啟網頁
        Student->>System: 7. 網頁上點擊 "確認簽到"
        System-->>Teacher: 即時更新出席名單
    end

    opt 特殊狀況處理
        Admin->>System: 手動修正出席紀錄 (若學生手機沒電)
    end

    Note over Admin, System: 階段三：課程結束 (Completion)

    Teacher->>System: 8. 學期結束，點擊 "Conclude Course"
    System->>System: 課程狀態變更為 "Completed"
    System->>Student: 寫入學分紀錄 (History)
```

## MVP 決策紀錄 (2026-06)

為了在 MVP 階段減少管理員的行政工作，並貼近教會現行的實務流程，我們針對「階段一：開課準備」進行了簡化：

1. **取消 Waitlist 中間狀態**：原設計為學生先加入 Waitlist 累積需求，管理員再依此建班並指派。現改為管理員直接建班，學生直接報名班級。
2. **管理員直接指派**：在後台，管理員可直接從 `members` (會友庫) 中搜尋並勾選學生，直接將其加入班級（`ASSIGNED` 狀態）。

> [!NOTE]
> 雖然目前取消了 Waitlist 流程，但後端的 `joinWaitlist` 相關邏輯與 `PENDING_WAITLIST` 狀態仍被保留，以便未來若需重新引入此機制（如收集學生偏好與開課需求預測）時可以快速啟用。
