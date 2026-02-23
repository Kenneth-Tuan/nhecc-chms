import { initializeApp, getApps, cert } from "firebase-admin/app";

export default defineNitroPlugin(() => {
  if (getApps().length) return;

  const credentialJson = process.env.NUXT_FIREBASE_ADMIN_CREDENTIAL;
  if (!credentialJson) {
    console.warn("[Firebase Admin] NUXT_FIREBASE_ADMIN_CREDENTIAL not set, skipping init");
    return;
  }

  try {
    const serviceAccount = JSON.parse(credentialJson);
    initializeApp({ credential: cert(serviceAccount) });
  } catch (e) {
    console.error("[Firebase Admin] Failed to initialize:", e);
  }
});
