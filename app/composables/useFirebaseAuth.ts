/**
 * Firebase 身份驗證 Composable
 * 整合電子信箱、Google、LINE 登入以及會期管理。
 */
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signInWithCustomToken,
  GoogleAuthProvider,
  signOut,
  type Auth,
} from "firebase/auth";
import type { LineProfile } from "./useLiff";

import { useAuthStore } from "~/stores/auth.store";

export function useFirebaseAuth() {
  const { $firebaseAuth } = useNuxtApp();
  const auth = $firebaseAuth as Auth;
  const authStore = useAuthStore();

  const loading = ref(false);
  const error = ref<string | null>(null);
  const pendingLineProfile = ref<LineProfile | null>(null);

  /** 建立 Firebase 會期 Cookie */
  async function createSessionCookie(
    idToken: string,
  ): Promise<{ uid: string; isNewUser: boolean }> {
    return await $fetch<{ uid: string; isNewUser: boolean }>(
      "/api/auth/session",
      {
        method: "POST",
        body: { idToken },
      },
    );
  }

  /** 使用電子信箱登入 */
  async function loginWithEmail(
    email: string,
    password: string,
  ): Promise<{ isNewUser: boolean }> {
    loading.value = true;
    error.value = null;
    try {
      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await credential.user.getIdToken();
      await createSessionCookie(idToken);
      await authStore.loadContext();
      return { isNewUser: false };
    } catch (e: any) {
      error.value = e.code || e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 註冊新帳號 */
  async function registerWithEmail(
    email: string,
    password: string,
  ): Promise<string> {
    loading.value = true;
    error.value = null;
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const idToken = await credential.user.getIdToken();
      await createSessionCookie(idToken);
      return credential.user.uid;
    } catch (e: any) {
      error.value = e.code || e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 使用 Google 彈窗登入 */
  async function loginWithGoogle(): Promise<{
    uid: string;
    isNewUser: boolean;
    displayName: string | null;
    email: string | null;
    photoURL: string | null;
  }> {
    loading.value = true;
    error.value = null;
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      const result = await createSessionCookie(idToken);
      const isNewUser = result.isNewUser;

      if (!isNewUser) {
        await authStore.loadContext();
      }

      return {
        uid: credential.user.uid,
        isNewUser: isNewUser,
        displayName: credential.user.displayName,
        email: credential.user.email,
        photoURL: credential.user.photoURL,
      };
    } catch (e: any) {
      error.value = e.code || e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 使用 LINE (LIFF) 登入 */
  async function loginWithLine(): Promise<{
    uid: string;
    isNewUser: boolean;
    lineProfile: LineProfile | null;
  }> {
    loading.value = true;
    error.value = null;
    try {
      const { loginWithLiff } = useLiff();
      const result = await loginWithLiff();

      if (!result) {
        return { uid: "", isNewUser: false, lineProfile: null };
      }

      const credential = await signInWithCustomToken(auth, result.customToken);
      const idToken = await credential.user.getIdToken();
      await createSessionCookie(idToken);

      if (result.isNewUser) {
        pendingLineProfile.value = result.lineProfile;
      } else {
        await authStore.loadContext();
      }

      return {
        uid: credential.user.uid,
        isNewUser: result.isNewUser,
        lineProfile: result.lineProfile,
      };
    } catch (e: any) {
      error.value = e.code || e.message;
      throw e;
    } finally {
      loading.value = false;
    }
  }

  /** 登出並清除會期 */
  async function logout(): Promise<void> {
    loading.value = true;
    try {
      await signOut(auth);
      await $fetch("/api/auth/logout", { method: "POST" });
      authStore.$reset();
    } finally {
      loading.value = false;
    }
  }

  return {
    loginWithEmail,
    registerWithEmail,
    loginWithGoogle,
    loginWithLine,
    logout,
    loading: readonly(loading),
    error: readonly(error),
    pendingLineProfile,
  };
}
