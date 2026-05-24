import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import PageHeader from './PageHeader.vue'

/**
 * T-14 — PageHeader.
 *
 * AC (tasks.md): Props `eyebrow`, `title`, `subtitle?`, `actionSlot`. Renders
 * the eyebrow + Clash Display title + Geist subtitle exactly like
 * `design-reference/Heroes Inscritos.html` and `Clasificacion Final.html`.
 *
 * Visual fidelity is a manual smoke check; here we lock the contract.
 */
describe('PageHeader', () => {
  it('renders the eyebrow uppercase with the accent leading bar', () => {
    const w = mount(PageHeader, { props: { eyebrow: 'Plantilla', title: 'Héroes inscritos' } })

    const eyebrow = w.find('[data-eyebrow]')
    expect(eyebrow.exists()).toBe(true)
    expect(eyebrow.text()).toBe('Plantilla')
    // Eyebrow gets a leading 2px accent rule via ::before — we assert the
    // class hook so styling remains test-pinned.
    expect(eyebrow.classes().join(' ')).toMatch(/before:bg-accent/)
  })

  it('renders the title in Clash Display via font-display token', () => {
    const w = mount(PageHeader, { props: { eyebrow: 'Plantilla', title: 'Héroes inscritos' } })
    const h1 = w.find('h1')
    expect(h1.exists()).toBe(true)
    expect(h1.text()).toBe('Héroes inscritos')
    expect(h1.classes()).toContain('font-display')
  })

  it('renders the subtitle in Geist body type when provided', () => {
    const w = mount(PageHeader, {
      props: {
        eyebrow: 'Pentatlón cerrado',
        title: 'Clasificación final',
        subtitle: '5 pruebas disputadas',
      },
    })
    const sub = w.find('[data-subtitle]')
    expect(sub.exists()).toBe(true)
    expect(sub.text()).toBe('5 pruebas disputadas')
    expect(sub.classes()).toContain('font-body')
  })

  it('omits the subtitle node when none is passed', () => {
    const w = mount(PageHeader, { props: { eyebrow: 'A', title: 'B' } })
    expect(w.find('[data-subtitle]').exists()).toBe(false)
  })

  it('renders the `actions` slot next to the title block', () => {
    const w = mount(PageHeader, {
      props: { eyebrow: 'Plantilla', title: 'Héroes inscritos' },
      slots: { actions: '<button data-cta>Inscribir héroe</button>' },
    })
    expect(w.find('[data-cta]').exists()).toBe(true)
  })

  it('uses <header> as the root element for semantics', () => {
    const w = mount(PageHeader, { props: { eyebrow: 'A', title: 'B' } })
    expect(w.element.tagName).toBe('HEADER')
  })
})
