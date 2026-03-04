import { initializeApp, getApps, cert } from "firebase-admin/app";

export default defineNitroPlugin(() => {
  if (getApps().length) return;

  const config = useRuntimeConfig();
  const credentialJson = config.firebaseAdminCredential;

  if (!credentialJson) {
    console.warn(
      "[Firebase Admin] NUXT_FIREBASE_ADMIN_CREDENTIAL not set, skipping init",
    );
    return;
  }

  let serviceAccount: any;

  try {
    // 確保物件是可變的 (Mutable)，Nuxt runtimeConfig 可能是 Read-only
    serviceAccount =
      typeof credentialJson === "string"
        ? JSON.parse(credentialJson)
        : JSON.parse(JSON.stringify(credentialJson));
  } catch (e) {
    console.error(
      "解析 Firebase Service Account 失敗，請檢查格式是否為正確 JSON 字串",
    );
    throw e;
  }

  try {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: config.public.firebaseStorageBucket,
    });
    console.log("[Firebase Admin] Initialized successfully");
  } catch (e) {
    console.error("[Firebase Admin] Failed to initialize:", e);
  }
});
