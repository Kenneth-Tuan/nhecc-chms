import { test, expect } from "@playwright/test";
import { login } from "../helpers/auth";

test.describe("Members Dashboard Flow", () => {
  test.beforeEach(async ({ page }) => {
    page.on("response", async response => {
      if (response.url().includes("/api/members")) {
        try {
          console.log(`[API Response] ${response.url()}: ${response.status()} ${JSON.stringify(await response.json())}`);
        } catch {}
      }
    });
    // 登入為管理員，具備完整權限，並導向 /dashboard/members
    await login(page, "admin@nhecc.org");
    await page.goto("/dashboard/members");
    // 確保頁面初始加載完成（避免在 loading 狀態下點擊 disabled 搜尋按鈕）
    await expect(page.locator("text=戴觀望")).toBeVisible({ timeout: 10000 });
  });

  test("會友管理清單應正確渲染資料並分頁", async ({ page }) => {
    // 檢查標題與會友清單表格是否可見
    await expect(page.locator("main h1")).toHaveText("會友管理");
    
    // 檢查清單是否渲染了 Mock 會友姓名（例如：戴觀望）
    const memberNameCell = page.locator("text=戴觀望");
    await expect(memberNameCell).toBeVisible({ timeout: 10000 });

    // 檢查分頁器資訊是否正確顯示
    const paginatorText = page.locator("span:has-text('顯示')");
    await expect(paginatorText).toBeVisible();
  });

  test("搜尋姓名應能正確過濾會友清單", async ({ page }) => {
    // 選擇「姓名」搜尋（預設）
    await page.fill('input[placeholder="搜尋姓名..."]', "趙恩慈");
    await page.click('button:has-text("搜尋")');

    // 清單應只出現 趙恩慈，不應出現其他會友 (如 孫信實)
    await expect(page.locator("text=趙恩慈")).toBeVisible();
    await expect(page.locator("text=孫信實")).not.toBeVisible();

    // 點擊「清除」按鈕
    await page.click('button:has-text("清除")');

    // 清單應恢復並能看到其他會友
    await expect(page.locator("text=戴觀望")).toBeVisible({ timeout: 5000 });
  });

  test("點擊會友 Row 應打開 Quick View 預覽彈窗並能成功關閉", async ({ page }) => {
    // 先搜尋 趙恩慈 確保其出現在第一頁
    await page.fill('input[placeholder="搜尋姓名..."]', "趙恩慈");
    await page.click('button:has-text("搜尋")');

    // 點擊會友 趙恩慈 這行觸發彈窗
    await page.click("text=趙恩慈");

    // 預期 Quick View 彈窗會顯示，且標題為該會友的姓名
    const dialogHeader = page.locator(".p-dialog-title");
    await expect(dialogHeader).toHaveText("趙恩慈", { timeout: 8000 });

    // 驗證基本資料頁籤是否成功渲染手機號碼等資料
    await expect(page.locator('text="基本資料"')).toBeVisible();

    // 點擊 Dialog 的關閉按鈕
    await page.click('.p-dialog-header-close');

    // 彈窗應關閉
    await expect(dialogHeader).not.toBeVisible();
  });

  test("點擊新增會友應導向新增頁面", async ({ page }) => {
    await page.click('button:has-text("新增會友")');
    await page.waitForURL(/\/dashboard\/members\/create/);
    await expect(page).toHaveURL(/\/dashboard\/members\/create/);
  });

  test("點擊編輯會友應導向編輯頁面", async ({ page }) => {
    // 先搜尋 趙恩慈 確保其出現在第一頁
    await page.fill('input[placeholder="搜尋姓名..."]', "趙恩慈");
    await page.click('button:has-text("搜尋")');

    // 找到「趙恩慈」這一行對應的編輯按鈕並點擊 (使用 pi-pencil 圖示按鈕)
    // 我們可以定位包含趙恩慈的 Row，然後點擊其中的編輯按鈕
    const row = page.locator("tr:has-text('趙恩慈')");
    await row.locator(".pi-pencil").click();

    await page.waitForURL(/\/dashboard\/members\/edit\//);
    await expect(page.url()).toContain("/dashboard/members/edit/");
  });

  test("點擊刪除會友應彈出確認對話框並可取消", async ({ page }) => {
    // 先搜尋 趙恩慈 確保其出現在第一頁
    await page.fill('input[placeholder="搜尋姓名..."]', "趙恩慈");
    await page.click('button:has-text("搜尋")');

    // 找到「趙恩慈」這一行對應的刪除按鈕並點擊 (使用 pi-trash 圖示按鈕)
    const row = page.locator("tr:has-text('趙恩慈')");
    await row.locator(".pi-trash").click();

    // 驗證刪除 Dialog 標題為「確認刪除」或有相關刪除警告
    const dialogTitle = page.locator(".p-dialog-title:has-text('確認')");
    await expect(dialogTitle).toBeVisible({ timeout: 5000 });

    // 點擊取消刪除 (Dialog 的取消按鈕，通常有「取消」或「No」)
    await page.click('button:has-text("取消")');

    // 對話框應消失
    await expect(dialogTitle).not.toBeVisible();
  });
});
