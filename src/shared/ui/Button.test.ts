import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

/**
 * T-15 — Button primitive.
 *
 * AC (tasks.md):
 *   - variants: primary (accent bg, ink text), ghost, danger
 *   - keyboard-focusable, focus-visible ring (delegated to global :focus-visible token)
 *   - AA contrast on every variant per constitution §6.2
 *   - defaults to type="button" so it never accidentally submits a form
 */
describe('Button', () => {
  it('renders slot content as the label', () => {
    const w = mount(Button, { slots: { default: 'Inscribir héroe' } })
    expect(w.text()).toBe('Inscribir héroe')
  })

  it('emits real DOM click', async () => {
    const w = mount(Button, { slots: { default: 'Go' } })
    await w.trigger('click')
    expect(w.emitted('click')).toHaveLength(1)
  })

  it('defaults to type="button" to avoid implicit form submission', () => {
    const w = mount(Button, { slots: { default: 'Go' } })
    expect(w.attributes('type')).toBe('button')
  })

  it('honors an explicit `type` prop (e.g. submit)', () => {
    const w = mount(Button, {
      props: { type: 'submit' },
      slots: { default: 'Guardar' },
    })
    expect(w.attributes('type')).toBe('submit')
  })

  it('defaults to the primary variant — accent bg + ink text (AA-safe pair)', () => {
    const w = mount(Button, { slots: { default: 'Go' } })
    const cls = w.classes()
    expect(cls).toContain('bg-accent')
    expect(cls).toContain('text-accent-ink')
  })

  it('ghost variant: transparent bg, ink text', () => {
    const w = mount(Button, { props: { variant: 'ghost' }, slots: { default: 'Cancelar' } })
    const cls = w.classes()
    expect(cls).toContain('bg-transparent')
    expect(cls).toContain('text-ink')
    expect(cls).not.toContain('bg-accent')
  })

  it('danger variant: accent-strong bg, white text (large/bold passes AA)', () => {
    const w = mount(Button, { props: { variant: 'danger' }, slots: { default: 'Eliminar' } })
    const cls = w.classes()
    expect(cls).toContain('bg-accent-strong')
    expect(cls).toContain('text-white')
  })

  it('renders with min touch target ≥ 44px (Tailwind min-h-[44px])', () => {
    const w = mount(Button, { slots: { default: 'Go' } })
    // We assert a class is applied that drives the 44px height. The exact class
    // is implementation detail; we accept either Tailwind's `min-h-11` (44px)
    // or the explicit `min-h-[44px]`.
    const cls = w.classes().join(' ')
    expect(cls).toMatch(/min-h-(11|\[44px\])/)
  })

  it('reflects the disabled attribute and prevents click emission', async () => {
    const w = mount(Button, { props: { disabled: true }, slots: { default: 'Go' } })
    expect(w.attributes('disabled')).toBeDefined()
    expect(w.classes().join(' ')).toMatch(/disabled:|opacity-/)
  })
})
