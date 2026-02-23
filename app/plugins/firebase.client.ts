import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig().public;

  const firebaseConfig = {
    apiKey: config.firebaseApiKey,
    authDomain: config.firebaseAuthDomain,
    projectId: config.firebaseProjectId,
    storageBucket: config.firebaseStorageBucket,
    messagingSenderId: config.firebaseMessagingSenderId,
    appId: config.firebaseAppId,
  };

  const app = getApps().length
    ? getApps()[0]
    : initializeApp(firebaseConfig);

  const auth = getAuth(app);

  return {
    provide: {
      firebaseAuth: auth,
    },
  };
});
