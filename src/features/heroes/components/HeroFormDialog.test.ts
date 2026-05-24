import { describe, it, expect, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HeroFormDialog from './HeroFormDialog.vue'
import type { HeroFormStore } from '../composables/useHeroForm'
import type { Hero } from '../types'

/**
 * Tests for the HeroFormDialog wiring. Validation logic lives in
 * `useHeroForm`; here we cover only the integration:
 *   - Renders the right title + submit label per mode.
 *   - Prefills draft from `initial` in edit mode.
 *   - Submit success emits `submitted` and closes the dialog.
 *   - Submit failure surfaces `submitError`.
 */

function makeStore(overrides: Partial<HeroFormStore> = {}): HeroFormStore & {
  create: ReturnType<typeof vi.fn>
  update: ReturnType<typeof vi.fn>
  hasName: ReturnType<typeof vi.fn>
} {
  return {
    hasName: vi.fn(() => false),
    create: vi.fn(async () => null),
    update: vi.fn(async () => null),
    error: null,
    ...overrides,
  } as HeroFormStore & {
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    hasName: ReturnType<typeof vi.fn>
  }
}

const heroFixture: Hero = {
  id: 'h-1',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  name: 'Capitán Fuerza',
  picture: 'iVBORfake',
  attributes: { agility: 4, strength: 9, weight: 7, endurance: 6, charisma: 5 },
}

describe('HeroFormDialog — create mode', () => {
  it('renders the Spanish "Inscribir héroe" title and submit label', () => {
    const store = makeStore()
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: { open: true, mode: 'create', storeOverride: store },
    })
    expect(document.body.textContent).toContain('Inscribir héroe')
    const submitBtn = Array.from(document.body.querySelectorAll<HTMLButtonElement>('button')).find(
      (b) => b.textContent?.trim() === 'Inscribir héroe' && b.type === 'submit',
    )
    expect(submitBtn).toBeTruthy()
    wrapper.unmount()
  })

  it('blocks submit and shows the name error when the form is empty', async () => {
    const store = makeStore()
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: { open: true, mode: 'create', storeOverride: store },
    })
    const form = document.body.querySelector('form')!
    form.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(store.create).not.toHaveBeenCalled()
    expect(document.body.textContent).toContain('El nombre es obligatorio.')
    wrapper.unmount()
  })

  it('on submit success: calls store.create, emits `submitted`, and closes', async () => {
    const created: Hero = { ...heroFixture, id: 'h-new', name: 'Nuevo' }
    const store = makeStore({ create: vi.fn(async () => created) })
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: { open: true, mode: 'create', storeOverride: store },
    })

    const nameInput = document.body.querySelector<HTMLInputElement>('#hero-name')!
    nameInput.value = 'Nuevo'
    nameInput.dispatchEvent(new Event('input'))
    // Bypass the file-input flow by setting the picture via the form internals.
    // The simpler path here: prefill via component instance.
    const vm = wrapper.vm as unknown as { form: { draft: { picture: string } } }
    vm.form.draft.picture = 'iVBORfake'

    const form = document.body.querySelector('form')!
    form.dispatchEvent(new Event('submit'))
    await flushPromises()

    expect(store.create).toHaveBeenCalledTimes(1)
    expect(wrapper.emitted('submitted')).toBeTruthy()
    expect(wrapper.emitted('submitted')![0]).toEqual([created, 'create'])
    expect(wrapper.emitted('update:open')!.pop()).toEqual([false])
    wrapper.unmount()
  })

  it('on submit failure: surfaces store.error inline, keeps dialog open', async () => {
    const store = makeStore({ create: vi.fn(async () => null), error: 'No autorizado.' })
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: { open: true, mode: 'create', storeOverride: store },
    })
    const vm = wrapper.vm as unknown as { form: { draft: { name: string; picture: string } } }
    vm.form.draft.name = 'Nuevo Héroe'
    vm.form.draft.picture = 'iVBORfake'
    document.body.querySelector('form')!.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(document.body.textContent).toContain('No autorizado.')
    expect(wrapper.emitted('submitted')).toBeUndefined()
    wrapper.unmount()
  })
})

describe('HeroFormDialog — edit mode', () => {
  it('renders the Spanish "Editar héroe" title and prefills the name', () => {
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: {
        open: true,
        mode: 'edit',
        initial: heroFixture,
        storeOverride: makeStore(),
      },
    })
    expect(document.body.textContent).toContain('Editar héroe')
    const nameInput = document.body.querySelector<HTMLInputElement>('#hero-name')!
    expect(nameInput.value).toBe('Capitán Fuerza')
    wrapper.unmount()
  })

  it('submit calls store.update with the initial hero id', async () => {
    const updated: Hero = { ...heroFixture, name: 'Renombrado' }
    const store = makeStore({ update: vi.fn(async () => updated) })
    const wrapper = mount(HeroFormDialog, {
      attachTo: document.body,
      props: { open: true, mode: 'edit', initial: heroFixture, storeOverride: store },
    })
    const nameInput = document.body.querySelector<HTMLInputElement>('#hero-name')!
    nameInput.value = 'Renombrado'
    nameInput.dispatchEvent(new Event('input'))
    document.body.querySelector('form')!.dispatchEvent(new Event('submit'))
    await flushPromises()
    expect(store.update).toHaveBeenCalledWith(
      'h-1',
      expect.objectContaining({ name: 'Renombrado' }),
    )
    expect(wrapper.emitted('submitted')![0]).toEqual([updated, 'edit'])
    wrapper.unmount()
  })
})
