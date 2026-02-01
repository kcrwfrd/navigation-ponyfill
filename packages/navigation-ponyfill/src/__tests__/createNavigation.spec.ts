import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest'
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
      const nav = createNavigation({ force: true })

      expect(nav).toBeInstanceOf(Navigation)

      destroy(nav)
    })

    it('should use window.history when window is defined', () => {
      const nav = createNavigation({ force: true })

      // Verify history was patched by checking pushState was replaced
      const originalPushState = MockHistory.prototype.pushState
      expect(window.history.pushState).not.toBe(originalPushState)

      nav.destroy()
    })
  })

  describe('SSR environment', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {})

    beforeEach(() => {
      vi.stubGlobal('window', undefined)
      vi.stubGlobal('sessionStorage', undefined)
    })

    afterEach(() => {
      vi.unstubAllGlobals()
      consoleWarnSpy.mockClear()
    })

    afterAll(() => {
      consoleWarnSpy.mockRestore()
    })

    it('should not throw during SSR', () => {
      let nav: ReturnType<typeof createNavigation> | undefined

      expect(() => {
        nav = createNavigation()
      }).not.toThrow()

      if (nav) {
        destroy(nav)
      }
    })

    it('should handle destroy() gracefully in SSR', () => {
      const nav = createNavigation({ force: true })
      expect(() => nav.destroy()).not.toThrow()
    })

    it('should warn about skipping sessionStorage operations', () => {
      const nav = createNavigation({ force: true })

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'NavigationHistoryEntriesStack: sessionStorage is undefined, skipping load from sessionStorage',
      )
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'NavigationHistoryEntriesStack: sessionStorage is undefined, skipping save to sessionStorage',
      )

      nav.destroy()
    })
  })

  describe('custom history injection', () => {
    it('should accept custom History object', () => {
      const customHistory = new MockHistory()
      const nav = createNavigation({ force: true, history: customHistory })

      expect(nav).toBeInstanceOf(Navigation)

      // Verify the custom history was patched
      customHistory.pushState({ test: true }, '', '/new-path')
      expect(customHistory.state).toHaveProperty('__NAVIGATION_PONYFILL')

      nav.destroy()
    })

    it('should accept HistoryShim instance', () => {
      const shim = new HistoryShim()
      const nav = createNavigation({ force: true, history: shim })

      expect(nav).toBeInstanceOf(Navigation)

      nav.destroy()
    })

    it('should patch the provided history object', () => {
      const customHistory = new MockHistory()
      const originalPushState = customHistory.pushState

      const nav = createNavigation({ force: true, history: customHistory })

      // After Navigation is created, pushState should be patched
      expect(customHistory.pushState).not.toBe(originalPushState)

      nav.destroy()

      // After destroy, pushState should be restored
      expect(customHistory.pushState).toBe(originalPushState)
    })
  })

  describe('force option', () => {
    describe('when native Navigation is available', () => {
      const mockNativeNavigation = { currentEntry: null }

      beforeEach(() => {
        vi.stubGlobal('history', new MockHistory())
        vi.stubGlobal('navigation', mockNativeNavigation)
      })

      afterEach(() => {
        vi.unstubAllGlobals()
      })

      it('should return native Navigation by default', () => {
        const nav = createNavigation()
        expect(nav).toBe(window.navigation)
      })

      it('should return polyfill when force: true', () => {
        const nav = createNavigation({ force: true })
        expect(nav).toBeInstanceOf(Navigation)
        expect(nav).not.toBe(window.navigation)
        nav.destroy()
      })
    })

    describe('when native Navigation is not available', () => {
      beforeEach(() => {
        vi.stubGlobal('history', new MockHistory())
        vi.stubGlobal('navigation', undefined)
      })

      afterEach(() => {
        vi.unstubAllGlobals()
      })

      it('should return polyfill regardless of force option', () => {
        const nav = createNavigation()
        expect(nav).toBeInstanceOf(Navigation)

        destroy(nav)
      })
    })
  })
})

function destroy(nav: ReturnType<typeof createNavigation>) {
  if ('destroy' in nav) {
    nav.destroy()
  }
}
