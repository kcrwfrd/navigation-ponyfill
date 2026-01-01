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

import { navigation, Navigation } from 'navigation-ponyfill'
import { createContext, useContext, useSyncExternalStore } from 'react'

interface NavigationState {
  canGoBack: boolean
  previousPath: string | null
  ready: boolean
}

const NavigationContext = createContext<NavigationState | null>(null)

function useSyncHistoryState(): NavigationState {
  return useSyncExternalStore(
    (callback) => {
      const handler = () => queueMicrotask(callback)
      navigation.addEventListener('currententrychange', handler)
      return () => navigation.removeEventListener('currententrychange', handler)
    },
    () => {
      const state = window.history.state?.[Navigation.KEY]
      return {
        canGoBack: state?.canGoBack ?? false,
        previousPath: state?.previousPath ?? null,
        ready: true,
      }
    },
    () => ({ canGoBack: false, previousPath: null, ready: false }),
  )
}

export function NavigationProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { canGoBack, previousPath, ready } = useSyncHistoryState()

  return (
    <NavigationContext value={{ canGoBack, previousPath, ready }}>
      {children}
    </NavigationContext>
  )
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider')
  }
  return context
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

The `useSyncHistoryState` hook uses `queueMicrotask` to defer the callback. This avoids conflicts with Next.js router's internal use of `useInsertionEffect`, which can cause issues if state updates happen synchronously during the event handler.

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
