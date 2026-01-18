import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createNavigation } from '../createNavigation'
import { NavigationHistoryEntriesStack } from '../NavigationHistoryEntriesStack'
import { Navigation } from '../Navigation'
import { HistoryShim } from '../HistoryShim'
import { MockHistory } from '../__mocks__/historyMock'

describe('createNavigation', () => {
  beforeEach(() => {
    NavigationHistoryEntriesStack.clearStorage()
  })

  describe('browser environment', () => {
    beforeEach(() => {
      vi.stubGlobal('history', new MockHistory())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should return Navigation instance', () => {
      const nav = createNavigation()

      expect(nav).toBeInstanceOf(Navigation)

      nav.destroy()
    })

    it('should use window.history when window is defined', () => {
      const nav = createNavigation()

      // Verify history was patched by checking pushState was replaced
      const originalPushState = MockHistory.prototype.pushState
      expect(window.history.pushState).not.toBe(originalPushState)

      nav.destroy()
    })
  })

  describe('SSR environment', () => {
    beforeEach(() => {
      vi.stubGlobal('window', undefined)
      vi.stubGlobal('sessionStorage', undefined)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('should use HistoryShim when window is undefined', () => {
      const nav = createNavigation()

      expect(nav).toBeInstanceOf(Navigation)
    })

    it('should not throw during SSR', () => {
      expect(() => createNavigation()).not.toThrow()
    })

    it('should handle destroy() gracefully in SSR', () => {
      const nav = createNavigation()
      expect(() => nav.destroy()).not.toThrow()
    })
  })

  describe('custom history injection', () => {
    it('should accept custom History object', () => {
      const customHistory = new MockHistory()
      const nav = createNavigation(customHistory)

      expect(nav).toBeInstanceOf(Navigation)

      // Verify the custom history was patched
      customHistory.pushState({ test: true }, '', '/new-path')
      expect(customHistory.state).toHaveProperty('__NAVIGATION_PONYFILL')

      nav.destroy()
    })

    it('should accept HistoryShim instance', () => {
      const shim = new HistoryShim()
      const nav = createNavigation(shim)

      expect(nav).toBeInstanceOf(Navigation)
    })

    it('should patch the provided history object', () => {
      const customHistory = new MockHistory()
      const originalPushState = customHistory.pushState

      const nav = createNavigation(customHistory)

      // After Navigation is created, pushState should be patched
      expect(customHistory.pushState).not.toBe(originalPushState)

      nav.destroy()

      // After destroy, pushState should be restored
      expect(customHistory.pushState).toBe(originalPushState)
    })
  })
})
