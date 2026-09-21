
Usecollectionsync · TS
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  getLocalCollection,
  saveLocalCollection,
  enqueueSyncOperation,
  isQuotaError,
  markQuotaExceeded,
  isQuotaExceededActive
} from '../lib/offlineStorage';
import {
  PLAYERS as INITIAL_PLAYERS,
  COMPETITIVE_MATCHES,
  TEST_MATCHES,
  SCOUTING_DATA as INITIAL_SCOUTING,
  INITIAL_FINANCE_DATA,
  INITIAL_MEETINGS_DATA,
  INITIAL_TRAINING_SESSIONS,
  INITIAL_SUMMER_PREP,
  INITIAL_WINTER_PREP,
  YEARLY_PLAN,
  DEPTH_CHART,
  FINANCE_META,
  INITIAL_FORMATION,
  CARD_RECORDS,
  COMPETITIVE_MINUTES,
  TEST_MINUTES,
  INITIAL_MATCH_ANALYSES
} from '../constants';
 
/* -------------------------------------------------------------------------- */
/*  Error helpers                                                             */
/* -------------------------------------------------------------------------- */
 
// Ensures Firestore quota errors always contain 'Quota limit exceeded' (used by firebase.ts and App.tsx UI)
export function wrappedError(err: any): any {
  if (isQuotaError(err)) {
    const originalMessage = err instanceof Error ? err.message : String(err);
    if (!originalMessage.toLowerCase().includes('quota limit exceeded')) {
      const newErr = new Error(`Quota limit exceeded: ${originalMessage}`);
      (newErr as any).code = err?.code || 'resource-exhausted';
      return newErr;
    }
  }
  return err;
}
 
// Safe write: THROWS when quota is exceeded, so callers never believe a skipped write succeeded.
export async function safeWrite<T>(writeOp: () => Promise<T>): Promise<T> {
  if (isQuotaExceededActive()) {
    throw new Error('Quota limit exceeded: write skipped (offline mode)');
  }
  try {
    return await writeOp();
  } catch (err) {
    if (isQuotaError(err)) {
      markQuotaExceeded();
    }
    throw err;
  }
}
 
// For fire-and-forget code paths: handleFirestoreError may throw, which must never become an unhandled rejection.
function reportErrorSafe(err: any, op: OperationType, path: string) {
  try {
    handleFirestoreError(wrappedError(err), op, path);
  } catch (e) {
    console.error(`[sync] ${path}:`, e);
  }
}
 
const canWriteNow = () => !isQuotaExceededActive() && navigator.onLine;
 
/* -------------------------------------------------------------------------- */
/*  Small utilities                                                           */
/* -------------------------------------------------------------------------- */
 
// Firestore throws on `undefined` values -> remove them recursively.
function stripUndefined(value: any): any {
  if (Array.isArray(value)) {
    return value.filter((v) => v !== undefined).map(stripUndefined);
  }
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const out: any = {};
    for (const k of Object.keys(value)) {
      if (value[k] !== undefined) out[k] = stripUndefined(value[k]);
    }
    return out;
  }
  return value;
}
 
function sortItems<T>(items: T[], sortField: string | undefined, sortDirection: 'asc' | 'desc'): T[] {
  if (!sortField) return items;
  return [...items].sort((a: any, b: any) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA === undefined && valB === undefined) return 0;
    if (valA === undefined) return 1;
    if (valB === undefined) return -1;
    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}
 
function persistCollection(collectionName: string, items: any[]) {
  void saveLocalCollection(collectionName, items);
  try {
    localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(items));
  } catch (storageError) {
    console.warn(`localStorage quota exceeded or blocked for fca_col_${collectionName}`, storageError);
  }
}
 
