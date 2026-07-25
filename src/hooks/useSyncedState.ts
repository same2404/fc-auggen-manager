import { useState, useEffect, useCallback, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export function useSyncedState<T>(key: string, initialValue: T | (() => T), enabled: boolean = true): [T, (value: T | ((val: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const local = localStorage.getItem(`fca_${key}`);
    if (local) {
      try {
        return JSON.parse(local);
      } catch (e) {
        console.error(`Error parsing cached state for ${key}`, e);
      }
    }
    return initialValue instanceof Function ? initialValue() : initialValue;
  });
  const isInitialized = useRef(false);
  const lastDataRef = useRef<string | null>(localStorage.getItem(`fca_${key}`));
  const currentKeyRef = useRef(key);

  // Reset state when key changes
  if (currentKeyRef.current !== key) {
    currentKeyRef.current = key;
    isInitialized.current = false;
    const local = localStorage.getItem(`fca_${key}`);
    lastDataRef.current = local;
    if (local) {
      try {
        setState(JSON.parse(local));
      } catch (e) {
        setState(initialValue instanceof Function ? initialValue() : initialValue);
      }
    } else {
      setState(initialValue instanceof Function ? initialValue() : initialValue);
    }
  }

  useEffect(() => {
    if (!enabled) return;

    isInitialized.current = false; // Ensure we re-initialize on key change
    const docRef = doc(db, 'appState', key);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        try {
          const rawData = docSnap.data().data;
          if (lastDataRef.current === rawData) {
            isInitialized.current = true; // Still mark as initialized if it matches
            return;
          }

          lastDataRef.current = rawData;
          const data = JSON.parse(rawData);
          setState(data);
          try {
            localStorage.setItem(`fca_${key}`, rawData);
          } catch (storageError) {
            console.warn(`localStorage quota exceeded or blocked for fca_${key}`, storageError);
          }

          if (isInitialized.current) {
            window.dispatchEvent(new CustomEvent('fca_state_changed', { detail: { key } }));
          }

          isInitialized.current = true;
        } catch (e) {
          console.error(`Error parsing synced state for ${key}`, e);
        }
      } else {
        // Document doesn't exist on server yet
        // We mark as initialized so local changes can now be written, 
        // but we DON'T write the current local state back immediately 
        // unless it's explicitly explicitly changed by the user later.
        // HOWEVER, we need to know it's "safe" to write now.
        isInitialized.current = true;
        
        // Optional: migrate local storage to server if it exists
        const localData = localStorage.getItem(`fca_${key}`);
        if (localData && !lastDataRef.current) {
           lastDataRef.current = localData;
           setDoc(docRef, { data: localData }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `appState/${key}`));
        }
      }
    }, (error) => {
      const errStr = error instanceof Error ? error.message : String(error);
      const isQuotaError = errStr.includes('Quota limit exceeded') || errStr.toLowerCase().includes('quota');
      if (isQuotaError) {
        console.warn(`Quota error syncing state ${key}. Using local cache:`, error);
      } else {
        console.error(`Error syncing state ${key}:`, error);
      }
      handleFirestoreError(error, OperationType.GET, `appState/${key}`);
      // Mark as initialized so the user can make local edits and save them locally
      isInitialized.current = true;
    });

    return () => unsubscribe();
  }, [key]);

  const setSyncedState = useCallback((value: T | ((val: T) => T)) => {
    setState((prev) => {
      const nextValue = value instanceof Function ? value(prev) : value;
      const rawData = JSON.stringify(nextValue);
      
      if (lastDataRef.current === rawData) return prev;

      try {
        localStorage.setItem(`fca_${key}`, rawData);
      } catch (storageError) {
        console.warn(`localStorage quota exceeded or blocked for fca_${key}`, storageError);
      }
      lastDataRef.current = rawData;

      const docRef = doc(db, 'appState', key);
      
      // CRITICAL: Only write to Firestore if we have successfully initialized
      // from a server snapshot (or confirmed the document doesn't exist).
      // This prevents overwriting server data with local stale/default state during initial load.
      if (isInitialized.current) {
        setDoc(docRef, { data: rawData }).catch((err) => handleFirestoreError(err, OperationType.WRITE, `appState/${key}`));
      } else {
        console.warn(`Attempted to write to synced state ${key} before initialization. Write deferred/skipped.`);
      }
      
      // Dispatch local change event for audit logging
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('fca_local_change', { detail: { key } }));
      }, 0);
      
      return nextValue;
    });
  }, [key]);

  return [state, setSyncedState];
}
