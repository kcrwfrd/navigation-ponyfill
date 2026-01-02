---
'navigation-ponyfill': patch
---

fix: NavigationCurrentEntryChangeEvent properties

- `from` is readonly
- `navigationType` is readonly and nullable
- `bubbles` and `cancelable` default to `false`

fix: NavigationHistoryEntry url is read-only at runtime
