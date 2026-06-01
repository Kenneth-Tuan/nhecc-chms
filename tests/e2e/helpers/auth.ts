import { Page } from "@playwright/test";

export const TEST_PASSWORD = "Test@12345";

export const SEL = {
  email: 'input[placeholder="Email 或 手機號碼"]',
  password: 'input[placeholder="請輸入密碼"]',
  submit: 'button[type="submit"]',
  toast: ".p-toast-detail",
};

/**
 * 導向登入頁面並等待 Nuxt 完全 Hydration 完畢
 */
export async function gotoLogin(page: Page): Promise<void> {
  await page.goto("/login");
  // 等到 Nuxt 完全 hydrated 完畢，避免 hydration race condition
  await page.waitForFunction(() => (window as any).__NUXT_HYDRATED__ === true, null, { timeout: 30000 });
  await page.waitForSelector(SEL.email, { state: "visible", timeout: 10000 });
}

/**
 * 填寫帳密並送出登入表單
 */
export async function fillAndSubmit(
  page: Page,
  email: string,
  password = TEST_PASSWORD,
): Promise<void> {
  await page.fill(SEL.email, email);
  await page.fill(SEL.password, password);
  await page.click(SEL.submit);
}

/**
 * 執行完整的 UI 登入操作並等待頁面跳轉
 */
export async function login(page: Page, email: string, password = TEST_PASSWORD): Promise<void> {
  await gotoLogin(page);
  await fillAndSubmit(page, email, password);

  // 等待跳轉（依據角色導向 /dashboard 或 /）
  await page.waitForURL((url) => {
    return url.pathname === '/' || url.pathname === '/dashboard';
  }, { timeout: 60000 });
}

/**
 * 登入並儲存狀態至指定路徑 (包含 Cookies 與 SessionStorage)
 */
export async function saveAuthState(
  page: Page,
  email: string,
  statePath: string,
  password = TEST_PASSWORD,
): Promise<void> {
  await login(page, email, password);
  await page.context().storageState({ path: statePath });
}
