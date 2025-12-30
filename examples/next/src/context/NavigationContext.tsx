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
import { navigation, Navigation } from 'navigation-ponyfill'
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

export const NavigationProvider = ({ children }: PropsWithChildren) => {
  const router = useRouter()

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
  /**
   * Without the use of queueMicrotask, we will get the following error:
   *
   * "useInsertionEffect must not schedule updates"
   *
   * This is due to Next.js's router calling pushState in a useInsertionEffect:
   * @see https://github.com/vercel/next.js/blob/4fa7d80eb9183273cc531623bb45606942b438d6/packages/next/src/client/components/app-router.tsx#L91
   *
   * Let's investigate further. This doesn't feel great.
   *
   * Surely Next.js's router gets around this somehow in order to support
   * usePathname() and useSearchParams()
   */
  const fn = () => queueMicrotask(callback)

  navigation.addEventListener('currententrychange', fn)

  return () => {
    navigation.removeEventListener('currententrychange', fn)
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
 * getSnapshot must return a cached value.
 * @see https://react.dev/reference/react/useSyncExternalStore#im-getting-an-error-the-result-of-getsnapshot-should-be-cached
 * @todo use reselect so we can include derived data (for the ready param)
 */
const getSnapshot = () =>
  window.history.state?.[Navigation.KEY] ?? SERVER_SNAPSHOT
const getServerSnapshot = () => SERVER_SNAPSHOT

function useSyncHistoryState(): NavigationState {
  return useSyncExternalStore<NavigationState>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
}
