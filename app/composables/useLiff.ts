/**
 * LINE LIFF 功能 Composable
 * 處理 LIFF 初始化及 LINE 登入。
 */
import liff from "@line/liff";

export interface LineProfile {
  userId: string;
  name: string;
  picture: string;
  email: string;
}

export interface LiffLoginResult {
  customToken: string;
  isNewUser: boolean;
  lineProfile: LineProfile;
}

export function useLiff() {
  const config = useRuntimeConfig();
  const initialized = ref(false);
  const error = ref<string | null>(null);

  /** 初始化 LIFF App */
  async function initLiff(): Promise<void> {
    if (initialized.value) return;
    try {
      await liff.init({ liffId: config.public.liffId as string });
      initialized.value = true;
    } catch (e: any) {
      error.value = e.message || "LIFF init failed";
      throw e;
    }
  }

  /** 執行 LINE 登入流程 */
  async function loginWithLiff(): Promise<LiffLoginResult | null> {
    await initLiff();

    if (!liff.isLoggedIn()) {
      liff.login();
      return null;
    }

    const idToken = liff.getIDToken();
    if (!idToken) {
      throw new Error("Failed to get LINE ID token");
    }

    try {
      const result = await $fetch<LiffLoginResult>("/api/auth/line-token", {
        method: "POST",
        body: { idToken },
      });
      return result;
    } catch (e: any) {
      // 若後端回傳 Token 過期，則清除 LIFF 登入狀態並重新進行 LIFF 登入
      const isTokenExpired =
        e.response?.status === 401 &&
        e.response?._data?.data?.reason === "token_expired";

      if (isTokenExpired) {
        liffLogout();
        liff.login();
        return null;
      }
      throw e;
    }
  }

  /** LINE 登出 */
  function liffLogout(): void {
    if (liff.isLoggedIn()) {
      liff.logout();
    }
  }

  return {
    initLiff,
    loginWithLiff,
    liffLogout,
    initialized: readonly(initialized),
    error: readonly(error),
  };
}