// Persistent sets of ids (pending deletes)
const pendingDeleteKey = (c: string) => `fca_pending_delete_${c}`;
function readIdSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr.map(String));
    }
  } catch (e) {
    console.warn(`Error reading ${key}`, e);
  }
  return new Set();
}
function writeIdSet(key: string, set: Set<string>) {
  try {
    if (set.size === 0) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.warn(`Error writing ${key}`, e);
  }
}
function addPendingDelete(collectionName: string, id: string) {
  const s = readIdSet(pendingDeleteKey(collectionName));
  s.add(id);
  writeIdSet(pendingDeleteKey(collectionName), s);
}
function removePendingDelete(collectionName: string, id: string) {
  const s = readIdSet(pendingDeleteKey(collectionName));
  if (s.delete(id)) writeIdSet(pendingDeleteKey(collectionName), s);
}
 
// "Seeded" flag: initial/legacy data has been uploaded to Firestore once from this device
const seededKey = (c: string) => `fca_seeded_${c}`;
const isSeeded = (c: string) => localStorage.getItem(seededKey(c)) === '1';
const markSeeded = (c: string) => {
  try {
    localStorage.setItem(seededKey(c), '1');
  } catch (e) {
    console.warn('Could not persist seeded flag', e);
  }
};
 
// Guards against duplicate parallel writes
const inFlightWrites = new Set<string>();
const seedingCollections = new Set<string>();
 
/* -------------------------------------------------------------------------- */
/*  Initial / legacy data                                                     */
/* -------------------------------------------------------------------------- */
 
