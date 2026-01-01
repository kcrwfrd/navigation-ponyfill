# Next.js + navigation-ponyfill

This example demonstrates how to integrate [navigation-ponyfill](../../) with a Next.js application to implement reliable back button behavior.

## Setup

### 1. Enable the ponyfill on the client

```typescript
// instrumentation-client.ts
import 'navigation-ponyfill'
```

This file is automatically loaded by Next.js on the client side, ensuring the ponyfill patches `history.pushState` and `history.replaceState` before any navigation occurs.

### 2. Create a React context for navigation state

```tsx
// NavigationContext.tsx
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
    cachedSnapshot = {
      canGoBack: rawState?.canGoBack ?? false,
      previousPath: rawState?.previousPath ?? null,
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
```

### 3. Use in components

```tsx
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useNavigation } from './NavigationContext'

function BackButton({ fallbackUrl = '/' }: { fallbackUrl?: string }) {
  const router = useRouter()
  const { canGoBack, previousPath } = useNavigation()

  return (
    <Link
      href={previousPath ?? fallbackUrl}
      onClick={(event) => {
        event.preventDefault()

        if (canGoBack) {
          router.back()
        } else {
          router.replace(fallbackUrl)
        }
      }}
    >
      Back
    </Link>
  )
}
```

In the future I intend to publish these bindings in a package so you can simply use them out of the box.

## Why `queueMicrotask`?

The `useSyncNavigationState` hook uses `queueMicrotask` to defer the callback. This avoids conflicts with Next.js router's internal use of `useInsertionEffect`, which can cause issues if state updates happen synchronously during the event handler.

## Why `ready`?

The `ready` flag indicates whether the component has hydrated and has access to the actual navigation state. During SSR and initial hydration, `canGoBack` defaults to `false`. You can use `ready` to:

- Hide UI elements until hydration completes (prevents flash of incorrect state)
- Show a loading/skeleton state
- Conditionally render based on actual navigation capability

## Running this example

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the example in action.
