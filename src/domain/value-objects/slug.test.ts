import { describe, it, expect } from 'vitest'
import { Slug } from './slug'
import { InvalidSlugError } from '../errors/domain-errors'

describe('Slug', () => {
  it('creates a valid slug', () => {
    expect(new Slug('peluqueria-juan').value).toBe('peluqueria-juan')
  })

  it('throws for slug shorter than 3 chars', () => {
    expect(() => new Slug('ab')).toThrow(InvalidSlugError)
  })

  it('throws for slug longer than 60 chars', () => {
    expect(() => new Slug('a'.repeat(61))).toThrow(InvalidSlugError)
  })

  it('throws for uppercase characters', () => {
    expect(() => new Slug('Peluqueria')).toThrow(InvalidSlugError)
  })

  it('throws for spaces', () => {
    expect(() => new Slug('my shop')).toThrow(InvalidSlugError)
  })

  it('throws for special characters', () => {
    expect(() => new Slug('my_shop!')).toThrow(InvalidSlugError)
  })

  it('allows hyphens and numbers', () => {
    expect(new Slug('salon-123').value).toBe('salon-123')
  })

  describe('fromName', () => {
    it('generates slug from business name', () => {
      expect(Slug.fromName('Peluquería Juan').value).toBe('peluqueria-juan')
    })

    it('handles multiple spaces', () => {
      expect(Slug.fromName('Mi   Negocio   Bonito').value).toBe(
        'mi-negocio-bonito'
      )
    })

    it('removes accents', () => {
      expect(Slug.fromName('Café María').value).toBe('cafe-maria')
    })
  })

  describe('equals', () => {
    it('returns true for same value', () => {
      expect(new Slug('abc').equals(new Slug('abc'))).toBe(true)
    })

    it('returns false for different value', () => {
      expect(new Slug('abc').equals(new Slug('def'))).toBe(false)
    })
  })
})
