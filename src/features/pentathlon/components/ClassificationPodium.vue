<script setup lang="ts">
/**
 * Final podium — 3 blocks in 2nd · 1st · 3rd visual order.
 * Semantic DOM order is 1st · 2nd · 3rd for screen readers.
 * Receives classification + reset via `pentathlonStoreKey` injection.
 * Looks up hero names/pictures from the heroes store.
 */
import { computed, inject } from 'vue'
import { useHeroesStore } from '@/features/heroes/store'
import { pentathlonStoreKey } from '../types'
import Button from '@/shared/ui/Button.vue'
import PageHeader from '@/shared/ui/PageHeader.vue'
import { toDataUrl } from '@/features/heroes/components/heroImage'
import { messages } from '@/shared/i18n/messages'
import type { ClassificationEntry } from '../scoring/types'

const store = inject(pentathlonStoreKey)!
const heroesStore = useHeroesStore()

const entries = computed(() => store.classification ?? [])

interface PodiumSlot {
  entry: ClassificationEntry
  name: string
  picture: string | undefined
  medalLabel: string
  stepClass: string
  nameSize: string
  ptsSize: string
  order: number // CSS grid order
}

const slots = computed<PodiumSlot[]>(() => {
  const byRank = (rank: 1 | 2 | 3) => entries.value.find((e) => e.rank === rank)!
  return [
    {
      entry: byRank(1),
      name: heroesStore.byId(byRank(1).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(1).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.gold,
      stepClass: 'bg-gold text-gold-ink min-h-[240px]',
      nameSize: 'text-[clamp(20px,3.2vw,26px)]',
      ptsSize: 'text-[clamp(40px,6vw,52px)]',
      order: 2,
    },
    {
      entry: byRank(2),
      name: heroesStore.byId(byRank(2).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(2).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.silver,
      stepClass: 'bg-silver text-silver-ink min-h-[200px]',
      nameSize: 'text-[clamp(16px,2.4vw,20px)]',
      ptsSize: 'text-[clamp(26px,3.6vw,32px)]',
      order: 1,
    },
    {
      entry: byRank(3),
      name: heroesStore.byId(byRank(3).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(3).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.bronze,
      stepClass: 'bg-bronze text-bronze-ink min-h-[180px]',
      nameSize: 'text-[clamp(16px,2.4vw,20px)]',
      ptsSize: 'text-[clamp(26px,3.6vw,32px)]',
      order: 3,
    },
  ]
})

const metaLine = computed(() => {
  return entries.value
    .map((e) => {
      const name = heroesStore.byId(e.heroId)?.name ?? e.heroId
      return `${name} · ${e.totalPoints} ${messages.pentathlon.pts}`
    })
    .join(' / ')
})
</script>

<template>
  <div class="flex flex-col gap-s6">
    <PageHeader
      :eyebrow="messages.pentathlon.podiumEyebrow"
      :title="messages.pentathlon.podiumTitle"
      :subtitle="metaLine"
    />

    <!-- DOM order: 1st · 2nd · 3rd (a11y). Visual order: 2nd · 1st · 3rd (CSS order). -->
    <div
      class="grid grid-cols-3 gap-4 items-end"
      role="list"
      :aria-label="messages.pentathlon.podiumTitle"
    >
      <div
        v-for="slot in slots"
        :key="slot.entry.heroId"
        role="listitem"
        :style="{ order: slot.order }"
        class="relative pt-24"
      >
        <!-- Avatar floats above the step -->
        <div
          class="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 rounded-thumb overflow-hidden bg-canvas-2 border border-hairline z-10"
          :class="slot.entry.rank === 1 ? 'border-ink' : ''"
          aria-hidden="true"
        >
          <img
            v-if="slot.picture"
            :src="toDataUrl(slot.picture)"
            width="128"
            height="128"
            class="w-full h-full object-cover"
            alt=""
          />
        </div>

        <!-- Winner accent flag (5-bar motif) -->
        <div
          v-if="slot.entry.rank === 1"
          class="absolute top-[-24px] left-1/2 -translate-x-1/2 flex items-end gap-[3px] h-4"
          aria-hidden="true"
        >
          <i class="block w-1 h-[5px] bg-accent not-italic" />
          <i class="block w-1 h-[8px] bg-accent not-italic" />
          <i class="block w-1 h-[11px] bg-accent not-italic" />
          <i class="block w-1 h-[14px] bg-accent not-italic" />
          <i class="block w-1 h-[16px] bg-accent not-italic" />
        </div>

        <div
          :class="['rounded-t-md pt-24 pb-5 px-4 flex flex-col items-center gap-2 text-center', slot.stepClass]"
        >
          <!-- Medal pill -->
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body font-semibold text-[11px] tracking-[0.04em] uppercase leading-none border border-current/20"
          >
            {{ slot.medalLabel }}
          </span>

          <!-- Hero name -->
          <p :class="['font-display font-bold leading-tight tracking-tight m-0 text-wrap-balance', slot.nameSize]">
            {{ slot.name }}
          </p>

          <!-- Points -->
          <div class="flex items-baseline gap-1.5 mt-auto pt-1">
            <span :class="['font-mono font-bold tabular-nums leading-none tracking-tight', slot.ptsSize]">
              {{ slot.entry.totalPoints }}
            </span>
            <span class="font-body font-medium text-sm opacity-75">
              {{ messages.pentathlon.pts }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end">
      <Button variant="ghost" @click="store.reset()">
        {{ messages.pentathlon.simulateAgainCta }}
      </Button>
    </div>
  </div>
</template>
