import { initializeApp } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentSingleTabManager, memoryLocalCache, doc, getDocFromServer } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

let dbInstance;
try {
  // Use memoryLocalCache to prevent Firestore from falling back to WebStorage/localStorage for its persistent cache,
  // which causes QuotaExceededErrors and unhandled AsyncQueue crashes when there are too many offline mutations.
  // Our application already implements custom, light-weight offline replication in useCollectionSync and useSyncedState.
  dbInstance = initializeFirestore(app, {
    localCache: memoryLocalCache()
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  console.warn("Failed to initialize Firestore with memory cache, falling back to default configuration", e);
  dbInstance = initializeFirestore(app, {}, firebaseConfig.firestoreDatabaseId);
}

export const db = dbInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

/**
 * Calculates the weekday for a given date string (YYYY-MM-DD).
 * Returns the weekday in German (e.g., "Sonntag, 12.07.2026").
 */
export function getWeekdayLabel(dateStr: string): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return '';
  
  const days = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const dayName = days[date.getDay()];
  const formattedDate = date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
  
  return `${dayName}, ${formattedDate}`;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errStr = error instanceof Error ? error.message : String(error);
  const isQuotaError = errStr.includes('Quota limit exceeded') || errStr.toLowerCase().includes('quota');
  const isPermissionError = errStr.toLowerCase().includes('permission') || errStr.toLowerCase().includes('denied');

  const errInfo: FirestoreErrorInfo = {
    error: errStr,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }

  if (isQuotaError) {
    console.warn('Firestore Quota Error: ', JSON.stringify(errInfo));
  } else {
    console.error('Firestore Error: ', JSON.stringify(errInfo));
  }
  
  // Dispatch event for UI
  window.dispatchEvent(new CustomEvent('fca_sync_error', { 
    detail: { 
      error: errStr,
      operationType,
      path
    } 
  }));

  if (isPermissionError) {
    throw new Error(JSON.stringify(errInfo));
  }
}

/**
 * Guard function to check if query parameter/value is valid.
 * Returns true if the parameter is not null and not undefined.
 */
export function isQueryParamValid(param: any): boolean {
  return param !== undefined && param !== null;
}

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if(error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. ");
    }
  }
}
testConnection();
