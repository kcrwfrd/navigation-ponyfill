import { describe, it, expect } from 'vitest'
import { NAVIGATION_TYPE } from '../NavigationType'

describe('NavigationType', () => {
  describe('NAVIGATION_TYPE constant', () => {
    it('should have PUSH as "push"', () => {
      expect(NAVIGATION_TYPE.PUSH).toBe('push')
    })

    it('should have RELOAD as "reload"', () => {
      expect(NAVIGATION_TYPE.RELOAD).toBe('reload')
    })

    it('should have REPLACE as "replace"', () => {
      expect(NAVIGATION_TYPE.REPLACE).toBe('replace')
    })

    it('should have TRAVERSE as "traverse"', () => {
      expect(NAVIGATION_TYPE.TRAVERSE).toBe('traverse')
    })

    it('should have exactly 4 navigation types', () => {
      const keys = Object.keys(NAVIGATION_TYPE)
      expect(keys).toHaveLength(4)
      expect(keys).toContain('PUSH')
      expect(keys).toContain('RELOAD')
      expect(keys).toContain('REPLACE')
      expect(keys).toContain('TRAVERSE')
    })
  })
})
