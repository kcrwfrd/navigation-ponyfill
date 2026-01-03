'use client'

import {
  createContext,
  useContext,
  useSyncExternalStore,
  type PropsWithChildren,
} from 'react'
import { navigation, Navigation } from 'navigation-ponyfill'

interface NavigationState {
  canGoBack: boolean
  previousPath: string | null
  /**
   * Whether the navigation state has been hydrated on the client.
   * This is `false` during SSR and becomes `true` once the client has initialized.
   * It allows us to not render UI until the client is ready, so we can avoid flickering.
   */
  ready: boolean
}
export const NavigationContext = createContext<NavigationState | null>(null)

export const NavigationProvider = ({ children }: PropsWithChildren) => {
  const state = useSyncNavigationState()
  return <NavigationContext value={state}>{children}</NavigationContext>
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
   * @todo let's investigate further. This doesn't feel great.
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

const SERVER_SNAPSHOT: NavigationState = {
  canGoBack: false,
  previousPath: null,
  ready: false,
}

/**
 * getSnapshot must return a cached value.
 * @see https://react.dev/reference/react/useSyncExternalStore#im-getting-an-error-the-result-of-getsnapshot-should-be-cached
 */
let cachedSnapshot: NavigationState | null = null
let cachedRawState: unknown = null

const getSnapshot = (): NavigationState => {
  const rawState = window.history.state?.[Navigation.KEY]

  if (rawState !== cachedRawState) {
    cachedRawState = rawState

    let url: URL | null = null

    try {
      if (rawState?.previousUrl) {
        url = new URL(rawState.previousUrl)
      }
    } catch (error) {
      console.error(error)
      url = null
    }

    cachedSnapshot = {
      canGoBack: rawState?.canGoBack ?? false,
      previousPath: url ? url.pathname + url.search + url.hash : null,
      ready: true,
    }
  }

  return cachedSnapshot!
}

const getServerSnapshot = (): NavigationState => SERVER_SNAPSHOT

function useSyncNavigationState(): NavigationState {
  return useSyncExternalStore<NavigationState>(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  )
}
