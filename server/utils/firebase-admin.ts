import { getApps, getApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getAdmin() {
  if (!getApps().length) {
    throw new Error("Firebase Admin SDK not initialized");
  }
  return getApp();
}

export function getAdminAuth() {
  return getAuth(getAdmin());
}

export function getAdminFirestore() {
  return getFirestore(getAdmin());
}
