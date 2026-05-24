/**
 * Pure file-validation/decoding helpers used by `HeroImageInput.vue`.
 *
 * Pulled out of the SFC so they can be unit-tested as plain functions with
 * stubbed globals. The constraints mirror docs/clarification.md D-2 and
 * docs/plan.md §3.6:
 *   - PNG or JPEG only.
 *   - Original file size ≤ 200 KB (the cap applies to the binary, not the
 *     base64-encoded payload).
 *   - Intrinsic dimensions exactly 128 × 128.
 *   - The emitted base64 string has the `data:image/...;base64,` prefix
 *     stripped (the API stores pure base64; display reattaches a sniffed
 *     prefix).
 */

import { messages } from '@/shared/i18n/messages'

export const MAX_FILE_BYTES = 200 * 1024
export const REQUIRED_DIMENSION = 128
export const ALLOWED_MIME = new Set<string>(['image/png', 'image/jpeg'])

export type ImageResult = { ok: true; base64: string } | { ok: false; error: string }

/**
 * Reads a `File` (or `Blob`) as a `data:` URL. Wraps the callback-style
 * `FileReader` API in a promise so we can `await` it.
 */
export function readAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result
      if (typeof result !== 'string') {
        reject(new Error('FileReader produced a non-string result'))
        return
      }
      resolve(result)
    }
    reader.onerror = () => reject(reader.error ?? new Error('FileReader failed'))
    reader.readAsDataURL(file)
  })
}

/** Loads `dataUrl` into an `<img>` and resolves once natural dimensions are known. */
export function readImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Image decode failed'))
    img.src = dataUrl
  })
}

/** Strips the `data:image/<mime>;base64,` prefix; returns the raw base64 payload. */
export function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',')
  return idx >= 0 ? dataUrl.slice(idx + 1) : dataUrl
}

/**
 * Validates the file against the constraints above and, on success, returns
 * the pure base64 payload ready for `HeroInput.picture`. Errors are pre-
 * mapped to the Spanish copy in `shared/i18n/messages.ts`.
 */
export async function processHeroImage(file: File): Promise<ImageResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return { ok: false, error: messages.heroes.validation.pictureBadType }
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, error: messages.heroes.validation.pictureTooHeavy }
  }

  let dataUrl: string
  try {
    dataUrl = await readAsDataUrl(file)
  } catch {
    return { ok: false, error: messages.heroes.validation.pictureBadType }
  }

  let dims: { width: number; height: number }
  try {
    dims = await readImageDimensions(dataUrl)
  } catch {
    return { ok: false, error: messages.heroes.validation.pictureBadDims }
  }
  if (dims.width !== REQUIRED_DIMENSION || dims.height !== REQUIRED_DIMENSION) {
    return { ok: false, error: messages.heroes.validation.pictureBadDims }
  }

  return { ok: true, base64: stripDataUrlPrefix(dataUrl) }
}

/**
 * Reattaches a `data:image/<mime>;base64,` prefix for display. Sniffs the
 * first few base64 characters because the API stores no MIME hint:
 *   - `/9j/...` → JPEG (binary `FF D8 FF` → base64 starts with `/9j/`)
 *   - `iVBORw...` → PNG (binary `89 50 4E 47` → base64 starts with `iVBOR`)
 * Falls back to PNG for unknown signatures — defensible default since both
 * accepted MIMEs are render-equivalent at 128×128.
 */
export function toDataUrl(base64: string): string {
  if (base64.startsWith('/9j/')) return `data:image/jpeg;base64,${base64}`
  return `data:image/png;base64,${base64}`
}
