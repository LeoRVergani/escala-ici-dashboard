import type { AppConfig } from './env.js';

export interface FirebaseRuntimeStatus {
  projectId: string;
  configured: boolean;
  emulator: boolean;
}

export function getFirebaseRuntimeStatus(config: AppConfig): FirebaseRuntimeStatus {
  return {
    projectId: config.FIREBASE_PROJECT_ID,
    configured: Boolean(
      config.FIREBASE_PROJECT_ID &&
        (process.env.FIRESTORE_EMULATOR_HOST || config.GOOGLE_APPLICATION_CREDENTIALS),
    ),
    emulator: Boolean(process.env.FIRESTORE_EMULATOR_HOST),
  };
}
