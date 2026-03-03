import { InvalidSlugError, ReservedSlugError } from '../errors/domain-errors'

const SLUG_REGEX = /^[a-z0-9]+(-[a-z0-9]+)*$/
const RESERVED_SLUGS = ['my', 'admin', 'api']

export class Slug {
  readonly value: string

  constructor(value: string) {
    if (RESERVED_SLUGS.includes(value)) {
      throw new ReservedSlugError(value)
    }
    if (value.length < 3 || value.length > 60 || !SLUG_REGEX.test(value)) {
      throw new InvalidSlugError(value)
    }
    this.value = value
  }

  static fromName(name: string): Slug {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
    return new Slug(slug)
  }

  equals(other: Slug): boolean {
    return this.value === other.value
  }

  toString(): string {
    return this.value
  }
}
