import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderComposable } from '@/shared/testing/renderComposable'
import { usePentathlonStore } from '../store'
import { useHeroSelection } from './useHeroSelection'

describe('useHeroSelection', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('isSelected returns false when id not in selection', () => {
    const { result } = renderComposable(() => useHeroSelection())
    expect(result.isSelected('h1')).toBe(false)
  })

  it('isSelected returns true after toggle', () => {
    const { result } = renderComposable(() => useHeroSelection())
    result.toggle('h1')
    expect(result.isSelected('h1')).toBe(true)
  })

  it('canToggle returns true when fewer than 3 selected', () => {
    const { result } = renderComposable(() => useHeroSelection())
    result.toggle('h1')
    result.toggle('h2')
    expect(result.canToggle('h3')).toBe(true)
  })

  it('canToggle returns false for new id when 3 already selected', () => {
    const { result } = renderComposable(() => useHeroSelection())
    result.toggle('h1')
    result.toggle('h2')
    result.toggle('h3')
    expect(result.canToggle('h4')).toBe(false)
  })

  it('canToggle returns true for already-selected id even when full', () => {
    const { result } = renderComposable(() => useHeroSelection())
    result.toggle('h1')
    result.toggle('h2')
    result.toggle('h3')
    expect(result.canToggle('h1')).toBe(true)
  })

  it('selectedCount reflects store selection length', () => {
    const { result } = renderComposable(() => useHeroSelection())
    expect(result.selectedCount.value).toBe(0)
    result.toggle('h1')
    result.toggle('h2')
    expect(result.selectedCount.value).toBe(2)
  })

  it('canStart is reactive to store changes', () => {
    const { result } = renderComposable(() => useHeroSelection())
    expect(result.canStart.value).toBe(false)
    const store = usePentathlonStore()
    store.toggleSelect('h1')
    store.toggleSelect('h2')
    store.toggleSelect('h3')
    expect(result.canStart.value).toBe(true)
  })
})