const normalizeDate = (dateStr: string) => {
  if (!dateStr) return '';
  if (dateStr.includes('.')) {
    const [d, m, y] = dateStr.split('.');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  return dateStr;
};
 
const getYearlyPlanArray = () => {
  if (!YEARLY_PLAN) return [];
  return Object.entries(YEARLY_PLAN).map(([date, plan]) => {
    const norm = normalizeDate(date);
    return { ...(plan as any), id: norm, date: norm };
  });
};
 
function getLegacyKey(collectionName: string): string | null {
  switch (collectionName) {
    case 'spieler': return 'players';
    case 'training': return 'training';
    case 'spiele': return 'spiele';
    case 'budget_finanz': return 'financeData';
    case 'attendance': return 'attendance';
    case 'competitive_matches': return 'competitiveMatches';
    case 'competitive_minutes': return 'competitiveMinutes';
    case 'test_matches': return 'testMatches';
    case 'test_minutes': return 'testMinutes';
    case 'card_records': return 'cardRecords';
    case 'scouting_candidates': return 'scoutingCandidates';
    case 'meetings_data': return 'meetingsData';
    case 'training_sessions': return 'trainingSessions';
    case 'individual_training': return 'individualTrainingData';
    case 'run_records': return 'runRecords';
    case 'physio_entries': return 'physioEntries';
    case 'vorbereitung_sommer': return 'summerPrep';
    case 'vorbereitung_winter': return 'winterPrep';
    default: return null;
  }
}
 
function getInitialFallback(collectionName: string): any[] {
  const legacyKey = getLegacyKey(collectionName);
  if (legacyKey) {
    const legacyData = localStorage.getItem(`fca_${legacyKey}`);
    if (legacyData) {
      try {
        const parsed = JSON.parse(legacyData);
        if (Array.isArray(parsed) && parsed.length > 0) {
          console.log(`Recovered legacy data for ${collectionName} from local storage key fca_${legacyKey}`);
          return parsed;
        }
      } catch (e) {
        console.error(`Error parsing legacy data for ${collectionName}`, e);
      }
    }
  }
 
  switch (collectionName) {
    case 'spieler':
      return INITIAL_PLAYERS || [];
    case 'competitive_matches':
      return COMPETITIVE_MATCHES || [];
    case 'test_matches':
      return TEST_MATCHES || [];
    case 'scouting_candidates':
      return INITIAL_SCOUTING || [];
    case 'budget_finanz':
      return INITIAL_FINANCE_DATA || [];
    case 'meetings_data':
      return INITIAL_MEETINGS_DATA || [];
    case 'training_sessions':
      return INITIAL_TRAINING_SESSIONS || [];
    case 'vorbereitung_sommer':
      return INITIAL_SUMMER_PREP || [];
    case 'vorbereitung_winter':
      return INITIAL_WINTER_PREP || [];
    case 'yearly_plan':
      return getYearlyPlanArray();
    case 'depth_chart':
      return DEPTH_CHART && Object.keys(DEPTH_CHART).length > 0 ? [{ id: 'main', ...DEPTH_CHART }] : [];
    case 'finance_meta':
      return FINANCE_META && Object.keys(FINANCE_META).length > 0 ? [{ id: 'current', ...FINANCE_META }] : [];
    case 'formation':
      return INITIAL_FORMATION ? [{ id: 'current', value: INITIAL_FORMATION }] : [];
    case 'card_records':
      return CARD_RECORDS || [];
    case 'competitive_minutes':
      return COMPETITIVE_MINUTES || [];
    case 'test_minutes':
      return TEST_MINUTES || [];
    case 'match_analyses':
      return INITIAL_MATCH_ANALYSES || [];
    default:
      return [];
  }
}
 
// Loads the initial state: localStorage cache + legacy data, otherwise built-in fallback.
function loadInitial(collectionName: string, idField: string): any[] {
  let currentCached: any[] = [];
  const local = localStorage.getItem(`fca_col_${collectionName}`);
  if (local) {
    try {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed)) currentCached = parsed;
    } catch (e) {
      console.error(`Error parsing cached collection ${collectionName}`, e);
    }
  }
 
  const legacyKey = getLegacyKey(collectionName);
  if (legacyKey) {
    const legacyData = localStorage.getItem(`fca_${legacyKey}`);
    if (legacyData) {
      try {
        const parsedLegacy = JSON.parse(legacyData);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const merged = [...currentCached];
          let addedCount = 0;
          for (const legacyItem of parsedLegacy) {
            const legacyId = String(legacyItem[idField] || legacyItem.id || '');
            if (!legacyId) continue;
            const exists = merged.some((x: any) => String(x[idField] || x.id || '') === legacyId);
            if (!exists) {
              merged.push(legacyItem);
              addedCount++;
            }
          }
          if (addedCount > 0) {
            console.log(`Recovered and merged ${addedCount} legacy items for ${collectionName}.`);
            try {
              localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(merged));
            } catch (e) {
              console.error(`Error writing merged recovery for ${collectionName} to localStorage`, e);
            }
            currentCached = merged;
          }
        }
        localStorage.removeItem(`fca_${legacyKey}`);
      } catch (e) {
        console.error(`Error parsing legacy data for ${collectionName}`, e);
        localStorage.removeItem(`fca_${legacyKey}`);
      }
    }
  }
 
  if (currentCached.length > 0) return currentCached;
 
  const fallback = getInitialFallback(collectionName);
  if (fallback.length > 0) {
    try {
      localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(fallback));
    } catch (e) {
      console.error(`Error writing fallback for ${collectionName} to localStorage`, e);
    }
  }
  return fallback;
}
 
/* -------------------------------------------------------------------------- */
/*  Image optimisation                                                        */
/* -------------------------------------------------------------------------- */
 
const compressLargeImageString = (base64: string, maxDim = 300, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof base64 !== 'string' || !base64.startsWith('data:image/')) {
      resolve(base64);
      return;
    }
    if (base64.length < 130000) {
      resolve(base64);
      return;
    }
 
    const img = new Image();
    img.src = base64;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
 
      if (width > height) {
        if (width > maxDim) {
          height = Math.round(height * (maxDim / width));
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round(width * (maxDim / height));
          height = maxDim;
        }
      }
 
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
      }
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64);
  });
};
 
