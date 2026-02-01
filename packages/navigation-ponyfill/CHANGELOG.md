# navigation-ponyfill

## 0.2.0

### Minor Changes

- 8e6ecfc: Add Navigation API entries support

  **Navigation**
  - Add `currentEntry` getter returning the current `NavigationHistoryEntry`
  - Add `entries()` method returning all history entries
  - Persist entries to `sessionStorage` for reload resilience
  - Deprecate `Navigation.KEY` in favor of using `currentEntry` and `entries()` APIs
  - `canGoBack` now supported in multi-page apps due to support of `entries()` with `sessionStorage` persistence

  **NavigationHistoryEntry**
  - Now extends `EventTarget`
  - Add `id`, `key`, `url`, `index`, `sameDocument` properties
  - Add `getState()` method to retrieve user state
  - Add `dispose` event fired when entry is removed or replaced

- 4b9ae8c: **Navigation**
  - Add support for `canGoForward`

- 9bd0c1e: Defer to native `Navigation` when available
  - Breaking: changed `createNavigation(history?)` to `createNavigation({ force?: boolean, history?: History })`

### Patch Changes

- 221d830: breaking: NavigationHistoryEntry has full url instead of path

  This makes it behave the same as native NavigationHistoryEntry

- 9ed1eab: fix: NavigationCurrentEntryChangeEvent properties
  - `from` is readonly
  - `navigationType` is readonly and nullable
  - `bubbles` and `cancelable` default to `false`

  fix: NavigationHistoryEntry url is read-only at runtime

## 0.1.0

### Minor Changes

- Initial Navigation implementation with support for `navigation.canGoBack`

## 0.1.0-alpha.0

### Minor Changes

- Initial Navigation implementation with support for `navigation.canGoBack`
