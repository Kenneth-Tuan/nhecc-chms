/**
 * 判斷 Nitro 是否正連線至 Firebase Emulator（Auth / Firestore）。
 * 僅在本機 dev + 設好 env 時為 true；正式部署不應設定這兩個變數。
 */
export function isFirebaseEmulatorBackend(): boolean {
  return !!(
    process.env.FIRESTORE_EMULATOR_HOST ||
    process.env.FIREBASE_AUTH_EMULATOR_HOST
  );
}
