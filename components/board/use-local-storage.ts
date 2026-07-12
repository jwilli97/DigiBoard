import { useCallback, useMemo, useSyncExternalStore } from "react";

const LOCAL_EVENT = "digiboard:local-storage";

/** Parse a stored raw string, falling back to `initial` when absent or invalid. */
function parseStored<T>(raw: string | null, initial: T): T {
  if (raw === null) return initial;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

/**
 * A localStorage-backed value that stays in sync across tabs and components.
 * Built on useSyncExternalStore so it avoids setState-in-effect and hydrates
 * cleanly (server renders the fallback, client swaps to the stored value).
 * The setter also accepts an updater function, which reads the stored value at
 * call time — use it for read-modify-write updates so successive calls in the
 * same render don't clobber each other.
 */
export function useLocalStorage<T>(
  key: string,
  initial: T,
): [T, (value: T | ((previous: T) => T)) => void] {
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

  const value = useMemo<T>(() => parseStored(raw, initial), [raw, initial]);

  const setValue = useCallback(
    (next: T | ((previous: T) => T)) => {
      try {
        const resolved =
          typeof next === "function"
            ? (next as (previous: T) => T)(parseStored(localStorage.getItem(key), initial))
            : next;
        localStorage.setItem(key, JSON.stringify(resolved));
        window.dispatchEvent(new Event(LOCAL_EVENT));
      } catch {
        // Ignore quota / unavailable storage.
      }
    },
    [key, initial],
  );

  return [value, setValue];
}
