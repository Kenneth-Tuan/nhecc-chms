import { test, expect } from "@playwright/test";
import { gotoLogin, fillAndSubmit, SEL, TEST_PASSWORD } from "../helpers/auth";

const ADMIN_EMAIL = "admin@nhecc.org";

// ─── Tests ────────────────────────────────────────────────────────────────────
test.describe("Login Flow", () => {
  test.beforeEach(async ({ page }) => {
    await gotoLogin(page);
  });

  test("admin 登入成功應重導向至 /dashboard", async ({ page }) => {
    await fillAndSubmit(page, ADMIN_EMAIL, TEST_PASSWORD);
    // admin 在 seed 裡有 dashboard 權限，應跳到 /dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("空白帳密送出不應離開 /login", async ({ page }) => {
    // 不填任何欄位直接送出
    await page.click(SEL.submit);
    // handleLogin 在 account/password 為空時直接 return，不送 API
    await expect(page).toHaveURL(/\/login/);
  });

  test("只填帳號不填密碼不應離開 /login", async ({ page }) => {
    await page.fill(SEL.email, ADMIN_EMAIL);
    await page.click(SEL.submit);
    await expect(page).toHaveURL(/\/login/);
  });

  test("錯誤密碼應顯示 Toast 錯誤訊息", async ({ page }) => {
    await fillAndSubmit(page, ADMIN_EMAIL, "WrongPassword999");
    const toast = page.locator(SEL.toast);
    await expect(toast).toBeVisible({ timeout: 10000 });
    await expect(toast).toHaveText("密碼錯誤");
  });

  test("不存在帳號應顯示 Toast 錯誤訊息", async ({ page }) => {
    await fillAndSubmit(page, "nobody@nhecc.org", TEST_PASSWORD);
    const toast = page.locator(SEL.toast);
    await expect(toast).toBeVisible({ timeout: 10000 });
    // Firebase emulator 統一回 invalid-credential
    const validMessages = [
      "帳號或密碼錯誤",
      "找不到此帳號",
      "登入失敗，請稍後再試",
    ];
    const text = await toast.innerText();
    expect(validMessages).toContain(text.trim());
  });
});
