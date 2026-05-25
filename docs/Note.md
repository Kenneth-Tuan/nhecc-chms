1. 在建立實體班級指定老師的時候，需要檢查該班級上課的時間跟老師的時間表是否有衝突，提供一個初步的判斷。但其實應該私下就先確認好時段。

# courseClass & template 連動問題

課程目前對應的模板是直接透過建立課程時儲存的 templateId 來即時取得當前的 templateId 對應的資料，會有以下疑慮：

- 今後 template 修改內容的話，過去所有的課程仍舊會關聯到新的 template 內容
- 若是 templateId 刪除的話，課程會找不到 template，會發生什麼事？
- 要改為做成 cache data 嗎？

## 結論（先講）

**只存 `templateId`、每次讀都 join template** 在「template 是活文件、所有班級都該跟著最新定義走」時合理。  
**開班時把 template 內容快照進 class** 在「班級是獨立 offering、歷史與合約不能因後台改 template 而變」時更合理。  
很多 LMS / 排課系統會走 **混合**：平常 reference，在 **publish / 開課 / lock** 時打快照或存 `templateVersion`。

---

## 只存 reference（你現在這種）

**優點**

- 單一真相來源，改 template 一次全班級「跟上」。
- 儲存小、沒冗餘，template 結構演進時不用 migration 每一筆 class。
- 適合「template 就是課程定義，class 只是時間/名額殼」的模型。

**缺點 / 容易漏想的**

- **語意會回溯改變**：已結束的班、已印出的 syllabus、已簽的合約，若仍顯示「當下 template」，和當年實際開課內容可能不一致。
- **破壞性變更**：刪欄位、改 prerequisite、改評量方式，可能讓「進行中」的班行為怪掉或報錯。
- **刪 template / 換 id**：orphan 或要 soft-delete 策略。
- **合規 / 稽核**：「學生報名時看到什麼」難重現，除非另有 event log。

---

## 建立時整份 snapshot 進 class

**優點**

- **每個 offering 獨立**，後台大改 template 不影響已開/已結班。
- 稽核、爭議、重印證明較直覺。
- template 可大改甚至刪除，舊班仍自洽。

**缺點**

- 資料重複、document 變大；template 修 typo 不會自動修到舊班。
- 若 UI 仍混用「讀 template 的某段 + 讀 class 的某段」，容易 **雙軌邏輯**、bug 多。
- schema 變更時，舊 snapshot 要不要 migration、怎麼讀舊版，要想清楚。

---

## 常見折衷（實務上常贏）

1. **存 `templateId` + `templateVersion`（或 `snapshotAt`）**：讀取時用「當時那一版」還原內容；新版本 template 不影響舊班。
2. **只快照「會影響合約/學習路徑」的欄位**（名稱、大綱、prerequisite、時數），其餘仍 reference。
3. **在 publish / 第一堂課開始 / enrollment lock 時打快照**，之前仍可跟 template 同步更新草稿班。

---

## 怎麼選（一句話）

- Template 是 **產品目錄、隨時會改、班級只是實例** → reference 合理。
- Class 是 **法律/教學上的獨立開課單位** → snapshot 或 version 較安全。
- 兩邊都要 → **reference + 版本化快照** 最穩，成本也最高一點。

你描述的「template 一改，所有指到該 id 的 class 都跟著變」不是錯，而是 **刻意選了「單一 live template」語意**；若產品上不能接受「已開班的內容事後被改」，就要加版本或快照，而不是二選一非黑即白。

---

**Sources:** 常見 CMS/LMS 設計慣例（內容版本 vs 引用）、事件溯源與稽核需求的一般工程討論；無特定單一文件連結。

# 我做錯了的事情

1. scope 一開始設定太大，應該先把主要功能流程（建立課程、選課）做好就可以。

# 今後演進方向

1. 後台採用 vben
   https://deepwiki.com/vbenjs/vue-vben-admin
   https://doc.vben.pro/
   https://github.com/Kenneth-Tuan/vue-vben-admin

# casl 跟 rbac 的功能算是重複了嗎？

**不重複，職責完全不同。** 它們是互補的兩層：

| | [casl/ability.ts](file:///Users/kennethtuan/projects/nhecc-chms/app/utils/casl/ability.ts) | [rbac/permissions.ts](file:///Users/kennethtuan/projects/nhecc-chms/app/utils/rbac/permissions.ts) |
|---|---|---|
| **本質** | **Runtime 權限引擎** — 將 `UserContext` 轉成 CASL `Ability` 實例，用於執行時期的 `can(action, subject)` 判斷 | **靜態常數 & UI 輔助** — 權限 key 列表、中文 label、分組、scope 選項等 metadata |
| **消費者** | Server middleware (`02.rbac.ts`)、Service 層 (`member.service.ts`, `courseClass.service.ts`)、Client plugin (`casl.ts`)、Auth store | 角色表單 UI (`RoleFormFields.vue`, 角色 CRUD 頁面) |
| **做的事** | 決定「這個使用者**能不能**做某件事」 | 提供「系統有**哪些權限可以勾選**」給管理介面渲染 |

簡單說：

- `rbac/permissions.ts` = **定義有哪些權限、怎麼顯示**（給管理員設定角色用的 UI 常數）
- `casl/ability.ts` = **根據使用者實際的權限，建構可查詢的 Ability 物件**（runtime enforcement）

一個是 **config/metadata**，一個是 **enforcement engine**，兩者缺一不可。如果硬要合併反而會讓 UI 常數跟 runtime 邏輯耦合在一起，沒好處。