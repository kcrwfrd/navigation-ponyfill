import { describe, it, expect } from 'vitest'
import { HistoryShim } from '../HistoryShim'

describe('HistoryShim', () => {
  describe('state property', () => {
    it('should always return null', () => {
      const shim = new HistoryShim()
      expect(shim.state).toBe(null)
    })

    it('should remain null after pushState', () => {
      const shim = new HistoryShim()
      shim.pushState({ foo: 'bar' }, '', '/new-path')
      expect(shim.state).toBe(null)
    })

    it('should remain null after replaceState', () => {
      const shim = new HistoryShim()
      shim.replaceState({ foo: 'bar' }, '', '/new-path')
      expect(shim.state).toBe(null)
    })
  })

  describe('pushState', () => {
    it('should be a no-op function', () => {
      const shim = new HistoryShim()
      expect(() => shim.pushState({ foo: 'bar' }, '', '/path')).not.toThrow()
    })

    it('should accept state, title, and url parameters', () => {
      const shim = new HistoryShim()
      expect(() =>
        shim.pushState({ data: 'test' }, 'unused', '/path'),
      ).not.toThrow()
    })

    it('should accept URL object', () => {
      const shim = new HistoryShim()
      expect(() =>
        shim.pushState(null, '', new URL('http://example.com/path')),
      ).not.toThrow()
    })

    it('should accept null url', () => {
      const shim = new HistoryShim()
      expect(() => shim.pushState({}, '', null)).not.toThrow()
    })
  })

  describe('replaceState', () => {
    it('should be a no-op function', () => {
      const shim = new HistoryShim()
      expect(() => shim.replaceState({ foo: 'bar' }, '', '/path')).not.toThrow()
    })

    it('should accept state, title, and url parameters', () => {
      const shim = new HistoryShim()
      expect(() =>
        shim.replaceState({ data: 'test' }, 'unused', '/path'),
      ).not.toThrow()
    })

    it('should accept URL object', () => {
      const shim = new HistoryShim()
      expect(() =>
        shim.replaceState(null, '', new URL('http://example.com/path')),
      ).not.toThrow()
    })
  })
})
