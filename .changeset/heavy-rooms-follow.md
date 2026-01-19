---
'navigation-ponyfill': minor
---

Add Navigation API entries support

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
