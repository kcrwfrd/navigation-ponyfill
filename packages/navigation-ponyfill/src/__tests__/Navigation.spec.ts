import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Navigation } from '../Navigation'
import { NavigationCurrentEntryChangeEvent } from '../NavigationCurrentEntryChangeEvent'
import { MockHistory } from '../__mocks__/historyMock'

describe('Navigation', () => {
  let mockHistory: MockHistory
  let nav: Navigation

  beforeEach(() => {
    mockHistory = new MockHistory()
    vi.stubGlobal('history', mockHistory)
    vi.stubGlobal('location', {
      pathname: '/initial',
      search: '',
      hash: '',
      href: 'http://localhost/initial',
    })
    vi.spyOn(window, 'addEventListener')
    vi.spyOn(window, 'removeEventListener')
  })

  afterEach(() => {
    nav?.destroy()
    vi.unstubAllGlobals()
  })

  describe('constructor', () => {
    it('should extend EventTarget', () => {
      nav = new Navigation(mockHistory)

      expect(nav).toBeInstanceOf(EventTarget)
    })

    it('should monkey-patch history.pushState', () => {
      const originalPushState = mockHistory.pushState

      nav = new Navigation(mockHistory)

      expect(mockHistory.pushState).not.toBe(originalPushState)
    })

    it('should monkey-patch history.replaceState', () => {
      const originalReplaceState = mockHistory.replaceState

      nav = new Navigation(mockHistory)

      expect(mockHistory.replaceState).not.toBe(originalReplaceState)
    })

    it('should register popstate event listener in browser environment', () => {
      nav = new Navigation(mockHistory)

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
      nav = new Navigation(mockHistory)
    })

    it('should inject __NAVIGATION_PONYFILL metadata into state', () => {
      mockHistory.pushState({ foo: 'bar' }, '', '/new-path')

      expect(mockHistory.state).toHaveProperty('__NAVIGATION_PONYFILL')
      expect(mockHistory.state.foo).toBe('bar')
    })

    it('should set canGoBack to true in metadata', () => {
      mockHistory.pushState({}, '', '/new-path')

      expect(mockHistory.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)
    })

    it('should capture previousPath from current location', () => {
      mockHistory.pushState({}, '', '/new-path')

      expect(mockHistory.state.__NAVIGATION_PONYFILL.previousPath).toBe(
        '/initial',
      )
    })

    it('should preserve original state properties', () => {
      mockHistory.pushState({ custom: 'data', nested: { a: 1 } }, '', '/path')

      expect(mockHistory.state.custom).toBe('data')
      expect(mockHistory.state.nested).toEqual({ a: 1 })
    })

    it('should dispatch currententrychange event with type "push"', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.pushState({}, '', '/new-path')

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('push')
    })

    it('should include NavigationHistoryEntry with previous URL in event.from', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.pushState({}, '', '/new-path')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from.url).toBe('/initial')
    })

    it('should throw TypeError when state is a primitive string', () => {
      expect(() => {
        mockHistory.pushState('invalid', '', '/path')
      }).toThrow(TypeError)
    })

    it('should throw TypeError when state is a number', () => {
      expect(() => {
        mockHistory.pushState(42, '', '/path')
      }).toThrow(TypeError)
    })

    it('should throw TypeError with descriptive message for array state', () => {
      expect(() => {
        mockHistory.pushState(['array'], '', '/path')
      }).toThrow(
        'history state must be a non-array object or nullish, received array',
      )
    })

    it('should throw TypeError when state is a boolean', () => {
      expect(() => {
        mockHistory.pushState(true, '', '/path')
      }).toThrow(TypeError)
    })

    it('should accept null state', () => {
      expect(() => {
        mockHistory.pushState(null, '', '/path')
      }).not.toThrow()

      expect(mockHistory.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should accept undefined state', () => {
      expect(() => {
        mockHistory.pushState(undefined, '', '/path')
      }).not.toThrow()

      expect(mockHistory.state.__NAVIGATION_PONYFILL).toBeDefined()
    })

    it('should accept object state', () => {
      expect(() => {
        mockHistory.pushState({ valid: 'object' }, '', '/path')
      }).not.toThrow()
    })
  })

  describe('monkey-patched replaceState', () => {
    beforeEach(() => {
      nav = new Navigation(mockHistory)
    })

    it('should inject __NAVIGATION_PONYFILL metadata into state', () => {
      mockHistory.replaceState({ foo: 'bar' }, '', '/replaced')

      expect(mockHistory.state).toHaveProperty('__NAVIGATION_PONYFILL')
      expect(mockHistory.state.foo).toBe('bar')
    })

    it('should preserve existing canGoBack value from previous state', () => {
      // First push to set canGoBack to true
      mockHistory.pushState({}, '', '/first')
      expect(mockHistory.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)

      // Replace should preserve canGoBack
      mockHistory.replaceState({}, '', '/replaced')
      expect(mockHistory.state.__NAVIGATION_PONYFILL.canGoBack).toBe(true)
    })

    it('should default canGoBack to false when no previous state', () => {
      mockHistory.replaceState({}, '', '/replaced')

      expect(mockHistory.state.__NAVIGATION_PONYFILL.canGoBack).toBe(false)
    })

    it('should preserve existing previousPath from previous state', () => {
      // Push sets previousPath
      mockHistory.pushState({}, '', '/second')
      const previousPath = mockHistory.state.__NAVIGATION_PONYFILL.previousPath

      // Replace should preserve previousPath
      mockHistory.replaceState({}, '', '/replaced')
      expect(mockHistory.state.__NAVIGATION_PONYFILL.previousPath).toBe(
        previousPath,
      )
    })

    it('should default previousPath to null when no previous state', () => {
      mockHistory.replaceState({}, '', '/replaced')

      expect(mockHistory.state.__NAVIGATION_PONYFILL.previousPath).toBe(null)
    })

    it('should dispatch currententrychange event with type "replace"', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.replaceState({}, '', '/replaced')

      expect(handler).toHaveBeenCalledTimes(1)
      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.navigationType).toBe('replace')
    })

    it('should include NavigationHistoryEntry with current URL in event.from', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.replaceState({}, '', '/replaced')

      const event = handler.mock
        .calls[0][0] as NavigationCurrentEntryChangeEvent
      expect(event.from.url).toBe('/initial')
    })

    it('should throw TypeError for primitive state values', () => {
      expect(() => {
        mockHistory.replaceState('string', '', '/path')
      }).toThrow(TypeError)

      expect(() => {
        mockHistory.replaceState(123, '', '/path')
      }).toThrow(TypeError)

      expect(() => {
        mockHistory.replaceState(true, '', '/path')
      }).toThrow(TypeError)
    })
  })

  describe('popstate handling', () => {
    beforeEach(() => {
      nav = new Navigation(mockHistory)
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
      nav = new Navigation(mockHistory)
    })

    it('should return false when history.state is null', () => {
      expect(nav.canGoBack).toBe(false)
    })

    it('should return false when __NAVIGATION_PONYFILL is missing', () => {
      // Use unpatched replaceState to set state without metadata
      nav.destroy()
      mockHistory.replaceState({ noMetadata: true }, '', '/path')
      nav = new Navigation(mockHistory)

      expect(nav.canGoBack).toBe(false)
    })

    it('should return true when canGoBack in metadata is true', () => {
      mockHistory.pushState({}, '', '/new-path')

      expect(nav.canGoBack).toBe(true)
    })

    it('should return false after replaceState on initial page', () => {
      mockHistory.replaceState({}, '', '/replaced')

      expect(nav.canGoBack).toBe(false)
    })
  })

  describe('destroy()', () => {
    it('should restore original pushState method', () => {
      const originalPushState = mockHistory.pushState

      nav = new Navigation(mockHistory)
      expect(mockHistory.pushState).not.toBe(originalPushState)

      nav.destroy()
      expect(mockHistory.pushState).toBe(originalPushState)
    })

    it('should restore original replaceState method', () => {
      const originalReplaceState = mockHistory.replaceState

      nav = new Navigation(mockHistory)
      expect(mockHistory.replaceState).not.toBe(originalReplaceState)

      nav.destroy()
      expect(mockHistory.replaceState).toBe(originalReplaceState)
    })

    it('should remove popstate event listener', () => {
      nav = new Navigation(mockHistory)

      nav.destroy()

      expect(window.removeEventListener).toHaveBeenCalledWith(
        'popstate',
        expect.any(Function),
      )
    })

    it('should allow multiple destroy calls without error', () => {
      nav = new Navigation(mockHistory)

      expect(() => {
        nav.destroy()
        nav.destroy()
        nav.destroy()
      }).not.toThrow()
    })
  })

  describe('event listener management', () => {
    beforeEach(() => {
      nav = new Navigation(mockHistory)
    })

    it('should support multiple event listeners', () => {
      const handler1 = vi.fn()
      const handler2 = vi.fn()

      nav.addEventListener('currententrychange', handler1)
      nav.addEventListener('currententrychange', handler2)

      mockHistory.pushState({}, '', '/path')

      expect(handler1).toHaveBeenCalledTimes(1)
      expect(handler2).toHaveBeenCalledTimes(1)
    })

    it('should allow removeEventListener', () => {
      const handler = vi.fn()

      nav.addEventListener('currententrychange', handler)
      nav.removeEventListener('currententrychange', handler)

      mockHistory.pushState({}, '', '/path')

      expect(handler).not.toHaveBeenCalled()
    })
  })

  describe('navigation chain', () => {
    beforeEach(() => {
      nav = new Navigation(mockHistory)
    })

    it('should track navigation chain with canGoBack', () => {
      // Initial state - no history
      expect(nav.canGoBack).toBe(false)

      // First navigation
      mockHistory.pushState({}, '', '/page1')
      expect(nav.canGoBack).toBe(true)

      // Second navigation
      mockHistory.pushState({}, '', '/page2')
      expect(nav.canGoBack).toBe(true)
    })

    it('should handle URL with query parameters', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.pushState({}, '', '/search?q=test&page=1')

      expect(handler).toHaveBeenCalledTimes(1)
    })

    it('should handle URL with hash', () => {
      const handler = vi.fn()
      nav.addEventListener('currententrychange', handler)

      mockHistory.pushState({}, '', '/page#section')

      expect(handler).toHaveBeenCalledTimes(1)
    })
  })
})
