<script setup lang="ts">
/**
 * Hero selection grid for the pentathlon simulation.
 * Shows all roster heroes as selectable cards. Footer shows counter + CTA.
 * Empty-state when roster has < 3 heroes (per clarification D-5).
 */
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useHeroesStore } from '@/features/heroes/store'
import { useHeroSelection } from '../composables/useHeroSelection'
import { usePentathlonStore } from '../store'
import Button from '@/shared/ui/Button.vue'
import { toDataUrl } from '@/features/heroes/components/heroImage'
import { messages } from '@/shared/i18n/messages'
import type { Hero } from '@/features/heroes/types'

const heroesStore = useHeroesStore()
const pentathlonStore = usePentathlonStore()
const router = useRouter()
const { isSelected, canToggle, toggle, selectedCount, canStart } = useHeroSelection()

const hasEnough = computed(() => heroesStore.heroes.length >= 3)

const selectedHeroes = computed<[Hero, Hero, Hero] | null>(() => {
  if (!canStart.value) return null
  const heroes = pentathlonStore.selectedIds
    .map((id) => heroesStore.byId(id))
    .filter(Boolean) as Hero[]
  return heroes.length === 3 ? (heroes as [Hero, Hero, Hero]) : null
})

function handleSimulate(): void {
  if (!selectedHeroes.value) return
  pentathlonStore.start(selectedHeroes.value)
}
</script>

<template>
  <div class="flex flex-col min-h-full">
    <div v-if="!hasEnough" class="flex flex-col items-center gap-s4 py-s6 text-center">
      <p class="font-body text-body text-ink-2 m-0">
        {{ messages.pentathlon.insufficientHeroes }}
      </p>
      <Button variant="primary" @click="router.push('/heroes')">
        {{ messages.pentathlon.goToHeroesCta }}
      </Button>
    </div>

    <template v-else>
      <div
        class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-s3 pb-24"
        role="list"
        :aria-label="messages.pentathlon.selectionInstruction"
      >
        <button
          v-for="hero in heroesStore.heroes"
          :key="hero.id"
          type="button"
          role="listitem"
          :aria-pressed="isSelected(hero.id)"
          :disabled="!canToggle(hero.id)"
          class="relative rounded-md border-2 text-left transition-all duration-base ease-pa focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed"
          :class="[
            isSelected(hero.id)
              ? 'border-accent bg-canvas-2'
              : 'border-hairline bg-canvas hover:border-ink-2',
          ]"
          @click="toggle(hero.id)"
        >
          <div class="p-3 flex items-center gap-3">
            <div
              class="w-12 h-12 rounded-thumb overflow-hidden bg-canvas-2 border border-hairline shrink-0"
            >
              <img
                v-if="hero.picture"
                :src="toDataUrl(hero.picture)"
                width="48"
                height="48"
                class="w-full h-full object-cover"
                alt=""
              />
            </div>
            <span class="font-display font-semibold text-body text-ink leading-tight">
              {{ hero.name }}
            </span>
          </div>

          <span
            v-if="isSelected(hero.id)"
            class="absolute top-2 right-2 w-5 h-5 rounded-full bg-accent flex items-center justify-center"
            aria-hidden="true"
          >
            <svg
              width="10"
              height="8"
              viewBox="0 0 10 8"
              fill="none"
              stroke="white"
              stroke-width="1.5"
              stroke-linecap="square"
            >
              <polyline points="1,4 4,7 9,1" />
            </svg>
          </span>
        </button>
      </div>

      <div
        class="fixed bottom-0 left-0 right-0 bg-canvas border-t border-hairline px-s4 py-s3 md:px-s6 flex items-center justify-between gap-s4 z-10"
      >
        <p class="font-body text-body-sm text-ink-2 m-0">
          {{ messages.pentathlon.selectionInstruction }}
          <span class="font-mono font-bold text-ink tabular-nums ml-1">
            ({{ selectedCount }}/3)
          </span>
        </p>
        <Button variant="primary" :disabled="!canStart" @click="handleSimulate">
          {{ messages.pentathlon.simulateCta }}
        </Button>
      </div>
    </template>
  </div>
</template>
