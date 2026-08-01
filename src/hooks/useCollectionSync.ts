import { useState, useEffect, useCallback } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { getLocalCollection, saveLocalCollection, enqueueSyncOperation, isQuotaError, markQuotaExceeded, isQuotaExceededActive } from '../lib/offlineStorage';
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

// Wrapper to ensure that Firestore Quota errors always have 'Quota limit exceeded' in their message for firebase.ts and App.tsx UI
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

// Safe write function that only executes the write if quota has not been exceeded
export async function safeWrite<T>(writeOp: () => Promise<T>): Promise<T | undefined> {
  if (isQuotaExceededActive()) {
    console.warn('safeWrite skipped: Firestore quota has been exceeded (Offline Mode).');
    return undefined;
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

const compressLargeImageString = (base64: string, maxDim = 300, quality = 0.7): Promise<string> => {
  return new Promise((resolve) => {
    if (typeof base64 !== 'string' || !base64.startsWith('data:image/')) {
      resolve(base64);
      return;
    }
    // If it's already reasonably small (under 100KB), don't compress again
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
        ctx.fillStyle = "white";
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
        console.log(`Auto-compressing existing giant image under key "${key}" for item ${item[idField] || i} (size was ${(val.length / 1024).toFixed(1)} KB)...`);
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
            console.log(`Auto-compressing array image [${j}] under key "${key}" for item ${item[idField] || i}...`);
            const compressed = await compressLargeImageString(subVal, 800, 0.75); // larger limit for diagrams
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
    if (itemChanged) {
      optimized[i] = item;
    }
  }
  return { optimized, changed };
};

const normalizeForComparison = (obj: any, idField: string): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    const arr = obj
      .map(item => normalizeForComparison(item, idField))
      .filter(item => item !== null && item !== undefined && item !== '');
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
  if (Array.isArray(obj)) {
    return '[' + obj.map(getSortedJSON).join(',') + ']';
  }
  const keys = Object.keys(obj).sort();
  return '{' + keys.map(k => JSON.stringify(k) + ':' + getSortedJSON(obj[k])).join(',') + '}';
};

const areItemsEqual = (a: any, b: any, idField: string): boolean => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return a === b;
  try {
    const normA = normalizeForComparison(a, idField);
    const normB = normalizeForComparison(b, idField);
    return getSortedJSON(normA) === getSortedJSON(normB);
  } catch (e) {
    console.warn("Error comparing items in areItemsEqual:", e);
    return false;
  }
};

export function useCollectionSync<T>(
  collectionName: string,
  idField: keyof T = 'id' as keyof T,
  sortField?: string,
  sortDirection: 'asc' | 'desc' = 'asc',
  enabled: boolean = true
) {
  const [data, setData] = useState<T[]>(() => {
    let currentCached: any[] = [];
    const local = localStorage.getItem(`fca_col_${collectionName}`);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed)) {
          currentCached = parsed;
        }
      } catch (e) {
        console.error(`Error parsing cached collection ${collectionName}`, e);
      }
    }

    // Always check if there is legacy data in fca_${legacyKey} and merge it with currentCached
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
              console.log(`Recovered and merged ${addedCount} legacy items for ${collectionName} into current cache. Total: ${merged.length} items.`);
              try {
                localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(merged));
              } catch (e) {
                console.error(`Error writing merged recovery for ${collectionName} to localStorage`, e);
              }
              currentCached = merged;
            }
          }
          // Safely clean up the legacy key as it is now redundant
          localStorage.removeItem(`fca_${legacyKey}`);
          console.log(`Successfully cleaned up redundant legacy localStorage key fca_${legacyKey}`);
        } catch (e) {
          console.error(`Error parsing legacy data for ${collectionName}`, e);
          // Even if parsing failed, let's remove it to avoid blocking storage
          localStorage.removeItem(`fca_${legacyKey}`);
        }
      }
    }

    if (currentCached.length > 0) {
      return currentCached as unknown as T[];
    }

    const fallback = getInitialFallback(collectionName);
    if (fallback.length > 0) {
      try {
        localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(fallback));
      } catch (e) {
        console.error(`Error writing fallback for ${collectionName} to localStorage`, e);
      }
    }
    return fallback as unknown as T[];
  });
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    let isMounted = true;
    let unsubscribe: (() => void) | null = null;

    // Asynchronously load the most up-to-date data from IndexedDB first
    void (async () => {
      try {
        const localDbItems = await getLocalCollection(collectionName);
        if (isMounted && localDbItems && localDbItems.length > 0) {
          setData(localDbItems as unknown as T[]);
        }
      } catch (err) {
        console.warn(`Error loading initial IndexedDB cache for ${collectionName}:`, err);
      } finally {
        if (isMounted && !navigator.onLine) {
          setLoading(false);
        }
      }

      // After IndexedDB is loaded, subscribe to Firestore real-time updates
      if (!isMounted) return;

      const colRef = collection(db, collectionName);
      const q = sortField ? query(colRef, orderBy(sortField as string, sortDirection)) : colRef;

      unsubscribe = onSnapshot(q, (snapshot) => {
        void (async () => {
          try {
            const dbItems: T[] = [];
            snapshot.forEach((doc) => {
              dbItems.push({ [idField]: doc.id, ...doc.data() } as unknown as T);
            });
            console.log(`Collection ${collectionName} updated from Firestore, items count:`, dbItems.length);

            // Get current local items to merge from IndexedDB (source of truth, large limit)
            let localItems: T[] = [];
            try {
              const localDbItems = await getLocalCollection(collectionName);
              if (localDbItems && localDbItems.length > 0) {
                localItems = localDbItems as unknown as T[];
              }
            } catch (err) {
              console.warn(`Error reading IndexedDB for ${collectionName} during snapshot merge:`, err);
            }

            // Fallback/enrich from localStorage if localItems is still empty
            if (localItems.length === 0) {
              const local = localStorage.getItem(`fca_col_${collectionName}`);
              if (local) {
                try {
                  const parsed = JSON.parse(local);
                  if (Array.isArray(parsed)) {
                    localItems = parsed;
                  }
                } catch (e) {
                  console.error(`Error parsing local storage for ${collectionName} during sync merge`, e);
                }
              }
            }

            // Check legacy storage if it has more items
            const legacyKey = getLegacyKey(collectionName);
            if (legacyKey) {
              const legacyData = localStorage.getItem(`fca_${legacyKey}`);
              if (legacyData) {
                try {
                  const parsedLegacy = JSON.parse(legacyData);
                  if (Array.isArray(parsedLegacy) && parsedLegacy.length > localItems.length) {
                    console.log(`Recovered larger legacy list for ${collectionName} during merge (${parsedLegacy.length} items vs ${localItems.length})`);
                    localItems = parsedLegacy;
                  }
                } catch (e) {
                  console.error(`Error parsing legacy data for ${collectionName} during sync merge`, e);
                }
              }
            }

            // If Firestore returns empty, do NOT overwrite if we have cached items locally (as requested by user)
            if (dbItems.length === 0 && localItems.length > 0) {
              console.warn(`Firestore snapshot returned empty for collection ${collectionName}, but we have cached data locally. Keeping the last known local state to protect data.`);
              
              // Use local items as the data, sort them if needed
              const mergedItems = [...localItems];
              if (sortField) {
                mergedItems.sort((a: any, b: any) => {
                  const valA = a[sortField];
                  const valB = b[sortField];
                  if (valA === undefined) return 1;
                  if (valB === undefined) return -1;
                  if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                  if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                  return 0;
                });
              }
              setData(mergedItems);
              setLoading(false);
              return;
            }

            // Merge: Build a map of database items by ID to handle updates efficiently
            const mergedMap = new Map<string, any>();
            dbItems.forEach((item: any) => {
              mergedMap.set(String(item[idField]), item);
            });

            // Merge in local items, respecting local user edits (_dirty)
            for (const localItem of localItems) {
              const localId = String(localItem[idField]);
              const dbItem = mergedMap.get(localId);

              if ((localItem as any)._dirty === true) {
                if (dbItem) {
                  // If dbItem is identical to localItem (except _dirty flag), we can safely clear _dirty and use dbItem
                  if (areItemsEqual(localItem, dbItem, String(idField))) {
                    console.log(`Cleaned up _dirty flag for synced item ${localId} in collection ${collectionName}`);
                    mergedMap.set(localId, dbItem);
                  } else {
                    // They are different, so keep localItem with _dirty flag to avoid losing user modifications
                    mergedMap.set(localId, localItem);
                    
                    // Retry syncing back to Firestore asynchronously
                    if (!isQuotaExceededActive() && navigator.onLine) {
                      void (async () => {
                        try {
                          const docRef = doc(db, collectionName, localId);
                          const { [idField]: _, _dirty, ...dataToSave } = localItem as any;
                          await safeWrite(() => setDoc(docRef, dataToSave, { merge: true }));
                          console.log(`Synced back local-only user-modified item ${localId} to Firestore collection ${collectionName}`);
                        } catch (err) {
                          if (isQuotaError(err)) {
                            markQuotaExceeded();
                          }
                          handleFirestoreError(wrappedError(err), OperationType.WRITE, `${collectionName}/${localId}`);
                        }
                      })();
                    }
                  }
                } else {
                  // Not in DB, but dirty -> keep local
                  mergedMap.set(localId, localItem);
                  
                  // Try to sync back to Firestore asynchronously
                  if (!isQuotaExceededActive() && navigator.onLine) {
                    void (async () => {
                      try {
                        const docRef = doc(db, collectionName, localId);
                        const { [idField]: _, _dirty, ...dataToSave } = localItem as any;
                        await safeWrite(() => setDoc(docRef, dataToSave, { merge: true }));
                        console.log(`Synced back local-only user-created item ${localId} to Firestore collection ${collectionName}`);
                      } catch (err) {
                        if (isQuotaError(err)) {
                          markQuotaExceeded();
                        }
                        handleFirestoreError(wrappedError(err), OperationType.WRITE, `${collectionName}/${localId}`);
                      }
                    })();
                  }
                }
              } else {
                // Local item not dirty
                // Since it is not dirty and not in the DB, it was either deleted in the cloud or is a stale fallback item.
                // We discard it to ensure consistent synchronization across devices when sharing links.
                console.log(`Discarding non-dirty local-only item ${localId} from ${collectionName} (deleted in cloud or stale fallback)`);
              }
            }

            const mergedItems = Array.from(mergedMap.values()) as T[];

            // Sort mergedItems if sortField is specified
            if (sortField) {
              mergedItems.sort((a: any, b: any) => {
                const valA = a[sortField];
                const valB = b[sortField];
                if (valA === undefined) return 1;
                if (valB === undefined) return -1;
                if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
                if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
                return 0;
              });
            }

            setData(mergedItems);
            
            // Write to IndexedDB first
            void saveLocalCollection(collectionName, mergedItems);

            // Fallback to localStorage
            try {
              localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(mergedItems));
            } catch (storageError) {
              console.warn(`localStorage quota exceeded or blocked for fca_col_${collectionName}`, storageError);
            }

            // Automatically optimize and shrink existing giant legacy base64 images in background
            try {
              const { optimized, changed } = await optimizeItems(mergedItems, String(idField));
              if (changed) {
                console.log(`Successfully compressed historical giant image(s) in collection ${collectionName}! Reclaiming storage locally.`);
                setData(optimized);
                void saveLocalCollection(collectionName, optimized);
                try {
                  localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(optimized));
                } catch (storageError) {
                  console.warn(`localStorage update failed during background optimization for fca_col_${collectionName}`, storageError);
                }
              }
            } catch (optimizeErr) {
              console.warn(`Failed during background collection optimization for ${collectionName}:`, optimizeErr);
            }

            setLoading(false);
          } catch (callbackErr) {
            console.error(`Error inside onSnapshot callback for ${collectionName}:`, callbackErr);
            setLoading(false);
          }
        })();
      }, (err) => {
        if (isQuotaError(err)) {
          markQuotaExceeded();
          console.warn(`Quota error syncing collection ${collectionName}. Using local cache:`, err);
        }
        handleFirestoreError(wrappedError(err), OperationType.LIST, collectionName);
        setError(wrappedError(err));
        setLoading(false);
      });
    })();

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, [collectionName, idField, sortField, sortDirection, enabled]);

  const addOrUpdateItem = useCallback(async (item: T) => {
    const id = String(item[idField]);
    
    // Optimize the item before saving (ensures small payload sizes and prevents recursive writes)
    let finalItem = item;
    try {
      const { optimized, changed } = await optimizeItems([item], String(idField));
      if (changed && optimized.length > 0) {
        finalItem = optimized[0];
      }
    } catch (e) {
      console.warn("Failed to optimize item before saving:", e);
    }

    // Mark item as user-modified/created (_dirty) so it gets persisted to Firestore and survives offline sync restarts
    const dirtyItem = { ...finalItem, _dirty: true };

    // Update local state and localStorage immediately
    setData((prev) => {
      const idx = prev.findIndex((x) => String(x[idField]) === id);
      let updated: T[];
      if (idx > -1) {
        updated = [...prev];
        updated[idx] = { ...updated[idx], ...dirtyItem };
      } else {
        updated = [...prev, dirtyItem];
      }
      
      if (sortField) {
        updated.sort((a: any, b: any) => {
          const valA = a[sortField];
          const valB = b[sortField];
          if (valA === undefined) return 1;
          if (valB === undefined) return -1;
          if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
          if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
          return 0;
        });
      }
      
      // Save to IndexedDB
      void saveLocalCollection(collectionName, updated);

      try {
        localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(updated));
      } catch (storageError) {
        console.warn(`localStorage quota exceeded or blocked for fca_col_${collectionName}`, storageError);
      }
      return updated;
    });

    if (isQuotaExceededActive() || !navigator.onLine) {
      console.warn(`Firestore write skipped for ${collectionName}/${id} due to active quota exclusion or offline state. Enqueueing...`);
      void enqueueSyncOperation(collectionName, String(idField), 'SET', id, dirtyItem);
      return;
    }

    try {
      const docRef = doc(db, collectionName, id);
      const { [idField]: _, _dirty, ...dataToSave } = dirtyItem as any;
      await safeWrite(() => setDoc(docRef, dataToSave, { merge: true }));

      // Since the Firestore write succeeded, we can clear the _dirty flag from local state, IndexedDB, and localStorage immediately!
      setData((prev) => {
        const idx = prev.findIndex((x) => String(x[idField]) === id);
        if (idx > -1) {
          const updated = [...prev];
          const cleanItem = { ...updated[idx] };
          delete (cleanItem as any)._dirty;
          updated[idx] = cleanItem;
          
          void saveLocalCollection(collectionName, updated);
          try {
            localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(updated));
          } catch (storageError) {
            console.warn(`localStorage quota exceeded or blocked for fca_col_${collectionName}`, storageError);
          }
          return updated;
        }
        return prev;
      });
    } catch (err) {
      if (isQuotaError(err)) {
        markQuotaExceeded();
      }
      console.warn(`Firestore write failed, enqueueing sync operation for ${collectionName}/${id}:`, err);
      void enqueueSyncOperation(collectionName, String(idField), 'SET', id, dirtyItem);
      handleFirestoreError(wrappedError(err), OperationType.WRITE, `${collectionName}/${id}`);
    }
  }, [collectionName, idField, sortField, sortDirection]);

  const removeItem = useCallback(async (id: string | number) => {
    const idStr = String(id);
    
    // Update local state and localStorage immediately
    setData((prev) => {
      const updated = prev.filter((x) => String(x[idField]) !== idStr);
      
      // Save to IndexedDB
      void saveLocalCollection(collectionName, updated);

      try {
        localStorage.setItem(`fca_col_${collectionName}`, JSON.stringify(updated));
      } catch (storageError) {
        console.warn(`localStorage quota exceeded or blocked for fca_col_${collectionName}`, storageError);
      }
      return updated;
    });

    if (isQuotaExceededActive() || !navigator.onLine) {
      console.warn(`Firestore delete skipped for ${collectionName}/${idStr} due to active quota exclusion or offline state. Enqueueing...`);
      void enqueueSyncOperation(collectionName, String(idField), 'DELETE', idStr, null);
      return;
    }

    try {
      const docRef = doc(db, collectionName, idStr);
      await safeWrite(() => deleteDoc(docRef));
    } catch (err) {
      if (isQuotaError(err)) {
        markQuotaExceeded();
      }
      console.warn(`Firestore delete failed, enqueueing sync operation for ${collectionName}/${idStr}:`, err);
      void enqueueSyncOperation(collectionName, String(idField), 'DELETE', idStr, null);
      handleFirestoreError(wrappedError(err), OperationType.DELETE, `${collectionName}/${idStr}`);
    }
  }, [collectionName, idField]);

  return { data, loading, error, addOrUpdateItem, removeItem };
}
