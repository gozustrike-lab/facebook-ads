'use client'

import { useCallback, useSyncExternalStore } from 'react'

function subscribe(callback: () => void, query: string) {
  const media = window.matchMedia(query)
  media.addEventListener('change', callback)
  return () => media.removeEventListener('change', callback)
}

export function useMediaQuery(query: string): boolean {
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query])
  const getServerSnapshot = useCallback(() => false, [])
  const subscribeFn = useCallback((cb: () => void) => subscribe(cb, query), [query])

  return useSyncExternalStore(subscribeFn, getSnapshot, getServerSnapshot)
}

/**
 * Returns true only after the component has mounted on the client.
 * Uses useSyncExternalStore to avoid hydration mismatches.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    (cb) => {
      // Subscribe to nothing - we just need the snapshot
      return () => {}
    },
    () => true,   // Client: always mounted
    () => false   // Server: never mounted
  )
}
