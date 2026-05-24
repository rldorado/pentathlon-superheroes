/**
 * Pure validators for the hero form. Each returns `null` on success or a
 * Spanish-language error string on failure. Co-located here (rather than
 * inside `useHeroForm.ts`) so tests can call them as plain functions per
 * docs/constitution.md §4.1.
 *
 * Rules per docs/clarification.md §D-1..D-3 and docs/plan.md §8:
 *   - Name: 2..40 chars after trim; allowed = Unicode letters + digits +
 *     space + `.'-`; no emojis; no control chars.
 *   - Picture: required at create, optional at edit (keep existing); pure
 *     base64 string; the file-level checks (MIME, dims, 200KB) live in
 *     `HeroImageInput.vue` and never reach this layer.
 *   - Attributes: integer in [0, 10] each.
 */

import { messages } from '@/shared/i18n/messages'
import type { HeroAttributes } from '../types'

const NAME_MIN = 2
const NAME_MAX = 40
/**
 * Letters (any Unicode script), digits, space, dot, apostrophe, hyphen.
 * Anchored to the whole string; uses the `u` flag so `\p{...}` works.
 */
const NAME_PATTERN = /^[\p{L}\p{N} .'-]+$/u

export function validateName(
  rawName: string,
  options: { isTaken: (trimmed: string) => boolean } = { isTaken: () => false },
): string | null {
  const trimmed = rawName.trim()
  if (!trimmed) return messages.heroes.validation.nameRequired
  if (trimmed.length < NAME_MIN) return messages.heroes.validation.nameTooShort
  if (trimmed.length > NAME_MAX) return messages.heroes.validation.nameTooLong
  if (!NAME_PATTERN.test(trimmed)) return messages.heroes.validation.nameInvalidChars
  if (options.isTaken(trimmed)) return messages.heroes.validation.nameTaken
  return null
}

export function validateAttribute(value: unknown): string | null {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > 10) {
    return messages.heroes.validation.attributeOutOfRange
  }
  return null
}

export function validateAttributes(
  attrs: HeroAttributes,
): Partial<Record<keyof HeroAttributes, string>> {
  const out: Partial<Record<keyof HeroAttributes, string>> = {}
  for (const key of Object.keys(attrs) as Array<keyof HeroAttributes>) {
    const err = validateAttribute(attrs[key])
    if (err) out[key] = err
  }
  return out
}

export function validatePicture(
  picture: string | undefined,
  mode: 'create' | 'edit',
): string | null {
  if (mode === 'create' && !picture) return messages.heroes.validation.pictureRequired
  return null
}