const optimizeItems = async (items: any[], idField: string): Promise<{ optimized: any[]; changed: boolean }> => {
  let changed = false;
  const optimized = [...items];
  for (let i = 0; i < optimized.length; i++) {
    const item = { ...optimized[i] };
    let itemChanged = false;
    for (const key of Object.keys(item)) {
      const val = item[key];
      if (typeof val === 'string' && val.startsWith('data:image/') && val.length >= 130000) {
        const compressed = await compressLargeImageString(val);
        if (compressed !== val) {
          item[key] = compressed;
          itemChanged = true;
          changed = true;
        }
      } else if (Array.isArray(val)) {
        const newArr = [...val];
        let arrChanged = false;
        for (let j = 0; j < newArr.length; j++) {
          const subVal = newArr[j];
          if (typeof subVal === 'string' && subVal.startsWith('data:image/') && subVal.length >= 130000) {
            const compressed = await compressLargeImageString(subVal, 800, 0.75);
            if (compressed !== subVal) {
              newArr[j] = compressed;
              arrChanged = true;
              changed = true;
            }
          }
        }
        if (arrChanged) {
          item[key] = newArr;
          itemChanged = true;
        }
      }
    }
    if (itemChanged) optimized[i] = item;
  }
  return { optimized, changed };
};
 
/* -------------------------------------------------------------------------- */
/*  Item comparison                                                           */
/* -------------------------------------------------------------------------- */
 
const normalizeForComparison = (obj: any, idField: string): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const arr = obj
      .map((item) => normalizeForComparison(item, idField))
      .filter((item) => item !== null && item !== undefined && item !== '');
    return arr.length > 0 ? arr : null;
  }
  const result: any = {};
  let hasKeys = false;
  for (const key of Object.keys(obj)) {
    if (key === '_dirty' || key === idField) continue;
    const val = obj[key];
    if (val === undefined || val === null || val === '') continue;
    const norm = normalizeForComparison(val, idField);
    if (norm !== null && norm !== undefined && norm !== '') {
      result[key] = norm;
      hasKeys = true;
    }
  }
  return hasKeys ? result : null;
};
 
const getSortedJSON = (obj: any): string => {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return JSON.stringify(obj);
  if (Array.isArray(obj)) return '[' + obj.map(getSortedJSON).join(',') + ']';
  const keys = Object.keys(obj).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + getSortedJSON(obj[k])).join(',') + '}';
};
 
const areItemsEqual = (a: any, b: any, idField: string): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  try {
    return getSortedJSON(normalizeForComparison(a, idField)) === getSortedJSON(normalizeForComparison(b, idField));
  } catch (e) {
    console.warn('Error comparing items in areItemsEqual:', e);
    return false;
  }
};
 
/* -------------------------------------------------------------------------- */
/*  Firestore write helpers                                                   */
/* -------------------------------------------------------------------------- */
 
// Pushes a locally modified item to Firestore (used for retries from the snapshot merge).
async function pushLocalItem(collectionName: string, idField: string, localItem: any) {
  const id = String(localItem[idField]);
  const key = `${collectionName}/${id}`;
  if (inFlightWrites.has(key)) return;
  inFlightWrites.add(key);
  try {
    const data = { ...localItem };
    delete data[idField];
    delete data._dirty;
    await safeWrite(() => setDoc(doc(db, collectionName, id), stripUndefined(data), { merge: true }));
  } catch (err) {
    reportErrorSafe(err, OperationType.WRITE, key);
  } finally {
    inFlightWrites.delete(key);
  }
}
 
// Uploads initial / legacy items ONCE when Firestore is confirmed empty (server data, not cache).
async function seedCollection(collectionName: string, idField: string, items: any[]) {
  const valid = items.filter((i) => i && i[idField] !== undefined && i[idField] !== null && i[idField] !== '');
  for (let i = 0; i < valid.length; i += 400) {
    const batch = writeBatch(db);
    valid.slice(i, i + 400).forEach((item) => {
      const data = { ...item };
      delete data[idField];
      delete data._dirty;
      batch.set(doc(db, collectionName, String(item[idField])), stripUndefined(data), { merge: true });
    });
    await safeWrite(() => batch.commit());
  }
  console.log(`Seeded ${valid.length} items into Firestore collection ${collectionName}`);
}
 
