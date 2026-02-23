# Nuxt 4 部署至 Firebase App Hosting 配置指南

> 根據實際踩坑經驗整理，適用於 Nuxt 4 + Firebase App Hosting

---

## 前置條件

- Firebase 專案需升級至 **Blaze（隨用隨付）方案**
- GitHub 存放庫已連結至 Firebase App Hosting 後端

---

## 一、`package.json`

需要確保以下三個 script 都存在：

```json
{
  "scripts": {
    "build": "nuxt build",
    "apphosting:build": "nuxt build --preset=firebase_app_hosting",
    "start": "node .output/server/index.mjs"
  }
}
```

| Script             | 執行時機             | 說明                                                  |
| ------------------ | -------------------- | ----------------------------------------------------- |
| `build`            | 本地手動 build       | 一般開發用途                                          |
| `apphosting:build` | Firebase Cloud Build | **部署時的 build 指令**，Firebase 會優先使用此 script |
| `start`            | Cloud Run 容器啟動   | 啟動 server 的 fallback 指令                          |

> ⚠️ **關鍵**：少了 `apphosting:build`，Firebase 的 buildpack 不會用正確的 preset 進行 build，`.output` 資料夾不會被正確產生，容器啟動時會找不到 entry point。

---

## 二、`nuxt.config.ts`

`nitro` 區塊**不需要特別設定**，整段可以移除。

若要明確指定（可選），只保留 preset，**不要加 `firebase: { gen: 2 }`**：

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  // nitro 整段可以移除，讓 apphosting:build 的 --preset 參數決定
  // 若想保留，只能這樣寫：
  // nitro: {
  //   preset: "firebase_app_hosting",
  // },
  // ❌ 絕對不能這樣寫，會造成衝突：
  // nitro: {
  //   firebase: { gen: 2 },           // ← 這是舊版 Cloud Functions 用的
  //   preset: "firebase_app_hosting", // ← 這是 App Hosting 用的，兩者不相容
  // },
});
```

> `firebase: { gen: 2 }` 是給舊版 **Firebase Cloud Functions** preset 用的設定，和 App Hosting 架構不同，同時存在會導致 port 監聽異常。

---

## 三、`apphosting.yaml`

在專案根目錄建立此檔案，明確指定 run command：

```yaml
# apphosting.yaml
scripts:
  runCommand: node .output/server/index.mjs
  # or yarn start
```

> Cloud Run 啟動容器時，會讀取這裡的 `runCommand`，Nitro 會自動讀取環境變數 `PORT=8080` 並監聽。

---

## 四、常見錯誤對照表

| 錯誤訊息                                                   | 原因                                                               | 解法                                            |
| ---------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| `error Command "start" not found`                          | `package.json` 缺少 `start` script                                 | 加上 `"start": "node .output/server/index.mjs"` |
| `Cannot find module '/workspace/.output/server/index.mjs'` | build 沒有正確執行，`.output` 未產生                               | 加上 `apphosting:build` script                  |
| `Default STARTUP TCP probe failed on port 8080`            | 容器啟動失敗（通常是上面兩個問題的結果）                           | 確認 build 和 run 指令都正確                    |
| port 相關錯誤但本地 8080 正常                              | `nitro` 同時設定了 `firebase.gen` 和 `firebase_app_hosting` preset | 移除 `firebase: { gen: 2 }`                     |

---

## 五、最終檔案結構確認

```
project/
├── apphosting.yaml        ← 新增
├── package.json           ← 確認有 apphosting:build 和 start script
├── nuxt.config.ts         ← nitro 區塊移除或只保留 preset
└── ...
```

---

## 六、部署流程

```
GitHub push → Firebase Cloud Build
  ↓ 執行 apphosting:build（= nuxt build --preset=firebase_app_hosting）
  ↓ 產生 .output/
Cloud Run 啟動容器
  ↓ 執行 runCommand（= node .output/server/index.mjs）
  ↓ Nitro 讀取 PORT=8080 並監聽
部署成功 ✅
```
