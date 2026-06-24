import { useCallback, useMemo, useSyncExternalStore } from "react";

const LOCAL_EVENT = "digiboard:local-storage";

/**
 * A localStorage-backed value that stays in sync across tabs and components.
 * Built on useSyncExternalStore so it avoids setState-in-effect and hydrates
 * cleanly (server renders the fallback, client swaps to the stored value).
 */
export function useLocalStorage<T>(key: string, initial: T): [T, (value: T) => void] {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const handler = (event: Event) => {
        if (event instanceof StorageEvent && event.key && event.key !== key) return;
        onChange();
      };
      window.addEventListener("storage", handler);
      window.addEventListener(LOCAL_EVENT, handler);
      return () => {
        window.removeEventListener("storage", handler);
        window.removeEventListener(LOCAL_EVENT, handler);
      };
    },
    [key],
  );

  const getSnapshot = useCallback(() => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => null);

  const value = useMemo<T>(() => {
    if (raw === null) return initial;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return initial;
    }
  }, [raw, initial]);

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, JSON.stringify(next));
        window.dispatchEvent(new Event(LOCAL_EVENT));
      } catch {
        // Ignore quota / unavailable storage.
      }
    },
    [key],
  );

  return [value, setValue];
}
