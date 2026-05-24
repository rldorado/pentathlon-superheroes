import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDeleteDialog from './ConfirmDeleteDialog.vue'
import type { Hero } from '../types'

const hero: Hero = {
  id: 'h-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: 'Capitán Fuerza',
  attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
}

function mountDialog(
  props: Partial<{ open: boolean; hero: Hero | null; error: string; pending: boolean }> = {},
) {
  return mount(ConfirmDeleteDialog, {
    attachTo: document.body,
    props: { open: true, hero, ...props },
  })
}

describe('ConfirmDeleteDialog', () => {
  it('renders the hero name in the confirmation body when open', () => {
    const wrapper = mountDialog()
    expect(document.body.textContent).toContain('Capitán Fuerza')
    expect(document.body.textContent).toContain('Eliminar héroe')
    wrapper.unmount()
  })

  it('does not render any dialog when open=false', () => {
    const wrapper = mountDialog({ open: false })
    expect(document.body.querySelector('[role="dialog"]')).toBeNull()
    wrapper.unmount()
  })

  it('emits `confirm` with the hero on the destructive CTA click', async () => {
    const wrapper = mountDialog()
    const confirmBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Eliminar héroe',
    )!
    confirmBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')![0]).toEqual([hero])
    wrapper.unmount()
  })

  it('emits `update:open` false when Cancelar is clicked', async () => {
    const wrapper = mountDialog()
    const cancelBtn = Array.from(document.body.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === 'Cancelar',
    )!
    cancelBtn.click()
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:open')).toBeTruthy()
    expect(wrapper.emitted('update:open')!.pop()).toEqual([false])
    wrapper.unmount()
  })

  it('shows the inline error when provided and disables nothing else', () => {
    const wrapper = mountDialog({ error: 'No autorizado.' })
    const alert = document.body.querySelector('[role="alert"]')
    expect(alert?.textContent).toBe('No autorizado.')
    wrapper.unmount()
  })

  it('disables both CTAs while `pending` is true', () => {
    const wrapper = mountDialog({ pending: true })
    const buttons = Array.from(document.body.querySelectorAll('button')).filter((b) =>
      ['Cancelar', 'Eliminar héroe'].includes(b.textContent?.trim() ?? ''),
    )
    expect(buttons).toHaveLength(2)
    expect(buttons.every((b) => (b as HTMLButtonElement).disabled)).toBe(true)
    wrapper.unmount()
  })
})
