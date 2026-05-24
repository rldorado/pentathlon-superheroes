import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Card from './Card.vue'

/**
 * T-15 — Card primitive.
 *
 * AC (tasks.md): "Card = bg-canvas border border-hairline rounded-md".
 * Renders as <article> by default for semantic grouping (HeroCard, podium step).
 */
describe('Card', () => {
  it('renders slot content', () => {
    const w = mount(Card, { slots: { default: '<p>contenido</p>' } })
    expect(w.html()).toContain('contenido')
  })

  it('applies the canvas surface, hairline border, and rounded-md tokens', () => {
    const w = mount(Card)
    const cls = w.classes()
    expect(cls).toContain('bg-canvas')
    expect(cls).toContain('border')
    expect(cls).toContain('border-hairline')
    expect(cls).toContain('rounded-md')
  })

  it('uses <article> as the root element by default', () => {
    const w = mount(Card)
    expect(w.element.tagName).toBe('ARTICLE')
  })

  it('honors a custom `as` element when provided (e.g. <li>)', () => {
    const w = mount(Card, { props: { as: 'li' } })
    expect(w.element.tagName).toBe('LI')
  })
})
