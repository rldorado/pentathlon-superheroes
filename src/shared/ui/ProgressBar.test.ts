import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ProgressBar from './ProgressBar.vue'

/**
 * T-15 — ProgressBar primitive (attribute bar).
 *
 * AC (tasks.md): "ProgressBar = 0..10 → 0..100% width, accent fill on hairline track."
 * Accessibility: a11y baseline (constitution §5.2). We expose:
 *   - role="progressbar"
 *   - aria-valuemin=0, aria-valuemax=10 (matches the attribute scale)
 *   - aria-valuenow=value (clamped to [0,10])
 *   - aria-label accepts a Spanish label so screen readers announce "Fuerza: 8/10".
 */
describe('ProgressBar', () => {
  it('renders as role="progressbar" with valuemin/max/now wired to the 0..10 scale', () => {
    const w = mount(ProgressBar, { props: { value: 7 } })
    const el = w.element as HTMLElement
    expect(el.getAttribute('role')).toBe('progressbar')
    expect(el.getAttribute('aria-valuemin')).toBe('0')
    expect(el.getAttribute('aria-valuemax')).toBe('10')
    expect(el.getAttribute('aria-valuenow')).toBe('7')
  })

  it('maps the value 0..10 to a 0..100% inline width on the fill element', () => {
    const w = mount(ProgressBar, { props: { value: 4 } })
    const fill = w.find('[data-fill]').element as HTMLElement
    expect(fill.style.width).toBe('40%')
  })

  it('clamps values above 10 to 100% (defensive — store enforces 0..10)', () => {
    const w = mount(ProgressBar, { props: { value: 99 } })
    const fill = w.find('[data-fill]').element as HTMLElement
    expect(fill.style.width).toBe('100%')
    expect(w.attributes('aria-valuenow')).toBe('10')
  })

  it('clamps negative values to 0%', () => {
    const w = mount(ProgressBar, { props: { value: -3 } })
    const fill = w.find('[data-fill]').element as HTMLElement
    expect(fill.style.width).toBe('0%')
    expect(w.attributes('aria-valuenow')).toBe('0')
  })

  it('uses the accent fill on a hairline track per design-reference', () => {
    const w = mount(ProgressBar, { props: { value: 5 } })
    const track = w.classes().join(' ')
    expect(track).toMatch(/bg-canvas-2|bg-hairline/)
    const fill = w.find('[data-fill]').classes()
    expect(fill).toContain('bg-accent')
  })

  it('honors a custom Spanish aria-label', () => {
    const w = mount(ProgressBar, { props: { value: 8, label: 'Fuerza' } })
    expect(w.attributes('aria-label')).toBe('Fuerza: 8 sobre 10')
  })
})
