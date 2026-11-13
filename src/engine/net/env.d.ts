// ABOUTME: Types for the Firebase settings Vite reads from .env.local (and the GitHub Actions secrets on deploy).
// ABOUTME: Each is undefined when its line is missing, so firebase.ts checks them before use.

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string
  readonly VITE_FIREBASE_PROJECT_ID?: string
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string
  readonly VITE_FIREBASE_APP_ID?: string
  readonly VITE_FIREBASE_DATABASE_URL?: string
}
