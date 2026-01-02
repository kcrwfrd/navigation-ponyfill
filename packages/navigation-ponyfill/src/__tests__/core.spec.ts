import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('core exports', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('should export createNavigation function', async () => {
    const core = await import('../core')

    expect(typeof core.createNavigation).toBe('function')
  })

  it('should export Navigation class', async () => {
    const core = await import('../core')

    expect(typeof core.Navigation).toBe('function')
    expect(core.Navigation.name).toBe('Navigation')
  })

  it('should export NavigationCurrentEntryChangeEvent class', async () => {
    const core = await import('../core')

    expect(typeof core.NavigationCurrentEntryChangeEvent).toBe('function')
    expect(core.NavigationCurrentEntryChangeEvent.name).toBe(
      'NavigationCurrentEntryChangeEvent',
    )
  })

  it('should export NavigationHistoryEntry class', async () => {
    const core = await import('../core')

    expect(typeof core.NavigationHistoryEntry).toBe('function')
    expect(core.NavigationHistoryEntry.name).toBe('NavigationHistoryEntry')
  })

  it('should NOT auto-create navigation singleton', async () => {
    const core = await import('../core')

    // core.ts only exports classes and factories, not instances
    expect((core as any).navigation).toBeUndefined()
  })

  it('should NOT monkey-patch history methods', async () => {
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    await import('../core')

    expect(history.pushState).toBe(originalPushState)
    expect(history.replaceState).toBe(originalReplaceState)
  })
})
