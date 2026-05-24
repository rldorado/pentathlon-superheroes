import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Chip from './Chip.vue'

/**
 * T-15 — Chip primitive (pill).
 *
 * AC (tasks.md): "Chip = pill with attribute color".
 * Used in the podium for medal pills ("Oro · 5 pts") and reasons strings on
 * the event step. Pill border-radius (`rounded-pill`) per constitution §6.4.
 */
describe('Chip', () => {
  it('renders slot content', () => {
    const w = mount(Chip, { slots: { default: 'Oro · 5 pts' } })
    expect(w.text()).toBe('Oro · 5 pts')
  })

  it('uses pill radius and inline-flex layout', () => {
    const w = mount(Chip)
    const cls = w.classes()
    expect(cls).toContain('rounded-pill')
    expect(cls).toContain('inline-flex')
  })

  it('defaults to a neutral ink-on-canvas tone', () => {
    const w = mount(Chip)
    const cls = w.classes().join(' ')
    expect(cls).toMatch(/bg-canvas-2|bg-canvas/)
    expect(cls).toContain('text-ink')
  })

  it('gold variant uses the gold data token + ink text (AA on yellow)', () => {
    const w = mount(Chip, { props: { variant: 'gold' } })
    const cls = w.classes()
    expect(cls).toContain('bg-gold')
    expect(cls).toContain('text-gold-ink')
  })

  it('silver variant uses silver token + ink text', () => {
    const w = mount(Chip, { props: { variant: 'silver' } })
    expect(w.classes()).toContain('bg-silver')
    expect(w.classes()).toContain('text-silver-ink')
  })

  it('bronze variant uses bronze token + white ink (AA on darker bronze)', () => {
    const w = mount(Chip, { props: { variant: 'bronze' } })
    expect(w.classes()).toContain('bg-bronze')
    expect(w.classes()).toContain('text-bronze-ink')
  })
})
