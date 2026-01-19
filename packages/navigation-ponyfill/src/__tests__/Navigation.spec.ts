import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Navigation, getCurrentUrl } from '../Navigation'
import { NavigationCurrentEntryChangeEvent } from '../NavigationCurrentEntryChangeEvent'
import { NavigationHistoryEntriesStack } from '../NavigationHistoryEntriesStack'

describe('Navigation', () => {
  let nav: Navigation
  const history = window.history

  beforeEach(() => {
    // Clear sessionStorage to prevent entries from previous tests affecting this one
    NavigationHistoryEntriesStack.clearStorage()
    // Reset history state
    history.replaceState(null, '', '/initial')
  })

  afterEach(() => {
    nav?.destroy()
    vi.restoreAllMocks()
  })

  describe('constructor', () => {
    it('should extend EventTarget', () => {
      nav = new Navigation(history)

      expect(nav).toBeInstanceOf(EventTarget)
    })

    it('should monkey-patch history.pushState', () => {
      const originalPushState = history.pushState

      nav = new Navigation(history)

      expect(history.pushState).not.toBe(originalPushState)
    })

    it('should monkey-patch history.replaceState', () => {
      const originalReplaceState = history.replaceState

      nav = new Navigation(history)

      expect(history.replaceState).not.toBe(originalReplaceState)
    })

    it('should register popstate event listener in browser environment', () => {
      vi.spyOn(window, 'addEventListener')

      nav = new Navigation(history)

      expect(window.addEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function),
      )
    })
  })

  describe('static KEY', () => {
    it('should equal "__NAVIGATION_PONYFILL"', () => {
      expect(Navigation.KEY).toBe('__NAVIGATION_PONYFILL')
    })
  })

  describe('monkey-patched pushState', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should inject __NAVIGATION_PONYFILL metadata into state', () => {
      history.pushState({ foo: 'bar' }, '', '/new-path')

      expect(history.state).toHaveProperty('__NAVIGATION_PONYFILL')
      expect(history.state.foo).toBe('bar')
    })

    it('should set canGoBack to true after push', () => {
      history.pushState({}, '', '/new-path')

      expect(nav.canGoBack).toBe(true)
    })

    it('should track previous entry URL from current location', () => {
      history.pushState({}, '', '/new-path')

      const prevIndex = nav.currentEntry.index - 1
      expect(nav.entries()[prevIndex].url).toBe('http://localhost:3000/initial')
    })

    it('should preserve original state properties', () => {
      history.pushState({ custom: 'data', nested: { a: 1 } }, '', '/path')

      expect(history.state.custom).toBe('data')
      expect(history.state.nested).toEqual({ a: 1 })
    })

    it('should dispatch currententrychange event with type "push"', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/new-path')

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('push')
    })

    it('should include NavigationHistoryEntry with previous URL in event.from', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/new-path')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from.url).toBe('http://localhost:3000/initial')
    })

    it('should throw TypeError when state is a primitive string', () => {
      expect(() => {
        history.pushState('invalid', '', '/path')
      }).toThrow(TypeError)
    })

    it('should throw TypeError when state is a number', () => {
      expect(() => {
        history.pushState(42, '', '/path')
      }).toThrow(TypeError)
    })

    it('should throw TypeError with descriptive message for array state', () => {
      expect(() => {
        history.pushState(['array'], '', '/path')
      }).toThrow(
        'history state must be a non-array object or nullish, received array',
      )
    })

    it('should throw TypeError when state is a boolean', () => {
      expect(() => {
        history.pushState(true, '', '/path')
      }).toThrow(TypeError)
    })

    it('should accept null state', () => {
      expect(() => {
        history.pushState(null, '', '/path')
      }).not.toThrow()

      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should accept undefined state', () => {
      expect(() => {
        history.pushState(undefined, '', '/path')
      }).not.toThrow()

      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should accept object state', () => {
      expect(() => {
        history.pushState({ valid: 'object' }, '', '/path')
      }).not.toThrow()
    })

    it('should handle empty string URL', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      expect(() => {
        history.pushState({}, '', '')
      }).not.toThrow()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should handle undefined URL', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      expect(() => {
        history.pushState({}, '')
      }).not.toThrow()

      expect(handler).toHaveBeenCalledTimes(1)
      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })
  })

  describe('monkey-patched replaceState', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should inject __NAVIGATION_PONYFILL metadata into state', () => {
      history.replaceState({ foo: 'bar' }, '', '/replaced')

      expect(history.state).toHaveProperty('__NAVIGATION_PONYFILL')
      expect(history.state.foo).toBe('bar')
    })

    it('should preserve canGoBack after replaceState', () => {
      // First push to set canGoBack to true
      history.pushState({}, '', '/first')
      expect(nav.canGoBack).toBe(true)

      // Replace should preserve canGoBack (still have entry at index 0)
      history.replaceState({}, '', '/replaced')
      expect(nav.canGoBack).toBe(true)
    })

    it('should have canGoBack false when no previous entries', () => {
      history.replaceState({}, '', '/replaced')

      expect(nav.canGoBack).toBe(false)
    })

    it('should preserve previous entry URL after replaceState', () => {
      // Push creates an entry we can go back to
      history.pushState({}, '', '/second')
      const entries = nav.entries()
      const previousUrl = entries[0].url

      // Replace should not affect the previous entry
      history.replaceState({}, '', '/replaced')
      const entriesAfterReplace = nav.entries()
      expect(entriesAfterReplace[0].url).toBe(previousUrl)
    })

    it('should have no previous entry on fresh initialization', () => {
      history.replaceState({}, '', '/replaced')

      const entries = nav.entries()
      expect(entries.length).toBe(1)
      // No previous entry to go back to
      expect(entries[0].url).toBe('http://localhost:3000/replaced')
    })

    it('should dispatch currententrychange event with type "replace"', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.replaceState({}, '', '/replaced')

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('replace')
    })

    it('should include NavigationHistoryEntry with current URL in event.from', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.replaceState({}, '', '/replaced')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from.url).toBe('http://localhost:3000/initial')
    })

    it('should throw TypeError for primitive state values', () => {
      expect(() => {
        history.replaceState('string', '', '/path')
      }).toThrow(TypeError)

      expect(() => {
        history.replaceState(123, '', '/path')
      }).toThrow(TypeError)

      expect(() => {
        history.replaceState(true, '', '/path')
      }).toThrow(TypeError)
    })

    it('should accept null state', () => {
      expect(() => {
        history.replaceState(null, '', '/path')
      }).not.toThrow()

      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should accept undefined state', () => {
      expect(() => {
        history.replaceState(undefined, '', '/path')
      }).not.toThrow()

      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should generate a new entryId and use the same entryKey', () => {
      const { entryId: ogId, entryKey: ogKey } =
        history.state.__NAVIGATION_PONYFILL

      history.replaceState(null, '', '/no-entrykey')

      const { entryId, entryKey } = history.state.__NAVIGATION_PONYFILL

      expect(entryId).toBeTruthy()
      expect(entryId).not.toBe(ogId)
      expect(entryKey).toBe(ogKey)
    })

    it('should generate new key when history.state has no existing entryKey', () => {
      const { entryId: ogId, entryKey: ogKey } =
        history.state.__NAVIGATION_PONYFILL

      delete history.state.__NAVIGATION_PONYFILL.entryKey

      expect(history.state.__NAVIGATION_PONYFILL.entryKey).toBeUndefined()

      history.replaceState(null, '', '/no-entrykey')

      const { entryId, entryKey } = history.state.__NAVIGATION_PONYFILL

      expect(entryId).toBeTruthy()
      expect(entryId).not.toBe(ogId)
      expect(entryKey).toBeTruthy()
      expect(entryKey).not.toBe(ogKey)
    })
  })

  describe('popstate handling', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should dispatch currententrychange event on popstate', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should set navigationType to "traverse"', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      window.dispatchEvent(new PopStateEvent('popstate', { state: null }))

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('traverse')
    })

    it('should log error and set currentIndex to -1 when entry not found on popstate', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {})

      // The popstate handler reads from history.state, not event.state
      // We need to set history.state to have a key that doesn't exist in our stack
      // Use the original (non-patched) replaceState to set the state without triggering events
      nav.destroy()
      NavigationHistoryEntriesStack.clearStorage()

      // Set up history with a state that has a non-existent entry key
      const fakeState = {
        __NAVIGATION_PONYFILL: {
          entryId: 'non-existent-id',
          entryKey: 'non-existent-key',
        },
      }
      history.replaceState(fakeState, '', '/test')
      history.pushState({}, '', '/test2')

      // Create a new Navigation - this will initialize with the current entry
      nav = new Navigation(history)

      const popstate1 = waitForPopstate()
      history.back()
      await popstate1

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'targetEntry not found on popstate for navigation state:',
        fakeState.__NAVIGATION_PONYFILL,
        'navigation-ponyfill is in an irrecoverable state.',
      )

      // currentEntry should be null since currentIndex is -1
      expect(nav.currentEntry).toBe(null)

      // canGoBack should use ?? 0 fallback when currentEntry is null
      expect(nav.canGoBack).toBe(false)

      consoleErrorSpy.mockRestore()
    })
  })

  describe('canGoBack getter', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should return false when history.state is null', () => {
      expect(nav.canGoBack).toBe(false)
    })

    it('should return false when __NAVIGATION_PONYFILL is missing', () => {
      // Use unpatched replaceState to set state without metadata
      nav.destroy()
      NavigationHistoryEntriesStack.clearStorage()
      history.replaceState({ noMetadata: true }, '', '/path')
      nav = new Navigation(history)

      expect(nav.canGoBack).toBe(false)
    })

    it('should return true when there is a previous entry', () => {
      history.pushState({}, '', '/new-path')

      expect(nav.canGoBack).toBe(true)
    })

    it('should return false after replaceState on initial page', () => {
      history.replaceState({}, '', '/replaced')

      expect(nav.canGoBack).toBe(false)
    })
  })

  describe('destroy()', () => {
    it('should restore original pushState method', () => {
      const originalPushState = history.pushState

      nav = new Navigation(history)
      expect(history.pushState).not.toBe(originalPushState)

      nav.destroy()
      expect(history.pushState).toBe(originalPushState)
    })

    it('should restore original replaceState method', () => {
      const originalReplaceState = history.replaceState

      nav = new Navigation(history)
      expect(history.replaceState).not.toBe(originalReplaceState)

      nav.destroy()
      expect(history.replaceState).toBe(originalReplaceState)
    })

    it('should remove popstate event listener', () => {
      vi.spyOn(window, 'removeEventListener')

      nav = new Navigation(history)

      nav.destroy()

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function),
      )
    })

    it('should allow multiple destroy calls without error', () => {
      nav = new Navigation(history)

      expect(() => {
        nav.destroy()
        nav.destroy()
        nav.destroy()
      }).not.toThrow()
    })
  })

  describe('event listener management', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should support multiple event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      nav.addEventListener('currententrychange', handler1)
      nav.addEventListener('currententrychange', handler2)

      history.pushState({}, '', '/path')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should allow removeEventListener', () => {
      const handler = vi.fn()

      nav.addEventListener('currententrychange', handler)
      nav.removeEventListener('currententrychange', handler)

      history.pushState({}, '', '/path')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation chain', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should track navigation chain with canGoBack', () => {
      // Initial state - no history
      expect(nav.canGoBack).toBe(false)

      // First navigation
      history.pushState({}, '', '/page1')
      expect(nav.canGoBack).toBe(true)

      // Second navigation
      history.pushState({}, '', '/page2')
      expect(nav.canGoBack).toBe(true)
    })

    it('should handle URL with query parameters', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/search?q=test&page=1')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle URL with hash', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/page#section')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should track previous entry URL through multiple navigations', () => {
      const getPreviousUrl = () => {
        const prevIndex = nav.currentEntry.index - 1
        return nav.entries()[prevIndex]?.url ?? null
      }

      history.pushState({}, '', '/page1')
      expect(getPreviousUrl()).toBe('http://localhost:3000/initial')

      history.pushState({}, '', '/page2')
      expect(getPreviousUrl()).toBe('http://localhost:3000/page1')

      history.pushState({}, '', '/page3')
      expect(getPreviousUrl()).toBe('http://localhost:3000/page2')
    })

    it('should preserve canGoBack and previous entry when replaceState is used mid-chain', () => {
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')

      // Replace current entry - should preserve previous entries
      history.replaceState({ replaced: true }, '', '/page2-replaced')

      expect(nav.canGoBack).toBe(true)
      // Previous entry should still be page1
      const prevIndex = nav.currentEntry.index - 1
      expect(nav.entries()[prevIndex].url).toBe('http://localhost:3000/page1')
      expect(history.state.replaced).toBe(true)
    })

    it('should track event.from correctly through navigation chain', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')
      history.pushState({}, '', '/page3')

      expect(handler).toHaveBeenCalledTimes(3)

      const events = handler.mock.calls.map(
        (call) => call[0] as NavigationCurrentEntryChangeEvent,
      )
      expect(events[0].from.url).toBe('http://localhost:3000/initial')
      expect(events[1].from.url).toBe('http://localhost:3000/page1')
      expect(events[2].from.url).toBe('http://localhost:3000/page2')
    })

    it('should preserve user state alongside navigation metadata', () => {
      history.pushState({ step: 1, data: 'first' }, '', '/page1')
      history.pushState({ step: 2, data: 'second' }, '', '/page2')

      expect(history.state.step).toBe(2)
      expect(history.state.data).toBe('second')
      expect(history.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should handle complex URL with query params and hash', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      history.pushState({}, '', '/search?q=test&filter=active#results')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('push')
      expect(event.from.url).toBe('http://localhost:3000/initial')
    })
  })

  describe('getCurrentUrl', () => {
    it('should throw error when called during SSR', () => {
      vi.stubGlobal('window', undefined)

      expect(() => {
        getCurrentUrl()
      }).toThrow('getCurrentUrl can only be called in the browser')

      vi.unstubAllGlobals()
    })
  })

  describe('generateId fallback', () => {
    it('should generate ID using fallback when crypto.randomUUID is unavailable', () => {
      // Save original crypto
      const originalCrypto = globalThis.crypto

      // Mock crypto without randomUUID
      vi.stubGlobal('crypto', {
        getRandomValues: originalCrypto.getRandomValues,
      })

      nav = new Navigation(history)

      // The entry should still have a valid ID
      expect(nav.currentEntry?.id).toBeDefined()
      expect(typeof nav.currentEntry?.id).toBe('string')
      expect(nav.currentEntry!.id.length).toBeGreaterThan(0)

      // ID should match the fallback format: timestamp-random
      expect(nav.currentEntry!.id).toMatch(/^[a-z0-9]+-[a-z0-9]+$/)

      vi.unstubAllGlobals()
    })
  })

  describe('resolveUrl with URL object', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should handle URL object parameter in pushState', () => {
      const urlObj = new URL('/page-from-url-object', window.location.href)

      history.pushState({}, '', urlObj)

      expect(nav.currentEntry?.url).toBe(
        'http://localhost:3000/page-from-url-object',
      )
    })

    it('should handle URL object parameter in replaceState', () => {
      const urlObj = new URL('/replaced-from-url-object', window.location.href)

      history.replaceState({}, '', urlObj)

      expect(nav.currentEntry?.url).toBe(
        'http://localhost:3000/replaced-from-url-object',
      )
    })
  })

  describe('currentEntry', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should return a NavigationHistoryEntry on initialization', () => {
      expect(nav.currentEntry).not.toBeNull()
      expect(nav.currentEntry?.url).toBe('http://localhost:3000/initial')
    })

    it('should have id and key properties', () => {
      expect(nav.currentEntry?.id).toBeDefined()
      expect(typeof nav.currentEntry?.id).toBe('string')
      expect(nav.currentEntry?.key).toBeDefined()
      expect(typeof nav.currentEntry?.key).toBe('string')
    })

    it('should have index of 0 on fresh initialization', () => {
      expect(nav.currentEntry?.index).toBe(0)
    })

    it('should update after pushState', () => {
      const initialEntry = nav.currentEntry
      const initialId = initialEntry?.id
      const initialKey = initialEntry?.key

      history.pushState({}, '', '/page1')

      expect(nav.currentEntry).not.toBe(initialEntry)
      expect(nav.currentEntry?.id).not.toBe(initialId)
      expect(nav.currentEntry?.key).not.toBe(initialKey)
      expect(nav.currentEntry?.url).toBe('http://localhost:3000/page1')
      expect(nav.currentEntry?.index).toBe(1)
    })

    it('should update after replaceState with same key but different id', () => {
      const initialKey = nav.currentEntry?.key
      const initialId = nav.currentEntry?.id

      history.replaceState({}, '', '/replaced')

      expect(nav.currentEntry?.key).toBe(initialKey)
      expect(nav.currentEntry?.id).not.toBe(initialId)
      expect(nav.currentEntry?.url).toBe('http://localhost:3000/replaced')
    })

    it('should have sameDocument set to true', () => {
      expect(nav.currentEntry?.sameDocument).toBe(true)
    })

    it('should return state via getState()', () => {
      history.pushState({ foo: 'bar' }, '', '/page1')

      expect(nav.currentEntry?.getState()).toEqual({ foo: 'bar' })
    })
  })

  describe('entries()', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should return array with single entry on initialization', () => {
      const entries = nav.entries()
      expect(entries).toHaveLength(1)
      expect(entries[0]).toBe(nav.currentEntry)
    })

    it('should grow after multiple pushState calls', () => {
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')
      history.pushState({}, '', '/page3')

      const entries = nav.entries()
      expect(entries).toHaveLength(4)
      expect(entries[0].url).toBe('http://localhost:3000/initial')
      expect(entries[1].url).toBe('http://localhost:3000/page1')
      expect(entries[2].url).toBe('http://localhost:3000/page2')
      expect(entries[3].url).toBe('http://localhost:3000/page3')
    })

    it('should return shallow copy', () => {
      const entries1 = nav.entries()
      const entries2 = nav.entries()

      expect(entries1).not.toBe(entries2)
      expect(entries1).toEqual(entries2)
    })

    it('entries should have correct index values', () => {
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')

      const entries = nav.entries()
      expect(entries[0].index).toBe(0)
      expect(entries[1].index).toBe(1)
      expect(entries[2].index).toBe(2)
    })

    it('should preserve same key on replaceState', () => {
      const initialKey = nav.currentEntry?.key

      history.replaceState({}, '', '/replaced')

      const entries = nav.entries()
      expect(entries).toHaveLength(1)
      expect(entries[0].key).toBe(initialKey)
    })
  })

  describe('entry tracking through traversal', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should track entries correctly through multiple pushState calls', () => {
      // This test verifies that entries are tracked correctly
      // Real popstate traversal testing requires browser integration tests
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')

      const entries = nav.entries()
      expect(entries).toHaveLength(3)
      expect(entries[0].url).toBe('http://localhost:3000/initial')
      expect(entries[1].url).toBe('http://localhost:3000/page1')
      expect(entries[2].url).toBe('http://localhost:3000/page2')

      // Current entry should be the last one
      expect(nav.currentEntry).toBe(entries[2])
      expect(nav.currentEntry?.index).toBe(2)
    })

    it('entries should track through pushState calls', () => {
      history.pushState({}, '', '/page1')
      const page1Entry = nav.entries()[1]

      history.pushState({}, '', '/page2')
      const page2Entry = nav.entries()[2]

      expect(page1Entry.key).not.toBe(page2Entry.key)
      expect(nav.currentEntry).toBe(page2Entry)
    })

    it('should dispatch event with correct from entry on pushState', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      const initialEntry = nav.currentEntry

      history.pushState({}, '', '/page1')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from).toBe(initialEntry)
    })

    it('should dispatch event with correct from entry on replaceState', () => {
      history.pushState({}, '', '/page1')

      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      const currentEntryBeforeReplace = nav.currentEntry

      history.replaceState({}, '', '/page1-replaced')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from).toBe(currentEntryBeforeReplace)
    })
  })

  describe('state storage in entries', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should store user state in entry via getState()', () => {
      history.pushState({ data: 'test', count: 42 }, '', '/page1')

      expect(nav.currentEntry?.getState()).toEqual({ data: 'test', count: 42 })
    })

    it('should preserve state through pushState', () => {
      history.pushState({ first: true }, '', '/page1')
      history.pushState({ second: true }, '', '/page2')

      const entries = nav.entries()
      expect(entries[1].getState()).toEqual({ first: true })
      expect(entries[2].getState()).toEqual({ second: true })
    })

    it('getState returns clone, not reference', () => {
      history.pushState({ value: 1 }, '', '/page1')

      const state1 = nav.currentEntry?.getState() as { value: number }
      const state2 = nav.currentEntry?.getState() as { value: number }

      expect(state1).toEqual(state2)
      expect(state1).not.toBe(state2)

      state1.value = 999
      expect(nav.currentEntry?.getState()).toEqual({ value: 1 })
    })
  })

  describe('dispose event', () => {
    beforeEach(() => {
      nav = new Navigation(history)
    })

    it('should dispatch dispose event when entry is replaced', () => {
      const disposeHandler = vi.fn()
      nav.currentEntry?.addEventListener('dispose', disposeHandler)

      history.replaceState({}, '', '/replaced')

      expect(disposeHandler).toHaveBeenCalledTimes(1)
    })

    it('should dispatch dispose event when entry is replaced via replaceState', () => {
      history.pushState({}, '', '/page1')

      const page1Entry = nav.currentEntry!
      const disposeHandler = vi.fn()
      page1Entry.addEventListener('dispose', disposeHandler)

      // Replace current entry - should dispatch dispose on old entry
      history.replaceState({}, '', '/page1-replaced')

      expect(disposeHandler).toHaveBeenCalledTimes(1)
    })

    it('disposed entry should return index -1 after being replaced', () => {
      history.pushState({}, '', '/page1')

      const page1Entry = nav.currentEntry!
      expect(page1Entry.index).toBe(1)

      // Replace current entry
      history.replaceState({}, '', '/page1-replaced')

      // Old entry should now have index -1 since it's no longer in the list
      expect(page1Entry.index).toBe(-1)

      // New entry should have the correct index
      expect(nav.currentEntry?.index).toBe(1)
    })

    it('should dispatch dispose events for truncated forward history entries', async () => {
      // Push multiple entries
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')
      history.pushState({}, '', '/page3')

      const entries = nav.entries()
      expect(entries).toHaveLength(4)

      // Set up dispose handlers on the entries that will be truncated
      const page2Entry = entries[2]
      const page3Entry = entries[3]
      const disposeHandler2 = vi.fn()
      const disposeHandler3 = vi.fn()
      page2Entry.addEventListener('dispose', disposeHandler2)
      page3Entry.addEventListener('dispose', disposeHandler3)

      // Go back twice to get to page1
      const popstate1 = waitForPopstate()
      history.back()
      await popstate1

      const popstate2 = waitForPopstate()
      history.back()
      await popstate2

      // Verify we're at page1
      expect(nav.currentEntry?.url).toBe('http://localhost:3000/page1')

      // Push a new entry - should truncate page2 and page3
      history.pushState({}, '', '/page4')

      expect(disposeHandler2).toHaveBeenCalledTimes(1)
      expect(disposeHandler3).toHaveBeenCalledTimes(1)
    })
  })

  describe('sessionStorage rehydration', () => {
    let nav: Navigation
    let currentEntryId: string, currentEntryKey: string

    beforeEach(() => {
      // Create a Navigation and push some entries
      nav = new Navigation(history)
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')

      // Get the current entry's details
      currentEntryId = nav.currentEntry.id
      currentEntryKey = nav.currentEntry.key
    })

    afterEach(() => {
      nav.destroy()
      NavigationHistoryEntriesStack.clearStorage()
    })

    it('should rehydrate from sessionStorage and find existing entry by id', () => {
      // Verify we have entries in the stack
      expect(nav.entries().length).toBe(3)

      // Destroy navigation but keep sessionStorage data
      nav.destroy()

      // Create a new Navigation - should rehydrate from sessionStorage
      nav = new Navigation(history)

      // Should have found the existing entry and set it as current
      expect(nav.currentEntry).not.toBe(null)
      expect(nav.currentEntry.id).toBe(currentEntryId)
      expect(nav.currentEntry.key).toBe(currentEntryKey)
      expect(nav.currentEntry.url).toBe('http://localhost:3000/page2')
      expect(nav.currentEntry.index).toBe(2)

      // Entries should be preserved from sessionStorage
      expect(nav.entries().length).toBe(3)
    })

    it('should rehydrate with the correct entry if we have traversed history', async () => {
      expect(nav.entries().length).toBe(3)

      nav.destroy()

      await back()
      await back()

      nav = new Navigation(history)

      expect(nav.entries().length).toBe(3)
      expect(nav.currentEntry.url).toBe('http://localhost:3000/initial')
      expect(nav.currentEntry.index).toBe(0)
    })

    it('should call setCurrentIndex when rehydrated entry is found by id', () => {
      // Verify preconditions
      expect(nav.entries().length).toBe(3)
      expect(history.state?.__NAVIGATION_PONYFILL?.entryId).toBe(currentEntryId)

      // Destroy navigation but keep sessionStorage
      nav.destroy()

      // Spy on setCurrentIndex to verify it's called during rehydration
      const setCurrentIndexSpy = vi.spyOn(
        NavigationHistoryEntriesStack.prototype,
        'setCurrentIndex',
      )

      // Create a new Navigation
      nav = new Navigation(history)

      // Verify setCurrentIndex was called with the correct index (2 for page2)
      expect(setCurrentIndexSpy).toHaveBeenCalledWith(2)

      // Also verify the entry was properly set
      expect(nav.currentEntry.id).toBe(currentEntryId)
      expect(nav.currentEntry.index).toBe(2)

      setCurrentIndexSpy.mockRestore()
    })

    it('should create a new entry when there is no metadata on history.state', () => {
      /**
       * This could be encountered via non pushState navigations such as
       * - Normal multi-page app (MPA) instead of SPA navigations
       * - Special cases in a SPA:
       *   - Recovering from error / corrupted state
       *   - Crossing from next.js pages router to app router
       *
       * @todo make sure our behavior doesn't conflict with next.js
       */
      expect(nav.entries().length).toBe(3)

      nav.destroy()

      history.pushState(null, '', './page3')

      nav = new Navigation(history)

      expect(nav.entries().length).toBe(4)
      expect(nav.currentEntry.id).toBeTruthy()
      expect(nav.currentEntry.url).toBe('http://localhost:3000/page3')
      expect(nav.currentEntry.index).toBe(3)
    })

    it('should create new entry when history.state entryId does not match any rehydrated entries', () => {
      // Verify preconditions
      expect(nav.entries().length).toBe(3)

      // Destroy navigation but keep sessionStorage with entries
      nav.destroy()

      // Manually set history.state with an entryId that doesn't exist in sessionStorage
      // This simulates a case where the entry was truncated or the ID is corrupted
      const nonExistentEntryId = 'non-existent-id-12345'
      history.replaceState(
        {
          __NAVIGATION_PONYFILL: {
            entryId: nonExistentEntryId,
            entryKey: 'some-key',
          },
        },
        '',
      )

      // Create a new Navigation - should hit line 195's false branch (entry not found)
      nav = new Navigation(history)

      // A new entry should be created since the entryId wasn't found
      // The new entry should have a different ID than the non-existent one
      expect(nav.currentEntry.id).not.toBe(nonExistentEntryId)

      /**
       * @todo
       * If current history.state has an entryKey but is not matched to any entries
       * from sessionStorage, we may want to consider throwing them all out and
       * starting with an empty stack, because right now our entries may not match
       * the history stack.
       */
      expect(nav.entries().length).toBe(4)
      expect(nav.currentEntry.index).toBe(3)
    })
  })
})

/**
 * Helper to await backwards traversal
 */
async function back() {
  const popstate = waitForPopstate()
  history.back()
  await popstate
}

/**
 * Helper to wait for popstate, so we can await completion of history traversal
 */
function waitForPopstate() {
  return new Promise<void>((resolve) => {
    const handler = () => {
      window.removeEventListener('popstate', handler)
      resolve()
    }
    window.addEventListener('popstate', handler)
  })
}
