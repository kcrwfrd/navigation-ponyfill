# navigation-ponyfill

A ponyfill (polyfill) for the browser [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) that enables tracking of browser history navigation, including (reasonably) reliable detection of when the user can navigate backwards in a single-page application.

`navigation-ponyfill` has zero runtime dependencies and will defer to the native `Navigation` on `window.navigation` when available.

## What's a ponyfill?

A [ponyfill](https://github.com/sindresorhus/ponyfill) is like a polyfill, but instead of patching the global environment, it exports the functionality as a module.

Unfortunately, `navigation-ponyfill` is not entirely side-effect free due to [how it works](#how-it-works).

## Why?

My most immediate concern when implementing this ponyfill was to support "back" buttons in single-page applications. It is desirable to use the `history.back()` method in such cases so that the behavior is in-line with the browser's back button (and swiping on mobile). However, you don't want to bounce the user off your application if they came from elsewhere. In this case, it is preferable to navigate to a fallback URL instead.

It's a UI element seen in many applications (Instagram, Twitter/X, Bluesky, etc.) and while it's a slam-dunk to implement with `Navigation`, it's a minefield of edge-cases and tricky to get right using the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API). It is easiest to implement if you can just pass the previous URL with `history.pushState({ previousUrl }, '', newUrl)`, but that's not something we can readily hook into in all frameworks (looking at you, Next.js).

## Installation

```bash
npm install navigation-ponyfill
```

TypeScript projects require installation of [`@types/dom-navigation`](https://www.npmjs.com/package/@types/dom-navigation) as well.

```bash
npm install -D @types/dom-navigation
```

## Quick Start

```typescript
import { navigation } from 'navigation-ponyfill'

// Check if back navigation is available
if (navigation.canGoBack) {
  history.back()
}

// Access the current entry and history entries
console.log('Current URL:', navigation.currentEntry?.url)
console.log('History length:', navigation.entries().length)

// Listen for navigation changes
navigation.addEventListener('currententrychange', (event) => {
  console.log('Navigated:', event.navigationType) // 'push' | 'replace' | 'traverse'
  console.log('From:', event.from.url)
  console.log('To:', navigation.currentEntry?.url)
})
```

## Entry Points

The package provides two entry points:

### Default (with side effects)

```typescript
import { navigation } from 'navigation-ponyfill'
```

Returns the native `window.navigation` if available, otherwise patches `history.pushState` and `history.replaceState` and returns the ponyfill. Use this for most applications.

### Core (side-effect-free on import)

```typescript
import { createNavigation, Navigation } from 'navigation-ponyfill/core'

// No side effects until you call createNavigation()
const navigation = createNavigation()
```

No automatic patching—you control when and how the Navigation instance is created. Useful for testing or advanced use cases.

## API Reference

### `navigation`

```typescript
import { navigation } from 'navigation-ponyfill'
```

A singleton that provides the Navigation API. This can be either:

- The **native `window.navigation`** if the browser supports the Navigation API
- The **ponyfill `Navigation` instance** as a fallback

Both share a common interface for the properties and methods below.

#### Properties

- **`currentEntry: NavigationHistoryEntry | null`** — The current history entry.
- **`canGoBack: boolean`** — Whether the user can navigate backwards in this session.
- **`canGoForward: boolean`** — Whether the user can navigate forwards in this session.

#### Methods

- **`entries(): NavigationHistoryEntry[]`** — Returns an array of all history entries in the current session.
- **`addEventListener(type: 'currententrychange', listener: (event: NavigationCurrentEntryChangeEvent) => void, options?: AddEventListenerOptions): void`** — Adds an event listener for navigation events. Only `currententrychange` events are supported at this time.
- **`removeEventListener(type: 'currententrychange', listener: (event: NavigationCurrentEntryChangeEvent) => void, options?: EventListenerOptions): void`** — Removes a previously added event listener.

#### Events

- **`currententrychange`** — Fired when navigation occurs via `pushState`, `replaceState`, hash changes, or history traversal.

### `Navigation`

The ponyfill implementation, available via `createNavigation({ force: true })` or when the native API is unavailable.

#### Additional Methods

- **`destroy(): void`** — Restores original history methods and removes event listeners. Use this for cleanup in tests or when the ponyfill is no longer needed.

### `NavigationCurrentEntryChangeEvent`

Event object passed to `currententrychange` listeners.

```typescript
interface NavigationCurrentEntryChangeEvent extends Event {
  readonly from: NavigationHistoryEntry // Previous history entry
  readonly navigationType: NavigationType | null // How the navigation occurred - reload not supported
}
```

### `NavigationHistoryEntry`

Represents a history entry.

```typescript
interface NavigationHistoryEntry extends EventTarget {
  readonly id: string // Unique identifier for this entry
  readonly key: string // Stable key that persists across replace operations
  readonly index: number // Position in the entries list (-1 if disposed)
  readonly url: string | null // Full URL of the entry
  readonly sameDocument: boolean // Whether this was a same-document navigation
  getState(): unknown // Returns a clone of the state for this entry
}
```

#### Events

- **`dispose`** — Fired when the entry is removed from the history stack (e.g., on replace, or when navigating to a new page after going back).

### `NavigationType`

```typescript
type NavigationType = 'push' | 'replace' | 'traverse' | 'reload'
```

- `push` — `history.pushState()` was called
- `replace` — `history.replaceState()` was called
- `traverse` — Browser back/forward navigation (popstate)
- `reload` — Page reload (not currently emitted, included for alignment with native types)

### `createNavigation(options?)`

Factory function to create a `Navigation` instance.

```typescript
function createNavigation(
  options?: CreateNavigationOptions,
): Navigation | NativeNavigation
function createNavigation(options: { force: true }): Navigation
```

By default, returns the native `window.navigation` if available, otherwise returns the ponyfill. Use `force: true` to always get the ponyfill instance.

#### `CreateNavigationOptions`

```typescript
type CreateNavigationOptions = {
  force?: boolean
  history?: History | HistoryShim
}
```

- **`force`** — When `true`, always returns the ponyfill `Navigation` instance, even if the native Navigation API is available. Default: `false` (prefers native when available).
- **`history`** — Custom `History` object to use. Defaults to `window.history` in browser environments, or a no-op `HistoryShim` during SSR.

#### Examples

```typescript
import { createNavigation } from 'navigation-ponyfill/core'

// Default: uses native Navigation API if available, otherwise ponyfill
const navigation = createNavigation()

// Force ponyfill even when native is available (useful for testing)
const navigation = createNavigation({ force: true })

// Type narrowing for ponyfill-specific methods
if ('destroy' in navigation) {
  navigation.destroy()
}

// Custom history object (useful for testing)
const navigation = createNavigation({ force: true, history: customHistory })
```

## Framework Integration

### Next.js

See the [Next.js example](./examples/next) for a complete integration with React context and hooks.

## SSR Support

The ponyfill includes a `HistoryShim` that provides a no-op implementation for server-side rendering. When `window` is not available, `createNavigation()` automatically uses the shim.

## How It Works

The ponyfill monkey-patches [`history.pushState`](https://developer.mozilla.org/en-US/docs/Web/API/History/pushState) and [`history.replaceState`](https://developer.mozilla.org/en-US/docs/Web/API/History/replaceState), augmenting the state object with navigation metadata:

```javascript
history.state = {
  ...yourState,
  __NAVIGATION_PONYFILL: {
    entryId: 'abc123',
    entryKey: 'def456',
  },
}
```

It relates the `entryId` and `entryKey` to a stack of `NavigationHistoryEntry` objects persisted to `sessionStorage`, allowing `entries()` and `currentEntry` to survive page reloads. It also listens for `popstate` events to track browser back/forward navigation and hash changes.

Because of the use of `history.state` and `sessionStorage`, the ponyfill even works in multi-page applications (MPAs).

## Caveats

### Unsupported APIs

- `NavigationCurrentEntryChangeEvent` with `navigationType: 'reload'` - this is impossible for us to detect.
- `NavigationHistoryEntry.sameDocument` does not work -- we always set it to `true` to maintain the same type signature with native API. It is impossible for us to determine in the ponyfill if an entry is from the same document (page) or not.

### Multi-Page Applications (MPAs)

- While the ponyfill works for MPAs, _it must be loaded on every page_. If it's not, its state might become corrupted. This is untested.

### State in History API calls must be an object or nullish

Normally you can call `history.pushState(state, '', url)` with any serializable value for state (including boolean, string, array, etc.). Because the ponyfill merges your state with its own metadata, the state must be an object or nullish (`null`/`undefined`).

## Supported APIs

Based on the [Navigation API specification](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API). Most currently unsupported APIs are planned to be added.

Some of the most interesting (and complex) APIs are in managing the navigation transition lifecycle. How well we can support these remains to be determined.

I do hope to support `NavigateEvent.preventDefault()` to cancel navigations, and `NavigateEvent.intercept()` to handle them.

### Navigation

|     | Property/Method         |
| --- | ----------------------- |
| ✅  | `currentEntry`          |
| ✅  | `canGoBack`             |
| ✅  | `canGoForward`          |
| ✅  | `entries()`             |
| ✅  | `addEventListener()`    |
| ✅  | `removeEventListener()` |
| ❌  | `oncurrententrychange`  |
| ❌  | `transition`            |
| ❌  | `activation`            |
| ❌  | `navigate()`            |
| ❌  | `reload()`              |
| ❌  | `back()`                |
| ❌  | `forward()`             |
| ❌  | `traverseTo()`          |
| ❌  | `updateCurrentEntry()`  |

### Navigation Events

|     | Event                |
| --- | -------------------- |
| ✅  | `currententrychange` |
| ❌  | `navigate`           |
| ❌  | `navigatesuccess`    |
| ❌  | `navigateerror`      |

### NavigationHistoryEntry

|     | Property/Method                |
| --- | ------------------------------ |
| ✅  | `id`                           |
| ✅  | `key`                          |
| ✅  | `index`                        |
| ✅  | `url`                          |
| ⚠️  | `sameDocument` - always `true` |
| ✅  | `getState()`                   |
| ✅  | `dispose` event                |
| ❌  | `ondispose`                    |

### NavigationCurrentEntryChangeEvent

|     | Property                                |
| --- | --------------------------------------- |
| ✅  | `from`                                  |
| ⚠️  | `navigationType` - `reload` not emitted |

### Not Implemented

|     | Interface                       |
| --- | ------------------------------- |
| ❌  | `NavigateEvent`                 |
| ❌  | `NavigationTransition`          |
| ❌  | `NavigationDestination`         |
| ❌  | `NavigationActivation`          |
| ❌  | `NavigationPrecommitController` |

## Links

- [License (MIT)](./LICENSE)
