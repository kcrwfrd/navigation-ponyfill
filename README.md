# navigation-ponyfill

A ponyfill (polyfill) for the browser [Navigation API](https://developer.mozilla.org/en-US/docs/Web/API/Navigation_API) that enables tracking of browser history navigation, including (reasonably) reliable detection of when the user can navigate backwards in a single-page application.

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

## Quick Start

```typescript
import { navigation } from 'navigation-ponyfill'

// Check if back navigation is available
if (navigation.canGoBack) {
  history.back()
}

// Listen for navigation changes
navigation.addEventListener('currententrychange', (event) => {
  console.log('Navigated:', event.navigationType) // 'push' | 'replace' | 'traverse'
  console.log('From:', event.from.url)
  console.log('Can go back:', navigation.canGoBack)
})
```

## Entry Points

The package provides two entry points:

### Default (with side effects)

```typescript
import { navigation } from 'navigation-ponyfill'
```

Automatically patches `history.pushState` and `history.replaceState` on import. Use this for most applications.

### Core (side-effect-free)

```typescript
import { createNavigation, Navigation } from 'navigation-ponyfill/core'

const navigation = createNavigation()
```

No automatic patching—you control when and how the Navigation instance is created. Useful for testing or advanced use cases.

## API Reference

### `navigation`

A singleton `Navigation` instance (when using the default import).

#### Properties

- **`canGoBack: boolean`** — Whether the user can navigate backwards in this session.

#### Methods

- **`destroy(): void`** — Restores original history methods and removes event listeners.

#### Events

- **`currententrychange`** — Fired when navigation occurs via `pushState`, `replaceState`, or browser back/forward.

### `NavigationCurrentEntryChangeEvent`

Event object passed to `currententrychange` listeners.

```typescript
interface NavigationCurrentEntryChangeEvent extends Event {
  readonly from: NavigationHistoryEntry // Previous history entry
  readonly navigationType: NavigationType // How the navigation occurred - reload not supported
}
```

### `NavigationHistoryEntry`

Represents a history entry.

```typescript
interface NavigationHistoryEntry {
  readonly url: string | null
}
```

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

// Force ponyfill even when native is available
const navigation = createNavigation({ force: true })

// Custom history object (useful for testing)
const navigation = createNavigation({ history: customHistory })
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
    canGoBack: true,
    previousPath: '/previous-page',
  },
}
```

It also listens for `popstate` events to track browser back/forward navigation.

## Caveats

### Only tracks SPA-style navigations

The ponyfill only works for `history.pushState`, `history.replaceState`, and `popstate` (browser back/forward) driven navigations.

It does **not** track:

- Normal `<a href="./foobar">` link navigations
- Calls to `location.assign()` or `location.replace()`, which trigger cross-document (rather than same-document, SPA-style) navigations
- `location.href = './foobar'` navigations
- Form submissions `<form action="./submit">` (remember those?)
- Hash changes (`<a href="#foo">`, `location.hash = '#foo'`) - TODO

I am hopeful that support for these cases can be improved in the future with the addition of polyfilling for the `entries()` method and `currentEntry` property.

Additionally, it does not support `reload` in `NavigationCurrentEntryChangeEvent` from reload navigations. However, `canGoBack` should work since `history.state` is preserved on reload.

### State must be an object or nullish

Normally you can call `history.pushState(state, '', url)` with any serializable value for state (including boolean, string, array, etc.). Because the ponyfill merges your state with its own metadata, the state must be an object or nullish (`null`/`undefined`).

## Links

- [License (MIT)](./LICENSE)
