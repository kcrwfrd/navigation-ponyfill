'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import { useRouter } from 'next/navigation'

interface NavigationContextType {
  back: (fallbackUrl?: string) => void
  canGoBack: boolean
  previousPath: string | null
  ready: boolean
}
export const NavigationContext = createContext<NavigationContextType | null>(
  null,
)
const KEY = '__NAVIGATION'

export const NavigationProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter()

  useEffect(() => {
    const ogPushState = window.history.pushState.bind(window.history)
    const ogReplaceState = window.history.replaceState.bind(window.history)

    /**
     * Patch Next.js's patch of pushState
     * @see https://github.com/vercel/next.js/blob/d440c75650c79b8be450df5fd434afbfe230506a/packages/next/src/client/components/app-router.tsx#L298-L401
     */
    window.history.pushState = function pushState(
      ogState: any,
      _unused: string,
      url?: string | URL | null,
    ) {
      const previousPath = `${window.location.pathname}${window.location.search}${window.location.hash}`

      const state = {
        ...(ogState || {}),
        [KEY]: {
          canGoBack: true,
          previousPath,
        },
      }

      ogPushState(state, _unused, url)

      /**
       * Unfortunately, whether we dispatch a custom event and subscribe to it
       * with useSyncExternalStore, or simply update state directly here, we will
       * get the following error:
       *
       * "useInsertionEffect must not schedule updates"
       *
       * This is due to Next.js's router calling pushState in a useInsertionEffect:
       * @see https://github.com/vercel/next.js/blob/4fa7d80eb9183273cc531623bb45606942b438d6/packages/next/src/client/components/app-router.tsx#L91
       *
       * queueMicrotask avoids this error, but let's investigate further.
       */
      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('pushState', { detail: { state, url } }),
        )
      })
    }

    window.history.replaceState = function replaceState(
      ogState: any,
      _unused: string,
      url?: string | URL | null,
    ) {
      const state = {
        ...(ogState || {}),
        [KEY]: {
          canGoBack: window.history.state?.[KEY]?.canGoBack ?? false,
          previousPath: window.history.state?.[KEY]?.previousPath ?? null,
        },
      }

      ogReplaceState(state, _unused, url)

      queueMicrotask(() => {
        window.dispatchEvent(
          new CustomEvent('replaceState', { detail: { state, url } }),
        )
      })
    }

    return () => {
      window.history.pushState = ogPushState
    }
  }, [])

  const { canGoBack, previousPath, ready } = useSyncHistoryState()

  const back = useCallback(
    (fallbackUrl?: string) => {
      if (canGoBack) {
        router.back()
      } else if (fallbackUrl) {
        router.push(fallbackUrl)
      }
    },
    [router, canGoBack],
  )

  const value = useMemo(
    () => ({ back, canGoBack, previousPath, ready }),
    [back, canGoBack, previousPath, ready],
  )

  return <NavigationContext value={value}>{children}</NavigationContext>
}

export const useNavigation = () => {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider')
  }
  return context
}

const subscribe = (callback: () => void) => {
  window.addEventListener('popstate', callback)
  window.addEventListener('pushState', callback)
  window.addEventListener('replaceState', callback)

  return () => {
    window.removeEventListener('popstate', callback)
    window.removeEventListener('pushState', callback)
    window.removeEventListener('replaceState', callback)
  }
}

/**
 * @todo add support for ready
 */
interface NavigationState {
  canGoBack: boolean
  previousPath: string | null
  ready: boolean
}

const SERVER_SNAPSHOT: NavigationState = {
  canGoBack: false,
  previousPath: null,
  ready: false, // we may wish to simply hide UI until hydration has completed
}

/**
 * @todo use reselect so we can include derived data (for the ready param)
 */
const getSnapshot = () => window.history.state?.[KEY] ?? SERVER_SNAPSHOT
const getServerSnapshot = () => SERVER_SNAPSHOT

function useSyncHistoryState(): NavigationState {
  return useSyncExternalStore<NavigationState>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
}
