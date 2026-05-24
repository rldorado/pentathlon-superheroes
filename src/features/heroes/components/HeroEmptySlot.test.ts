import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import HeroEmptySlot from './HeroEmptySlot.vue'

describe('HeroEmptySlot', () => {
  it('renders the dashed border + Spanish empty copy + CTA', () => {
    const wrapper = mount(HeroEmptySlot)
    expect(wrapper.classes()).toContain('border-dashed')
    expect(wrapper.text()).toContain('Aún no hay héroes inscritos')
    const cta = wrapper.find('button')
    expect(cta.text()).toBe('Inscribir héroe')
  })

  it('emits `inscribe` when the CTA is clicked', async () => {
    const wrapper = mount(HeroEmptySlot)
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('inscribe')).toHaveLength(1)
  })

  it('hides the + icon from assistive tech (aria-hidden)', () => {
    const wrapper = mount(HeroEmptySlot)
    const iconWrap = wrapper.find('[aria-hidden="true"]')
    expect(iconWrap.exists()).toBe(true)
    expect(iconWrap.find('svg').exists()).toBe(true)
  })
})
