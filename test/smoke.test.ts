import { describe, it, expect } from 'vitest'

/**
 * Vitest wiring smoke test. Phase-2 (T-18..T-22) introduces the real scoring
 * tests; this file proves the runner, jsdom env, and Pinia setup are wired.
 */
describe('smoke', () => {
  it('vitest runs', () => {
    expect(1 + 1).toBe(2)
  })

  it('jsdom env exposes document', () => {
    expect(typeof document).toBe('object')
    expect(document.createElement('div').tagName).toBe('DIV')
  })
})
