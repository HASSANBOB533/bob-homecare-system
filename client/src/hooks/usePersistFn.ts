import { useRef, useLayoutEffect, useCallback } from "react";

type noop = (...args: any[]) => any;

/**
 * usePersistFn instead of useCallback to reduce cognitive load
 * Keeps a stable function reference while always calling the latest version
 */
export function usePersistFn<T extends noop>(fn: T) {
  const fnRef = useRef<T>(fn);
  
  // Use useLayoutEffect to update ref before paint
  useLayoutEffect(() => {
    fnRef.current = fn;
  });

  // Use useCallback with empty deps to create a stable reference
  const persistFn = useCallback(
    ((...args: any[]) => {
      return fnRef.current(...args);
    }) as T,
    []
  );

  return persistFn;
}
