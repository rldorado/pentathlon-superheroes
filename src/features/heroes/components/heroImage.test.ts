import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { processHeroImage, stripDataUrlPrefix, toDataUrl } from './heroImage'

/**
 * Stubs out the two non-deterministic globals the image pipeline relies on:
 *   - `FileReader`: synchronously fires `onload` with the pre-canned data URL.
 *   - `Image`: queues a microtask that calls `onload` with mocked natural
 *     dimensions taken from a per-test registry.
 *
 * Keeping them stub-controllable lets us exercise every branch of
 * `processHeroImage` deterministically in jsdom.
 */

const DATA_URL = 'data:image/png;base64,iVBORfake'
let mockedDims = { width: 128, height: 128 }

class MockFileReader {
  result: string | null = null
  error: unknown = null
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  readAsDataURL(_blob: Blob): void {
    this.result = DATA_URL
    queueMicrotask(() => this.onload?.())
  }
}

class MockImage {
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  naturalWidth = 0
  naturalHeight = 0
  set src(_value: string) {
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

function fakeFile(opts: { type: string; size: number; name?: string }): File {
  // We don't need real bytes — only `file.size` and `file.type` matter for
  // the validators. Override .size after construction since the File ctor
  // would otherwise compute it from the (tiny) Blob we pass in.
  const file = new File([''], opts.name ?? 'avatar.png', { type: opts.type })
  Object.defineProperty(file, 'size', { value: opts.size, configurable: true })
  return file
}

describe('processHeroImage', () => {
  it('rejects non-PNG/JPEG MIME types with the Spanish "bad type" copy', async () => {
    const out = await processHeroImage(fakeFile({ type: 'image/gif', size: 10_000 }))
    expect(out).toEqual({ ok: false, error: expect.stringMatching(/Formato no admitido/) })
  })

  it('rejects files heavier than 200 KB with the Spanish "too heavy" copy', async () => {
    const out = await processHeroImage(fakeFile({ type: 'image/png', size: 200 * 1024 + 1 }))
    expect(out).toEqual({ ok: false, error: expect.stringMatching(/200 KB/) })
  })

  it('rejects images whose intrinsic dimensions are not 128×128', async () => {
    mockedDims = { width: 256, height: 256 }
    const out = await processHeroImage(fakeFile({ type: 'image/png', size: 10_000 }))
    expect(out).toEqual({ ok: false, error: expect.stringMatching(/128×128/) })
  })

  it('rejects 128×127 (off-by-one on one axis) — both axes must match', async () => {
    mockedDims = { width: 128, height: 127 }
    const out = await processHeroImage(fakeFile({ type: 'image/png', size: 10_000 }))
    expect(out.ok).toBe(false)
  })

  it('accepts a PNG of 128×128 ≤ 200 KB and emits the prefix-stripped base64', async () => {
    const out = await processHeroImage(fakeFile({ type: 'image/png', size: 50_000 }))
    expect(out).toEqual({ ok: true, base64: 'iVBORfake' })
  })

  it('accepts a JPEG of 128×128 at exactly the 200 KB boundary', async () => {
    const out = await processHeroImage(fakeFile({ type: 'image/jpeg', size: 200 * 1024 }))
    expect(out).toEqual({ ok: true, base64: expect.any(String) })
  })
})

describe('stripDataUrlPrefix', () => {
  it('drops the `data:image/...;base64,` prefix', () => {
    expect(stripDataUrlPrefix('data:image/png;base64,abcDEF')).toBe('abcDEF')
    expect(stripDataUrlPrefix('data:image/jpeg;base64,/9j/4AAQ')).toBe('/9j/4AAQ')
  })

  it('is a no-op on strings without a comma (already-pure base64)', () => {
    expect(stripDataUrlPrefix('iVBORalreadyClean')).toBe('iVBORalreadyClean')
  })
})

describe('toDataUrl', () => {
  it('detects JPEG via the /9j/ base64 prefix', () => {
    expect(toDataUrl('/9j/4AAQfake')).toBe('data:image/jpeg;base64,/9j/4AAQfake')
  })

  it('defaults to PNG for the iVBOR signature and unknown base64', () => {
    expect(toDataUrl('iVBORfake')).toBe('data:image/png;base64,iVBORfake')
    expect(toDataUrl('ZZZunknownZZZ')).toBe('data:image/png;base64,ZZZunknownZZZ')
  })
})
