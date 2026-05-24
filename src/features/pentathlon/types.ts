import type { InjectionKey } from 'vue'
import type { usePentathlonStore } from './store'

export const pentathlonStoreKey: InjectionKey<ReturnType<typeof usePentathlonStore>> =
  Symbol('pentathlonStoreKey')
