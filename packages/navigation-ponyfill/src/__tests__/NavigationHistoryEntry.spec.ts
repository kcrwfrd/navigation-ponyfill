import { describe, it, expect } from 'vitest'
import { NavigationHistoryEntry } from '../NavigationHistoryEntry'

describe('NavigationHistoryEntry', () => {
  describe('constructor', () => {
    it('should accept string URL', () => {
      const entry = new NavigationHistoryEntry('/path/to/page')
      expect(entry.url).toBe('/path/to/page')
    })

    it('should accept null URL', () => {
      const entry = new NavigationHistoryEntry(null)
      expect(entry.url).toBe(null)
    })

    it('should accept full URL with query and hash', () => {
      const entry = new NavigationHistoryEntry('/page?foo=bar#section')
      expect(entry.url).toBe('/page?foo=bar#section')
    })

    it('should accept empty string URL', () => {
      const entry = new NavigationHistoryEntry('')
      expect(entry.url).toBe('')
    })
  })

  describe('url property', () => {
    it('should return the URL passed to constructor', () => {
      const url = '/test/path'
      const entry = new NavigationHistoryEntry(url)
      expect(entry.url).toBe(url)
    })

    it('should be readonly', () => {
      const entry = new NavigationHistoryEntry('/initial')

      expect(() => {
        // @ts-expect-error
        entry.url = '/modified'
      }).toThrow(TypeError)

      expect(entry.url).toBe('/initial')
    })
  })
})