async function retryPendingDelete(collectionName: string, id: string) {
  const key = `${collectionName}/${id}#delete`;
  if (inFlightWrites.has(key)) return;
  inFlightWrites.add(key);
  try {
    await safeWrite(() => deleteDoc(doc(db, collectionName, id)));
    removePendingDelete(collectionName, id);
  } catch (err) {
    reportErrorSafe(err, OperationType.DELETE, `${collectionName}/${id}`);
  } finally {
    inFlightWrites.delete(key);
  }
}
 
/* -------------------------------------------------------------------------- */
/*  Hook                                                                      */
/* -------------------------------------------------------------------------- */
 
export function useCollectionSync<T>(
  collectionName: string,
  idField: keyof T = 'id' as keyof T,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'asc',
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>(() => loadInitial(collectionName, String(idField)) as unknown as T[]);
  const dataRef = useRef<T[]>(data);
  const prevCollectionRef = useRef(collectionName);
 
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);
 
  // Single place that updates state + ref + persistence (no side effects inside setState updaters).
  const commit = useCallback(
    (items: T[]) => {
      dataRef.current = items;
      setData(items);
      persistCollection(collectionName, items);
    },
    [collectionName]
  );
 
  useEffect(() => {
    // Collection name changed: reset state from the new collection's cache
    if (prevCollectionRef.current !== collectionName) {
      prevCollectionRef.current = collectionName;
      const init = loadInitial(collectionName, String(idField)) as unknown as T[];
      dataRef.current = init;
      setData(init);
    }
 
    if (!enabled) {
      setLoading(false);
      return;
    }
 
    setLoading(true);
    setError(null);
 
    let isMounted = true;
    let unsubscribe: (() => void) | null = null;
    let seq = 0; // guards against out-of-order async snapshot handling
    const idKey = String(idField);
 
    void (async () => {
      try {
        const localDbItems = await getLocalCollection(collectionName);
        if (isMounted && localDbItems && localDbItems.length > 0) {
          dataRef.current = localDbItems as unknown as T[];
          setData(localDbItems as unknown as T[]);
        }
      } catch (err) {
        console.warn(`Error loading initial IndexedDB cache for ${collectionName}:`, err);
      } finally {
        if (isMounted && !navigator.onLine) setLoading(false);
      }
 
      if (!isMounted) return;
 
      const colRef = collection(db, collectionName);
      const q = sortField ? query(colRef, orderBy(sortField as string, sortDirection)) : colRef;
 
      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const mySeq = ++seq;
          void (async () => {
            try {
              const fromServer = !snapshot.metadata.fromCache;
              const hasPendingWrites = snapshot.metadata.hasPendingWrites;
 
              const rawDbItems: any[] = [];
              snapshot.forEach((d) => {
                rawDbItems.push({ [idKey]: d.id, ...d.data() });
              });
 
              /* ---- pending deletes: never let them reappear ---- */
              const pendingKey = pendingDeleteKey(collectionName);
              const pending = readIdSet(pendingKey);
              if (fromServer && pending.size > 0) {
                const rawIds = new Set(rawDbItems.map((i) => String(i[idKey])));
                let pendingChanged = false;
                for (const pid of Array.from(pending)) {
                  if (!rawIds.has(pid)) {
                    pending.delete(pid); // delete finished on server
                    pendingChanged = true;
                  } else if (canWriteNow() && !hasPendingWrites) {
                    void retryPendingDelete(collectionName, pid);
                  }
                }
                if (pendingChanged) writeIdSet(pendingKey, pending);
              }
              const dbItems = rawDbItems.filter((i) => !pending.has(String(i[idKey]))) as unknown as T[];
 
              /* ---- local state (IndexedDB first, localStorage as fallback) ---- */
              let localItems: T[] = [];
              try {
                const localDbItems = await getLocalCollection(collectionName);
                if (localDbItems && localDbItems.length > 0) localItems = localDbItems as unknown as T[];
              } catch (err) {
                console.warn(`Error reading IndexedDB for ${collectionName}:`, err);
              }
 
              if (localItems.length === 0) {
                const local = localStorage.getItem(`fca_col_${collectionName}`);
                if (local) {
                  try {
                    const parsed = JSON.parse(local);
                    if (Array.isArray(parsed)) localItems = parsed;
                  } catch (e) {
                    console.error(`Error parsing local storage for ${collectionName}`, e);
                  }
                }
              }
 
              // A newer snapshot arrived while we were awaiting -> drop this one
              if (!isMounted || mySeq !== seq) return;
 
              /* ---- seeding / empty-cloud handling ---- */
              if (rawDbItems.length > 0 && fromServer) {
                markSeeded(collectionName);
              }
 
              if (rawDbItems.length === 0 && localItems.length > 0) {
                if (fromServer && !isSeeded(collectionName) && canWriteNow() && !seedingCollections.has(collectionName)) {
                  // Firestore is confirmed empty and this device never uploaded its initial data -> upload it once.
                  seedingCollections.add(collectionName);
                  seedCollection(collectionName, idKey, localItems)
                    .then(() => markSeeded(collectionName))
                    .catch((err) => reportErrorSafe(err, OperationType.WRITE, collectionName))
                    .finally(() => seedingCollections.delete(collectionName));
                }
 
                // Cache-only snapshot, or seed not finished yet: keep showing local data.
                if (!fromServer || !isSeeded(collectionName)) {
                  const shown = sortItems([...localItems], sortField, sortDirection);
                  dataRef.current = shown;
                  setData(shown);
                  setLoading(false);
                  return;
                }
                // else: cloud is really empty (was seeded before) -> fall through, only dirty local items survive
              }
 
              /* ---- merge ---- */
              const mergedMap = new Map<string, any>();
              dbItems.forEach((item: any) => mergedMap.set(String(item[idKey]), item));
 
              for (const localItem of localItems as any[]) {
                const localId = String(localItem[idKey]);
                if (pending.has(localId)) continue;
                const dbItem = mergedMap.get(localId);
 
                if (localItem._dirty === true) {
                  if (dbItem && areItemsEqual(localItem, dbItem, idKey)) {
                    // Already synced -> use the clean DB version (drops the _dirty flag)
                    mergedMap.set(localId, dbItem);
                  } else {
                    // Local edit not (fully) in Firestore yet -> keep it and retry the upload
                    mergedMap.set(localId, localItem);
                    if (canWriteNow() && !hasPendingWrites) {
                      void pushLocalItem(collectionName, idKey, localItem);
                    }
                  }
                }
                // Non-dirty local item that is not in the DB: deleted in the cloud or stale fallback -> discard
              }
 
              const mergedItems = sortItems(Array.from(mergedMap.values()) as T[], sortField, sortDirection);
 
              dataRef.current = mergedItems;
              setData(mergedItems);
              persistCollection(collectionName, mergedItems);
              setLoading(false);
            } catch (callbackErr) {
              console.error(`Error inside onSnapshot callback for ${collectionName}:`, callbackErr);
              if (isMounted) setLoading(false);
            }
          })();
        },
        (err) => {
          if (isQuotaError(err)) {
            markQuotaExceeded();
            console.warn(`Quota error syncing collection ${collectionName}. Using local cache:`, err);
          }
          // State first: handleFirestoreError may throw
          setError(wrappedError(err));
          setLoading(false);
          reportErrorSafe(err, OperationType.LIST, collectionName);
        }
      );
    })();
 
    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, idField, sortField, sortDirection, enabled]);
 
  const addOrUpdateItem = useCallback(
    async (item: T) => {
      const id = String(item[idField]);
      const idKey = String(idField);
 
      let finalItem = item;
      try {
        const { optimized, changed } = await optimizeItems([item], idKey);
        if (changed && optimized.length > 0) finalItem = optimized[0];
      } catch (e) {
        console.warn('Failed to optimize item before saving:', e);
      }
 
      const dirtyItem: any = { ...finalItem, _dirty: true };
 
      // Update local state immediately (based on the ref, no side effects in updater)
      const prev = dataRef.current;
      const idx = prev.findIndex((x) => String(x[idField]) === id);
      let updated: T[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...dirtyItem };
      } else {
        updated = [...prev, dirtyItem];
      }
      commit(sortItems(updated, sortField, sortDirection));
      removePendingDelete(collectionName, id); // re-created after delete
 
      if (!canWriteNow()) {
        void enqueueSyncOperation(collectionName, idKey, 'SET', id, dirtyItem);
        return;
      }
 
      const writeKey = `${collectionName}/${id}`;
      inFlightWrites.add(writeKey);
      try {
        const dataToSave: any = { ...dirtyItem };
        delete dataToSave[idKey];
        delete dataToSave._dirty;
        const clean = stripUndefined(dataToSave);
 
        // Firestore hard limit: 1 MiB per document
        const approxBytes = new Blob([JSON.stringify(clean)]).size;
        if (approxBytes > 1000000) {
          throw new Error(
            `Document ${writeKey} is too large for Firestore (${(approxBytes / 1024).toFixed(0)} KB, limit 1 MiB). Reduce the images.`
          );
        }
 
        await safeWrite(() => setDoc(doc(db, collectionName, id), clean, { merge: true }));
 
        // Write succeeded -> clear _dirty, but only if the item was not edited again in the meantime
        const cur = dataRef.current;
        const i2 = cur.findIndex((x) => String(x[idField]) === id);
        if (i2 > -1 && areItemsEqual(cur[i2], dirtyItem, idKey)) {
          const next = [...cur];
          const cleanItem: any = { ...next[i2] };
          delete cleanItem._dirty;
          next[i2] = cleanItem;
          commit(next);
        }
      } catch (err) {
        if (isQuotaError(err)) markQuotaExceeded();
        console.warn(`Firestore write failed, enqueueing sync operation for ${writeKey}:`, err);
        void enqueueSyncOperation(collectionName, idKey, 'SET', id, dirtyItem);
        handleFirestoreError(wrappedError(err), OperationType.WRITE, writeKey);
      } finally {
        inFlightWrites.delete(writeKey);
      }
    },
    [collectionName, idField, sortField, sortDirection, commit]
  );
 
  const removeItem = useCallback(
    async (id: string | number) => {
      const idStr = String(id);
      const idKey = String(idField);
 
      commit(dataRef.current.filter((x) => String(x[idField]) !== idStr));
      addPendingDelete(collectionName, idStr); // filters the doc out of snapshots until the delete is confirmed
 
      if (!canWriteNow()) {
        void enqueueSyncOperation(collectionName, idKey, 'DELETE', idStr, null);
        return;
      }
 
      try {
        await safeWrite(() => deleteDoc(doc(db, collectionName, idStr)));
        removePendingDelete(collectionName, idStr);
      } catch (err) {
        if (isQuotaError(err)) markQuotaExceeded();
        console.warn(`Firestore delete failed, enqueueing sync operation for ${collectionName}/${idStr}:`, err);
        void enqueueSyncOperation(collectionName, idKey, 'DELETE', idStr, null);
        handleFirestoreError(wrappedError(err), OperationType.DELETE, `${collectionName}/${idStr}`);
      }
    },
    [collectionName, idField, commit]
  );
 
  return { data, loading, error, addOrUpdateItem, removeItem };
}
 
