import { computed } from 'vue'
import { usePentathlonStore } from '../store'

export function useHeroSelection() {
  const store = usePentathlonStore()

  function isSelected(id: string): boolean {
    return store.selectedIds.includes(id)
  }

  function canToggle(id: string): boolean {
    return isSelected(id) || store.selectedIds.length < 3
  }

  function toggle(id: string): void {
    store.toggleSelect(id)
  }

  const selectedCount = computed(() => store.selectedIds.length)
  const canStart = computed(() => store.canStart)

  return { isSelected, canToggle, toggle, selectedCount, canStart }
}
