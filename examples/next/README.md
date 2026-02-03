# Next.js + navigation-ponyfill

This example demonstrates how to integrate [navigation-ponyfill](../../) with a Next.js application to implement reliable back button behavior.

## Setup

Import the polyfill in your [`instrumentation-client.js`](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation-client) file:

```typescript
// instrumentation-client.ts
import 'navigation-ponyfill'
```

This file is automatically loaded by Next.js on the client side, ensuring the ponyfill patches `history.pushState` and `history.replaceState` before any navigation occurs.

## React Integration

The recommended pattern uses `useSyncExternalStore` to subscribe to `currententrychange` events. This will enable your components to re-render when your navigation state changes.

See the full implementation:

- [src/context/NavigationContext.tsx](src/context/NavigationContext.tsx) - Context provider with `useSyncExternalStore`
- [src/components/BackButton.tsx](src/components/BackButton.tsx) - Back button example

Some day in the future, you will be able to remove the polyfill and continue using this code with the native Navigation API.

### Why `queueMicrotask`?

The subscribe function uses `queueMicrotask` to defer the callback. This avoids conflicts with Next.js router's internal use of `useInsertionEffect`, which throws "useInsertionEffect must not schedule updates" if state updates happen synchronously during the event handler.

### Why `ready`?

The `ready` flag indicates whether the component has hydrated and has access to the actual navigation state. During SSR and initial hydration, `canGoBack` defaults to `false`. You can use `ready` to:

- Hide UI elements until hydration completes (prevents flash of incorrect state)
- Show a loading/skeleton state
- Conditionally render based on actual navigation capability

## Router Events

Sad that Next.js removed router events in the app router? We've got you covered.

You can listen to navigation changes directly using the `currententrychange` event:

```typescript
'use client'

import {
  navigation,
  type NavigationCurrentEntryChangeEvent,
} from 'navigation-ponyfill'
import { useEffect, type PropsWithChildren } from 'react'

export const NavigationEventListener = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const handler = (event: NavigationCurrentEntryChangeEvent) => {
      console.log('Navigation type:', event.navigationType) // 'push' | 'replace' | 'traverse'
      console.log('To:', navigation.currentEntry?.url)
      console.log('From:', event.from.url)

      /**
       * Note that this event may fire more often than the old pages router
       * `routeChangeComplete` event, due to history.replace() calls that occur
       * within the next.js router internals. You may wish to compare the URLs.
       */
      if (event.from.url !== navigation.currentEntry?.url) {
        console.log('routeChangeComplete:', navigation.currentEntry?.url)
      }
    }

    // @todo release forthcoming to fix the event handler types - assert for now
    navigation.addEventListener('currententrychange', handler as EventListener)

    return () => {
      navigation.removeEventListener(
        'currententrychange',
        handler as EventListener,
      )
    }
  }, [])

  return children
}
```

## Running this example

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the example in action.

### `NEXT_PUBLIC_FORCE_PONYFILL`

By default, the ponyfill defers to the native Navigation API when available. Set this environment variable to `true` to force the ponyfill even in browsers that support the native API:

```bash
# .env.local
NEXT_PUBLIC_FORCE_PONYFILL=true
```

This is useful for testing ponyfill behavior in modern browsers or ensuring consistent behavior across all browsers during development. See [src/lib/navigation.ts](src/lib/navigation.ts) for the implementation.

## E2E Tests

This example includes Playwright e2e tests to verify navigation behavior.

```bash
# Run all e2e tests
npm run test:e2e

# Run with UI mode (for debugging)
npm run test:e2e:ui

# Run headed (visible browser)
npm run test:e2e:headed
```

### Testing with ponyfill vs deferral to native Navigation API

By default, e2e tests run with `NEXT_PUBLIC_FORCE_PONYFILL=true` to test the ponyfill implementation. You can override this to test against the browser's native Navigation API:

```bash
# Test with ponyfill forced (default)
npm run test:e2e

# Test with deferral to native Navigation API
NEXT_PUBLIC_FORCE_PONYFILL=false npm run test:e2e
```
