// ABOUTME: Starts the Firebase app and hands out its sign-in (Auth) and Realtime Database connections.
// ABOUTME: In dev (npm run dev) both point at the local emulators (npm run emulators), never the real project.

import { initializeApp, type FirebaseApp } from 'firebase/app'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database'

const EMULATOR_HOST = '127.0.0.1'
const AUTH_EMULATOR_PORT = 9099
const DATABASE_EMULATOR_PORT = 9000

interface Backend {
  app: FirebaseApp
  auth: Auth
  database: Database
}

let backend: Backend | undefined

function requiredSetting(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Firebase setting ${name} is missing. Add it to .env.local (or the GitHub Actions secrets).`)
  }
  return value
}

function startBackend(): Backend {
  const env = import.meta.env
  const app = initializeApp({
    apiKey: requiredSetting('VITE_FIREBASE_API_KEY', env.VITE_FIREBASE_API_KEY),
    authDomain: requiredSetting('VITE_FIREBASE_AUTH_DOMAIN', env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: requiredSetting('VITE_FIREBASE_PROJECT_ID', env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: requiredSetting('VITE_FIREBASE_STORAGE_BUCKET', env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: requiredSetting('VITE_FIREBASE_MESSAGING_SENDER_ID', env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: requiredSetting('VITE_FIREBASE_APP_ID', env.VITE_FIREBASE_APP_ID),
    databaseURL: requiredSetting('VITE_FIREBASE_DATABASE_URL', env.VITE_FIREBASE_DATABASE_URL),
  })
  const auth = getAuth(app)
  const database = getDatabase(app)
  if (env.DEV) {
    connectAuthEmulator(auth, `http://${EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`, { disableWarnings: true })
    connectDatabaseEmulator(database, EMULATOR_HOST, DATABASE_EMULATOR_PORT)
  }
  return { app, auth, database }
}

/** The one Firebase connection for the page, started on first use. */
export function firebaseBackend(): Backend {
  backend ??= startBackend()
  return backend
}
