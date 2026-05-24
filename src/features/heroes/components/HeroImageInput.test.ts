import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import HeroImageInput from './HeroImageInput.vue'

/**
 * Smoke tests for the file-input wiring — we already verified validation
 * branches in heroImage.test.ts. Here we just confirm the SFC:
 *   - Renders the preview from `modelValue` (with the right data-url prefix).
 *   - Emits `update:modelValue` with the base64 payload on a valid pick.
 *   - Emits `update:error` with a Spanish string when the file is invalid.
 */

const DATA_URL = 'data:image/png;base64,iVBORfake'
let mockedDims = { width: 128, height: 128 }

class MockFileReader {
  result: string | null = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  readAsDataURL(): void {
    this.result = DATA_URL
    queueMicrotask(() => this.onload?.())
  }
}

class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 0
  naturalHeight = 0
  set src(_: string) {
    this.naturalWidth = mockedDims.width
    this.naturalHeight = mockedDims.height
    queueMicrotask(() => this.onload?.())
  }
}

beforeEach(() => {
  mockedDims = { width: 128, height: 128 }
  vi.stubGlobal('FileReader', MockFileReader)
  vi.stubGlobal('Image', MockImage)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function fakeFile(opts: { type: string; size: number }): File {
  const file = new File([''], 'avatar.png', { type: opts.type })
  Object.defineProperty(file, 'size', { value: opts.size, configurable: true })
  return file
}

async function pickFile(wrapper: ReturnType<typeof mount>, file: File): Promise<void> {
  const input = wrapper.find('input[type="file"]')
  // VTU's setValue path doesn't reach FileList; assign manually.
  Object.defineProperty(input.element, 'files', {
    value: [file],
    configurable: true,
  })
  await input.trigger('change')
  await flushPromises()
}

describe('HeroImageInput', () => {
  it('renders the preview when modelValue carries a base64 string', () => {
    const wrapper = mount(HeroImageInput, { props: { modelValue: 'iVBORfake' } })
    const img = wrapper.find('img')
    expect(img.exists()).toBe(true)
    expect(img.attributes('src')).toBe('data:image/png;base64,iVBORfake')
    expect(img.attributes('width')).toBe('128')
    expect(img.attributes('height')).toBe('128')
  })

  it('shows no preview when modelValue is empty', () => {
    const wrapper = mount(HeroImageInput, { props: { modelValue: '' } })
    expect(wrapper.find('img').exists()).toBe(false)
  })

  it('emits update:modelValue with the prefix-stripped base64 on a valid pick', async () => {
    const wrapper = mount(HeroImageInput, { props: { modelValue: '' } })
    await pickFile(wrapper, fakeFile({ type: 'image/png', size: 10_000 }))
    const emitted = wrapper.emitted('update:modelValue')
    expect(emitted).toBeTruthy()
    expect(emitted![emitted!.length - 1]).toEqual(['iVBORfake'])
  })

  it('emits update:error with the Spanish dimensions message when the image is not 128×128', async () => {
    mockedDims = { width: 64, height: 64 }
    const wrapper = mount(HeroImageInput, { props: { modelValue: '' } })
    await pickFile(wrapper, fakeFile({ type: 'image/png', size: 10_000 }))
    const errors = wrapper.emitted('update:error') ?? []
    const last = errors[errors.length - 1] as [string]
    expect(last[0]).toMatch(/128×128/)
  })

  it('shows an inline alert when `error` prop is set, with aria-invalid + aria-describedby', () => {
    const wrapper = mount(HeroImageInput, {
      props: { modelValue: '', error: 'La imagen es obligatoria.' },
    })
    const alert = wrapper.find('[role="alert"]')
    expect(alert.exists()).toBe(true)
    expect(alert.text()).toBe('La imagen es obligatoria.')
    const input = wrapper.find('input[type="file"]')
    expect(input.attributes('aria-invalid')).toBe('true')
    expect(input.attributes('aria-describedby')).toBe(alert.attributes('id'))
  })

  it('swaps the CTA label between "Seleccionar imagen" and "Cambiar imagen" based on modelValue', async () => {
    const wrapper = mount(HeroImageInput, { props: { modelValue: '' } })
    expect(wrapper.find('button').text()).toBe('Seleccionar imagen')
    await wrapper.setProps({ modelValue: 'iVBORfake' })
    expect(wrapper.find('button').text()).toBe('Cambiar imagen')
  })
})
