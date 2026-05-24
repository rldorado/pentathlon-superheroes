import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroGrid from './HeroGrid.vue'
import HeroCard from './HeroCard.vue'
import HeroEmptySlot from './HeroEmptySlot.vue'
import type { Hero } from '../types'

function hero(id: string, name: string): Hero {
  return {
    id,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    name,
    attributes: { agility: 5, strength: 5, weight: 5, endurance: 5, charisma: 5 },
  }
}

describe('HeroGrid', () => {
  it('renders one HeroCard per hero', () => {
    const heroes = [hero('h-1', 'A'), hero('h-2', 'B'), hero('h-3', 'C')]
    const wrapper = mount(HeroGrid, { props: { heroes } })
    expect(wrapper.findAllComponents(HeroCard)).toHaveLength(3)
  })

  it('appends a trailing HeroEmptySlot when the last row has unfilled columns (default 3)', () => {
    // 4 heroes in a 3-col grid → second row has 1 hero + 2 empty cells.
    const heroes = [
      hero('h-1', 'A'),
      hero('h-2', 'B'),
      hero('h-3', 'C'),
      hero('h-4', 'D'),
    ]
    const wrapper = mount(HeroGrid, { props: { heroes } })
    expect(wrapper.findComponent(HeroEmptySlot).exists()).toBe(true)
  })

  it('hides the trailing HeroEmptySlot when the row is full', () => {
    const heroes = [hero('h-1', 'A'), hero('h-2', 'B'), hero('h-3', 'C')]
    const wrapper = mount(HeroGrid, { props: { heroes } })
    expect(wrapper.findComponent(HeroEmptySlot).exists()).toBe(false)
  })

  it('renders nothing extra when the roster is empty — the page-level empty state handles it', () => {
    const wrapper = mount(HeroGrid, { props: { heroes: [] } })
    expect(wrapper.findAllComponents(HeroCard)).toHaveLength(0)
    expect(wrapper.findComponent(HeroEmptySlot).exists()).toBe(false)
  })

  it('forwards edit/remove events from HeroCard with the hero payload', async () => {
    const heroes = [hero('h-1', 'A')]
    const wrapper = mount(HeroGrid, { props: { heroes } })
    await wrapper.findComponent(HeroCard).vm.$emit('edit', heroes[0])
    await wrapper.findComponent(HeroCard).vm.$emit('remove', heroes[0])
    expect(wrapper.emitted('edit')![0]).toEqual([heroes[0]])
    expect(wrapper.emitted('remove')![0]).toEqual([heroes[0]])
  })

  it('emits `inscribe` when the trailing empty slot CTA fires', async () => {
    const heroes = [hero('h-1', 'A')]
    const wrapper = mount(HeroGrid, { props: { heroes } })
    await wrapper.findComponent(HeroEmptySlot).vm.$emit('inscribe')
    expect(wrapper.emitted('inscribe')).toHaveLength(1)
  })

  it('honours a non-default columns count when deciding to show the trailing slot', () => {
    // 2 heroes in a 2-col grid → row is full, no trailing slot.
    const wrapper = mount(HeroGrid, {
      props: { heroes: [hero('h-1', 'A'), hero('h-2', 'B')], columns: 2 },
    })
    expect(wrapper.findComponent(HeroEmptySlot).exists()).toBe(false)
  })
})
