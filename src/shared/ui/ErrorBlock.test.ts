import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ErrorBlock from './ErrorBlock.vue'

describe('ErrorBlock', () => {
  it('renders the message inside a role=alert region', () => {
    const wrapper = mount(ErrorBlock, { props: { message: 'Algo falló' } })
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toBe('Algo falló')
  })

  it('renders default retry label "Reintentar"', () => {
    const wrapper = mount(ErrorBlock, { props: { message: 'x' } })
    expect(wrapper.text()).toContain('Reintentar')
  })

  it('renders custom retry label when provided', () => {
    const wrapper = mount(ErrorBlock, { props: { message: 'x', retryLabel: 'Volver a cargar' } })
    expect(wrapper.text()).toContain('Volver a cargar')
  })

  it('emits retry event when the button is clicked', async () => {
    const wrapper = mount(ErrorBlock, { props: { message: 'x' } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('retry')).toHaveLength(1)
  })
})
