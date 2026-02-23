import { getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

export function getAdmin() {
  if (!getApps().length) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return getApp();
}

export function getAdminAuth() {
  return getAuth(getAdmin());
}
