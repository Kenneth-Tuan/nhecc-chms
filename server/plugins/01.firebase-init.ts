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

  try {
    initializeApp({ credential: cert(credentialJson) });
    console.log("[Firebase Admin] Initialized successfully");
  } catch (e) {
    console.error("[Firebase Admin] Failed to initialize:", e);
  }
});
