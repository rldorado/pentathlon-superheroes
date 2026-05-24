import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AttributeSlider from './AttributeSlider.vue'

describe('AttributeSlider', () => {
  it('renders an associated <label> + range input bounded at 0..10', () => {
    const wrapper = mount(AttributeSlider, {
      props: { label: 'Agilidad', modelValue: 4 },
    })
    const input = wrapper.find('input[type="range"]')
    const label = wrapper.find('label')
    expect(label.attributes('for')).toBe(input.attributes('id'))
    expect(input.attributes('min')).toBe('0')
    expect(input.attributes('max')).toBe('10')
    expect(input.attributes('step')).toBe('1')
  })

  it('exposes aria-valuemin/max/now to assistive tech', () => {
    const wrapper = mount(AttributeSlider, {
      props: { label: 'Fuerza', modelValue: 7 },
    })
    const input = wrapper.find('input[type="range"]')
    expect(input.attributes('aria-valuemin')).toBe('0')
    expect(input.attributes('aria-valuemax')).toBe('10')
    expect(input.attributes('aria-valuenow')).toBe('7')
  })

  it('emits the integer value through update:modelValue on input', async () => {
    const wrapper = mount(AttributeSlider, {
      props: { label: 'Agilidad', modelValue: 3 },
    })
    const input = wrapper.find('input[type="range"]')
    await input.setValue('8')
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![0]).toEqual([8])
  })

  it('uses tabular-nums on the numeric readout for column alignment', () => {
    const wrapper = mount(AttributeSlider, {
      props: { label: 'Carisma', modelValue: 5 },
    })
    const readout = wrapper.find('span')
    expect(readout.classes()).toContain('tabular-nums')
    expect(readout.classes()).toContain('font-mono')
    expect(readout.text()).toBe('5')
  })

  it('uses a 44px touch-target height (`h-11`) on the input per constitution §6.5', () => {
    const wrapper = mount(AttributeSlider, {
      props: { label: 'Resistencia', modelValue: 6 },
    })
    const input = wrapper.find('input[type="range"]')
    expect(input.classes()).toContain('h-11')
  })
})
