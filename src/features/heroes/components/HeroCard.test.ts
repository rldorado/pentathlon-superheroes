import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroCard from './HeroCard.vue'
import type { Hero } from '../types'

const hero: Hero = {
  id: 'h-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: 'Capitán Fuerza',
  picture: 'iVBORfake',
  attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
}

describe('HeroCard', () => {
  it('renders the hero name in the Clash Display heading', () => {
    const wrapper = mount(HeroCard, { props: { hero } })
    const h2 = wrapper.find('h2')
    expect(h2.text()).toBe('Capitán Fuerza')
    expect(h2.classes()).toContain('font-display')
  })

  it('renders the portrait at 128×128 with rounded-thumb mask + sniffed data-url', () => {
    const wrapper = mount(HeroCard, { props: { hero } })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('data:image/png;base64,iVBORfake')
    expect(img.attributes('width')).toBe('128')
    expect(img.attributes('height')).toBe('128')
    // The circular mask lives on the wrapping div per constitution §6.4.
    const portraitFrame = img.element.parentElement!
    expect(portraitFrame.className).toContain('rounded-thumb')
    expect(portraitFrame.className).toContain('overflow-hidden')
  })

  it('renders all 5 Spanish attribute rows with mono numeric values', () => {
    const wrapper = mount(HeroCard, { props: { hero } })
    const text = wrapper.text()
    for (const label of ['Agilidad', 'Fuerza', 'Peso', 'Resistencia', 'Carisma']) {
      expect(text).toContain(label)
    }
    const dds = wrapper.findAll('dd.font-mono')
    expect(dds).toHaveLength(5)
    expect(dds.map((d) => d.text())).toEqual(['4', '9', '7', '6', '5'])
  })

  it('emits `edit` with the hero when Editar is clicked', async () => {
    const wrapper = mount(HeroCard, { props: { hero } })
    const editBtn = wrapper.findAll('button').find((b) => b.text().includes('Editar'))!
    await editBtn.trigger('click')
    expect(wrapper.emitted('edit')).toBeTruthy()
    expect(wrapper.emitted('edit')![0]).toEqual([hero])
  })

  it('emits `remove` with the hero when Eliminar is clicked', async () => {
    const wrapper = mount(HeroCard, { props: { hero } })
    const delBtn = wrapper.findAll('button').find((b) => b.text().includes('Eliminar'))!
    await delBtn.trigger('click')
    expect(wrapper.emitted('remove')).toBeTruthy()
    expect(wrapper.emitted('remove')![0]).toEqual([hero])
  })

  it('skips the image element when the hero has no picture', () => {
    // Strip the optional `picture` key entirely (exactOptionalPropertyTypes
    // forbids `picture: undefined`).
    const { picture: _omit, ...withoutPicture } = hero
    void _omit
    const wrapper = mount(HeroCard, { props: { hero: withoutPicture } })
    expect(wrapper.find('img').exists()).toBe(false)
  })
})
