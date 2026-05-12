# Firebase Emulator 本地測試環境

讓你不碰正式 Firebase，在本地用完整的多角色資料測試所有功能。

---

## 一次性前置安裝

```bash
# 0.（macOS）Firestore Emulator 需要 JDK——firebase-tools 目前要求 **Java 21+**
brew install --cask temurin@21
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
java -version

# 1. 安裝 Firebase CLI（全域）
npm install -g firebase-tools

# 2. 安裝 project devDependencies（dotenv-cli + tsx）
npm install
```

**`firebase login` 可以不用。** CLI 印在螢幕上的「You are not currently authenticated」對本機 Emulator 來說不是阻斷問題；真正有阻斷的是 **沒裝 JDK，或 Java 低於 21**（firebase-tools 現行要求）。

---

## 啟動流程（每次測試）

**需要開三個 terminal：**

### Terminal 1：啟動 Emulator
```bash
npm run emulator:start
```
- Firebase Emulator UI：http://localhost:4000
- Auth Emulator：http://localhost:9099
- Firestore Emulator：http://localhost:8080
- 停止時自動把資料 export 到 `.firebase-data/`，下次啟動自動 import

### Terminal 2：Seed 資料（Emulator 啟動後執行一次即可）
```bash
npm run seed:emulator
```
> 冪等操作，重複執行會清空重建，不用擔心重複資料。

### Terminal 3：啟動 Dev Server（接 Emulator）
```bash
npm run dev:emulator
```

---

## 測試帳號

密碼一律：**`Test@12345`**

| 姓名 | Email | 角色 | 資料範圍 |
|------|-------|------|----------|
| 王管理員 | admin@nhecc.org | 超級管理員 | Global |
| 張恩典 | zhang.grace@nhecc.org | 牧區長 | Zone（社青牧區） |
| 林信望 | lin.faith@nhecc.org | 牧區長 | Zone（家庭牧區） |
| 李喜樂 | li.joy@nhecc.org | 小組長 | Group（喜樂小組） |
| 陳詩恩 | chen.teacher@nhecc.org | 課程老師 | Group（愛家小組 + 詩班） |
| 林會友 | lin.member@nhecc.org | 一般會友 | Self |

---

## 單一瀏覽器切換角色（免多開）

當 `NUXT_PUBLIC_USE_EMULATOR=true`（`npm run dev:emulator`）時，畫面**右下角**會出現 **「Emulator 切換角色」** 浮層：

1. 下拉選 seed 建立的測試帳
2. 按「切換並刷新權限」→ 後端發 **Custom Token** → 與 LINE 邀請註冊相同流程建立 **session cookie**，並重新載入 RBAC context

**不需**再開第二個瀏覽器 profile；若列表空白或切換失敗，請確認已 `npm run seed:emulator` 且 Auth 內有該使用者。

> 安全：此 API 僅在伺服器偵測到 `FIRESTORE_EMULATOR_HOST` / `FIREBASE_AUTH_EMULATOR_HOST` 時啟用。請勿在正式環境的部署上設定這兩個變數。

---

## 資料重置

```bash
# 清除 emulator 資料快照（下次 seed 時會重建）
rm -rf .firebase-data

# 或直接重 seed（不需要重啟 emulator）
npm run seed:emulator
```

---

## 常見問題

**Q: `Process java -version has exited with code 1` / Unable to locate a Java Runtime**

Firestore Emulator 會啟 JVM，必須安裝 **JDK 21 或以上**（舊版 firebase-tools 曾支援 17，現已不支援）。macOS Homebrew 範例：

```bash
brew install --cask temurin@21
export JAVA_HOME=$(/usr/libexec/java_home -v 21)
java -version   # 要能看到 21.x
npm run emulator:start
```

若已裝 GUI 但被導向去 java.com，`java` 仍不在 PATH——照上面設好 `JAVA_HOME` 並確認 `which java`、`java -version`。

**Q: `firebase-tools no longer supports Java version before 21`**

你已裝的是 17 或更舊。請裝 **Temurin 21**（見上），並在同一個 shell 先 `export JAVA_HOME=...` 再跑 `npm run emulator:start`。若同時裝多個 JDK，用 `/usr/libexec/java_home -V` 確認 21 的路徑。

---

**Q: `firebase: command not found`**
```bash
npm install -g firebase-tools
```

**Q: seed 失敗，出現 `ECONNREFUSED`**
確認 `npm run emulator:start` 已完全啟動（看到 "All emulators ready!" 才 seed）。

**Q: dev server 出現 `Firebase Admin SDK 尚未初始化`**
確認是用 `npm run dev:emulator` 啟動，而不是 `npm run dev`。

**Q: 登入後出現 `User not found`**
重新執行 `npm run seed:emulator`，確認 Auth 使用者與 Firestore members 都已建立。

---

## 目錄結構

```
firebase.json          # Emulator ports 設定
.firebaserc            # 預設 project ID
.env.emulator          # Emulator 用 env（無真實憑證，可提交 git）
tsconfig.seed.json     # seed 腳本專用 tsconfig（解析 ~ alias）
scripts/
  seed-emulator.ts     # 一鍵建立 Auth 帳號 + Firestore 資料
server/api/dev/
  emulator-accounts.get.ts   # 測試帳列表（僅 Emulator）
  emulator-switch.post.ts     # 發 Custom Token（僅 Emulator）
server/utils/
  firebase-emulator.ts # 是否為 Emulator 後端
app/components/dev/
  EmulatorAccountSwitcher.vue # 右下角切換 UI
.firebase-data/        # Emulator 自動 export 的資料快照（gitignore）
```
