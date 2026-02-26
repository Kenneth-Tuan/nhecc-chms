/**
 * Firebase Admin SDK 輔助工具
 * 提供伺服器端存取 Firebase Auth 與 Firestore 的介面。
 */
import { getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

/**
 * 獲取已初始化的 Firebase Admin App 實例。
 * @throws {Error} 若 SDK 尚未初始化則拋出錯誤。
 */
export function getAdmin() {
  if (!getApps().length) {
    throw new Error("Firebase Admin SDK 尚未初始化");
  }
  return getApp();
}

/**
 * 獲取 Firebase Admin Auth 實例。
 */
export function getAdminAuth() {
  return getAuth(getAdmin());
}

/**
 * 獲取 Firebase Admin Firestore 實例。
 */
export function getAdminFirestore() {
  return getFirestore(getAdmin());
}
