import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import Dialog from './Dialog.vue'

/**
 * T-16 — Dialog primitive.
 *
 * AC (tasks.md):
 *   - Teleport to body
 *   - Focus trap; restore focus to opener on close
 *   - Esc closes
 *   - Backdrop click closes (configurable via prop)
 *   - aria-modal="true", role="dialog", aria-labelledby references heading
 *   - Body scroll lock while open
 */
function mountDialog(props: Partial<Record<string, unknown>> = {}, slots: Record<string, string> = {}) {
  return mount(Dialog, {
    attachTo: document.body,
    props: {
      open: true,
      title: 'Inscribir héroe',
      ...props,
    },
    slots: {
      default: '<input data-test-focusable type="text" /><button data-test-action>Guardar</button>',
      ...slots,
    },
    global: {
      stubs: { Teleport: false },
    },
  })
}

describe('Dialog', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.innerHTML = ''
    document.body.style.overflow = ''
  })

  it('does NOT render its contents when `open` is false', () => {
    const w = mountDialog({ open: false })
    expect(document.querySelector('[role="dialog"]')).toBeNull()
    w.unmount()
  })

  it('teleports the dialog to document.body and exposes ARIA scaffolding', async () => {
    const w = mountDialog()
    await nextTick()

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement | null
    expect(dialog).not.toBeNull()
    expect(dialog!.getAttribute('aria-modal')).toBe('true')

    // aria-labelledby points at the rendered heading
    const labelledBy = dialog!.getAttribute('aria-labelledby')
    expect(labelledBy).toBeTruthy()
    const heading = document.getElementById(labelledBy!)
    expect(heading?.textContent).toBe('Inscribir héroe')

    w.unmount()
  })

  it('locks body scroll while open and restores it on close', async () => {
    expect(document.body.style.overflow).toBe('')

    const w = mountDialog()
    await nextTick()
    expect(document.body.style.overflow).toBe('hidden')

    await w.setProps({ open: false })
    await nextTick()
    expect(document.body.style.overflow).toBe('')

    w.unmount()
  })

  it('emits `update:open` with false when Escape is pressed', async () => {
    const w = mountDialog()
    await nextTick()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await flushPromises()

    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('emits `update:open` with false when the backdrop is clicked', async () => {
    const w = mountDialog()
    await nextTick()

    const backdrop = document.querySelector('[data-dialog-backdrop]') as HTMLElement
    backdrop.click()
    await flushPromises()

    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('does NOT emit close on backdrop click when `dismissOnBackdrop=false`', async () => {
    const w = mountDialog({ dismissOnBackdrop: false })
    await nextTick()

    const backdrop = document.querySelector('[data-dialog-backdrop]') as HTMLElement
    backdrop.click()
    await flushPromises()

    expect(w.emitted('update:open')).toBeUndefined()
    w.unmount()
  })

  it('renders a close button that emits update:open=false', async () => {
    const w = mountDialog()
    await nextTick()

    const closeBtn = document.querySelector('[data-dialog-close]') as HTMLButtonElement
    expect(closeBtn).not.toBeNull()
    closeBtn.click()
    await flushPromises()

    expect(w.emitted('update:open')?.at(-1)).toEqual([false])
    w.unmount()
  })

  it('restores focus to the opener after closing', async () => {
    const opener = document.createElement('button')
    opener.textContent = 'Abrir'
    document.body.appendChild(opener)
    opener.focus()
    expect(document.activeElement).toBe(opener)

    const w = mountDialog()
    await nextTick()
    // While open, focus should NOT remain on the opener.
    expect(document.activeElement).not.toBe(opener)

    await w.setProps({ open: false })
    await nextTick()
    await flushPromises()
    expect(document.activeElement).toBe(opener)

    w.unmount()
  })

  it('moves initial focus inside the dialog when it opens', async () => {
    mountDialog()
    await nextTick()
    await flushPromises()

    const dialog = document.querySelector('[role="dialog"]') as HTMLElement
    expect(dialog.contains(document.activeElement)).toBe(true)
  })

  it('cleans up keydown listener on unmount (no leaked Esc closing)', async () => {
    const removeSpy = vi.spyOn(document, 'removeEventListener')
    const w = mountDialog()
    await nextTick()
    w.unmount()
    expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function))
    removeSpy.mockRestore()
  })
})
