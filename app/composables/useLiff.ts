import liff from "@line/liff";

export interface LineProfile {
  name: string;
  picture: string;
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

    const result = await $fetch<LiffLoginResult>("/api/auth/line-token", {
      method: "POST",
      body: { idToken },
    });

    return result;
  }

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
