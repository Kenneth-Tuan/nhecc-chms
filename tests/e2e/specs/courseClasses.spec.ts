import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Course Class Management Flow", () => {
  test.beforeEach(async ({ page }) => {
    // 登入為管理員
    await login(page, "admin@nhecc.org");
    await page.goto("/dashboard/courses/classes");
    // 確保頁面加載完成
    await expect(page.locator("button:has-text('建立新班級')")).toBeVisible({ timeout: 10000 });
  });

  test("針對有報名學員的班級，應無法看到刪除按鈕", async ({ page }) => {
    // 進入有學員的班級 (2025年第二季如何QT班 - class-s104-2025q2)
    await page.goto("/dashboard/courses/classes/class-s104-2025q2");
    await expect(page.locator("h1:has-text('2025年第二季如何QT班')")).toBeVisible({ timeout: 10000 });

    // 檢查有沒有「刪除班級」的按鈕，預期不應顯示
    await expect(page.locator("button:has-text('刪除班級')")).not.toBeVisible();
  });

  test("針對可刪除的班級，點擊刪除後應成功刪除並導回列表", async ({ page }) => {
    // 進入測試專用的可刪除班級 (class-test-delete)
    await page.goto("/dashboard/courses/classes/class-test-delete");
    await expect(page.locator("h1:has-text('測試刪除專用班級')")).toBeVisible({ timeout: 10000 });

    // 檢查應有「刪除班級」按鈕
    const deleteBtn = page.locator("button:has-text('刪除班級')");
    await expect(deleteBtn).toBeVisible();

    // 點擊刪除
    await deleteBtn.click();

    // 確認刪除的 Dialog 出現
    const dialogTitle = page.locator(".p-dialog-title:has-text('刪除班級確認')");
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // 點擊確認刪除
    await page.click('button:has-text("確認刪除")');

    // 預期跳出 Toast 提示成功，並導回列表
    await expect(page.locator("text=刪除成功")).toBeVisible({ timeout: 5000 });
    await expect(page).toHaveURL(/\/dashboard\/courses\/classes/);
  });
});
