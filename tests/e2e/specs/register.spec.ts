import { test, expect } from "@playwright/test";
import { TEST_PASSWORD } from "../helpers/auth";

test.describe("Registration Flow", () => {
  // ===== 1. 公開自主註冊流程 =====
  test("傳統 Email/Password 自主註冊成功流程 (Step 1 + Step 2)", async ({ page }) => {
    const testEmail = `e2e.register.s1s2.${Date.now()}@example.com`;

    await page.goto("/register");
    await page.locator('input[name="fullName"]').waitFor({ state: "visible" });

    // --- 步驟 1: 帳號資訊 ---
    await page.fill('input[name="fullName"]', "測試註冊員");
    await page.fill('input[name="mobile"]', "0900-111-222");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);

    // 點擊下一步
    await page.click('button[type="submit"]');

    // 驗證是否成功切換到步驟 2 的標題
    await expect(page.locator("h1")).toHaveText("完成個人資料", { timeout: 10000 });

    // --- 步驟 2: 個人資料 ---
    // 選擇性別：PrimeVue SelectButton (Male)
    await page.click('div[name="gender"] >> text=男');

    // 輸入生日 (DatePicker)：這裡使用填寫方式或輸入格式化字串
    await page.fill('input[name="birthDate"]', "1999-09-09");
    await page.press('input[name="birthDate"]', "Enter");

    // 選擇是否受洗 (SelectButton)
    await page.click('div[name="isBaptized"] >> text=是');

    // 輸入受洗日期
    await page.fill('input[name="baptismDate"]', "2020-05-20");
    await page.press('input[name="baptismDate"]', "Enter");

    // 選擇歸屬牧區：PrimeVue Select 元件
    await page.click('div[name="pastoralZone"]');
    // 等待下拉選單載入並選擇第一個選項
    await page.click(".p-select-option:first-child");

    // 選擇歸屬小組
    await page.click('div[name="homeGroup"]');
    await page.click(".p-select-option:first-child");

    // 提交完成註冊
    await page.click('button:has-text("完成註冊並開始使用")');

    // 註冊成功一般會導向首頁 `/`
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("自主註冊可跳過第二步驟個人檔案設定", async ({ page }) => {
    const testEmail = `e2e.register.skip.${Date.now()}@example.com`;

    await page.goto("/register");
    await page.locator('input[name="fullName"]').waitFor({ state: "visible" });

    // --- 步驟 1 ---
    await page.fill('input[name="fullName"]', "跳過資料員");
    await page.fill('input[name="mobile"]', "0900-333-444");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    await expect(page.locator("h1")).toHaveText("完成個人資料", { timeout: 10000 });

    // --- 步驟 2: 點擊跳過按鈕 ---
    await page.click('button:has-text("稍後在個人檔案中完成")');

    // 直接跳轉回首頁
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page).toHaveURL(/\/$/);
  });

  // ===== 2. 受邀註冊流程 =====
  test("有效邀請 Token 應能正常載入表單並成功註冊", async ({ page }) => {
    const testEmail = `e2e.invite.valid.${Date.now()}@example.com`;

    // 使用預先 Seed 的有效 token
    await page.goto(`/register/invite?token=test-valid-invite-token`);

    // 等待表單載入
    await expect(page.locator('input[name="fullName"]')).toBeVisible({ timeout: 5000 });

    // 填寫受邀註冊表單
    await page.fill('input[name="fullName"]', "受邀測試員");
    await page.fill('input[name="mobile"]', "0900-555-666");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', TEST_PASSWORD);
    await page.fill('input[name="confirmPassword"]', TEST_PASSWORD);

    // 點擊完成註冊
    await page.click('button:has-text("完成註冊")');

    // 成功後應登入並引導回首頁
    await page.waitForURL((url) => url.pathname === "/");
    await expect(page).toHaveURL(/\/$/);
  });

  test("過期邀請 Token 應阻擋註冊並顯示錯誤提示", async ({ page }) => {
    await page.goto(`/register/invite?token=test-expired-invite-token`);

    // 應該顯示錯誤畫面
    await expect(page.getByText("此邀請連結已過期")).toBeVisible();

    // 表單不應該存在
    await expect(page.locator('input[name="fullName"]')).not.toBeVisible();
  });

  test("已使用邀請 Token 應阻擋註冊並顯示錯誤提示", async ({ page }) => {
    await page.goto(`/register/invite?token=test-used-invite-token`);

    // 應該顯示錯誤畫面
    await expect(page.getByText("此邀請連結已被使用")).toBeVisible();

    // 表單不應該存在
    await expect(page.locator('input[name="fullName"]')).not.toBeVisible();
  });
});
