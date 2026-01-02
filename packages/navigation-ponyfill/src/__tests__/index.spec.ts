import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('index exports', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  describe('navigation singleton', () => {
    it('should export pre-initialized navigation instance', async () => {
      const { navigation } = await import('../index')

      expect(navigation).toBeDefined()
      expect(typeof navigation.addEventListener).toBe('function')
      expect(typeof navigation.canGoBack).toBe('boolean')
    })

    it('should auto-patch history on import', async () => {
      const originalPushState = window.history.pushState

      await import('../index')

      // After import, window.history.pushState should be patched
      expect(window.history.pushState).not.toBe(originalPushState)
    })

    it('should be same instance across multiple imports', async () => {
      const mod1 = await import('../index')
      const mod2 = await import('../index')

      expect(mod1.navigation).toBe(mod2.navigation)
    })
  })
})
