import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Navigation } from '../Navigation'
import { NavigationCurrentEntryChangeEvent } from '../NavigationCurrentEntryChangeEvent'

describe('Navigation', () => {
  let nav: Navigation
  const history = window.history

  beforeEach(() => {
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

    it('should set canGoBack to true in metadata', () => {
      history.pushState({}, '', '/new-path')

      expect(history.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)
    })

    it('should capture previousPath from current location', () => {
      history.pushState({}, '', '/new-path')

      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe('/initial')
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
      expect(event.from.url).toBe('/initial')
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

    it('should preserve existing canGoBack value from previous state', () => {
      // First push to set canGoBack to true
      history.pushState({}, '', '/first')
      expect(history.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)

      // Replace should preserve canGoBack
      history.replaceState({}, '', '/replaced')
      expect(history.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)
    })

    it('should default canGoBack to false when no previous state', () => {
      history.replaceState({}, '', '/replaced')

      expect(history.state.__NAVIGATION_PONYFILL.canGoBack).toBe(false)
    })

    it('should preserve existing previousPath from previous state', () => {
      // Push sets previousPath
      history.pushState({}, '', '/second')
      const previousPath = history.state.__NAVIGATION_PONYFILL.previousPath

      // Replace should preserve previousPath
      history.replaceState({}, '', '/replaced')
      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe(
        previousPath,
      )
    })

    it('should default previousPath to null when no previous state', () => {
      history.replaceState({}, '', '/replaced')

      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe(null)
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
      expect(event.from.url).toBe('/initial')
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
      history.replaceState({ noMetadata: true }, '', '/path')
      nav = new Navigation(history)

      expect(nav.canGoBack).toBe(false)
    })

    it('should return true when canGoBack in metadata is true', () => {
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

    it('should track previousPath through multiple navigations', () => {
      history.pushState({}, '', '/page1')
      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe('/initial')

      history.pushState({}, '', '/page2')
      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe('/page1')

      history.pushState({}, '', '/page3')
      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe('/page2')
    })

    it('should preserve canGoBack and previousPath when replaceState is used mid-chain', () => {
      history.pushState({}, '', '/page1')
      history.pushState({}, '', '/page2')

      // Replace current entry - should preserve navigation metadata
      history.replaceState({ replaced: true }, '', '/page2-replaced')

      expect(nav.canGoBack).toBe(true)
      expect(history.state.__NAVIGATION_PONYFILL.previousPath).toBe('/page1')
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
      expect(events[0].from.url).toBe('/initial')
      expect(events[1].from.url).toBe('/page1')
      expect(events[2].from.url).toBe('/page2')
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
      expect(event.from.url).toBe('/initial')
    })
  })
})
