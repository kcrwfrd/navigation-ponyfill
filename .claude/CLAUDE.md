# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

navigation-ponyfill is a ponyfill for the browser Navigation API that enables tracking of browser history navigation in single-page applications. The primary use case is reliable detection of when `history.back()` is safe to call vs when to fallback to a URL.

## Commands

```bash
# Development - run both in separate terminals for full dev experience
npm run dev:lib          # Watch TypeScript compilation for library
npm run dev:next         # Start Next.js example app at localhost:3000

# Build
npm run build            # Build the library (tsc)
npm run clean            # Remove dist/ directory

# Code quality
npm run lint             # ESLint
npm run format           # Prettier (no semicolons, single quotes)

# Publishing (uses changesets)
npm run changeset        # Create a changeset for versioning
npm run changeset:version
npm run changeset:publish
```

## Architecture

### Monorepo Structure

- `packages/navigation-ponyfill/` - Core library
- `examples/next/` - Next.js reference implementation

### How It Works

The library monkey-patches `history.pushState` and `history.replaceState` to inject navigation metadata into the state object under `__NAVIGATION_PONYFILL`. It listens to `popstate` events for browser back/forward. The `Navigation` class extends `EventTarget` and dispatches `currententrychange` events.

### Dual Entry Points

- **Default** (`navigation-ponyfill`): Auto-initializes singleton with side effects on import
- **Core** (`navigation-ponyfill/core`): Side-effect-free, exports `createNavigation()` factory

### Key Files

- `packages/navigation-ponyfill/src/Navigation.ts` - Main class, handles monkey-patching and events
- `packages/navigation-ponyfill/src/createNavigation.ts` - Factory with SSR detection
- `packages/navigation-ponyfill/src/HistoryShim.ts` - No-op for SSR
- `examples/next/src/context/NavigationContext.tsx` - React integration pattern using `useSyncExternalStore`

### Constraints

- History state must be an object or null (not primitives/arrays) since the library merges metadata into it
- Only tracks `pushState`/`replaceState`/`popstate` navigations, not regular links or `location` assignments
