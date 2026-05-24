import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SkeletonCard from './SkeletonCard.vue'

/**
 * T-15 — SkeletonCard primitive.
 *
 * AC (tasks.md): "Reserves card-sized space, animated shimmer respects
 * prefers-reduced-motion." Used while the heroes API is loading. The
 * `prefers-reduced-motion: reduce` rule in styles.css already collapses the
 * shimmer duration to ~0; this component only needs to apply the animate-pulse
 * utility (or our shimmer class) and reserve approximate card dimensions.
 */
describe('SkeletonCard', () => {
  it('renders an aria-hidden placeholder so it is not announced', () => {
    const w = mount(SkeletonCard)
    expect(w.attributes('aria-hidden')).toBe('true')
  })

  it('reserves card-sized space (matches Card surface tokens)', () => {
    const w = mount(SkeletonCard)
    const cls = w.classes()
    expect(cls).toContain('border')
    expect(cls).toContain('border-hairline')
    expect(cls).toContain('rounded-md')
  })

  it('applies the shimmer pulse utility (collapsed by prefers-reduced-motion globally)', () => {
    const w = mount(SkeletonCard)
    // motion-safe scopes the pulse so reduced-motion users get a static block.
    const cls = w.classes().join(' ')
    expect(cls).toMatch(/motion-safe:animate-pulse|animate-pulse/)
  })
})
