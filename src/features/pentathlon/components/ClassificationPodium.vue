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
  /** Medal background applied to the whole card on mobile (no `sm:` prefix). */
  cardBgClass: string
  /** Same medal palette, applied to the inner step on desktop (sm: prefixed). */
  stepBgClass: string
  /** Per-tier desktop step min-height — only takes effect at sm+. */
  stepHeightClass: string
  nameSize: string
  ptsSize: string
  /** CSS `order` on desktop only; mobile follows semantic 1·2·3 DOM order. */
  orderClass: string
}

const slots = computed<PodiumSlot[]>(() => {
  const byRank = (rank: 1 | 2 | 3) => entries.value.find((e) => e.rank === rank)!
  return [
    {
      entry: byRank(1),
      name: heroesStore.byId(byRank(1).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(1).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.gold,
      cardBgClass: 'bg-gold text-gold-ink',
      stepBgClass: 'sm:bg-gold sm:text-gold-ink',
      stepHeightClass: 'sm:min-h-[240px]',
      nameSize: 'text-[clamp(20px,3.2vw,26px)]',
      ptsSize: 'text-[clamp(36px,6vw,52px)]',
      orderClass: 'sm:order-2',
    },
    {
      entry: byRank(2),
      name: heroesStore.byId(byRank(2).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(2).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.silver,
      cardBgClass: 'bg-silver text-silver-ink',
      stepBgClass: 'sm:bg-silver sm:text-silver-ink',
      stepHeightClass: 'sm:min-h-[200px]',
      nameSize: 'text-[clamp(16px,2.4vw,20px)]',
      ptsSize: 'text-[clamp(26px,3.6vw,32px)]',
      orderClass: 'sm:order-1',
    },
    {
      entry: byRank(3),
      name: heroesStore.byId(byRank(3).heroId)?.name ?? '—',
      picture: heroesStore.byId(byRank(3).heroId)?.picture,
      medalLabel: messages.pentathlon.ranks.bronze,
      cardBgClass: 'bg-bronze text-bronze-ink',
      stepBgClass: 'sm:bg-bronze sm:text-bronze-ink',
      stepHeightClass: 'sm:min-h-[180px]',
      nameSize: 'text-[clamp(16px,2.4vw,20px)]',
      ptsSize: 'text-[clamp(26px,3.6vw,32px)]',
      orderClass: 'sm:order-3',
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

    <!--
      DOM order: 1st · 2nd · 3rd (a11y + mobile reading order).
      Desktop visual order: 2nd · 1st · 3rd (CSS `order` via `sm:order-*` classes).
      Mobile layout: vertical stack of full-width medal cards (avatar inline left).
      Desktop layout: horizontal 3-col podium with floating avatar above each step.
    -->
    <div
      class="flex flex-col gap-s3 sm:grid sm:grid-cols-3 sm:gap-4 sm:items-end"
      role="list"
      :aria-label="messages.pentathlon.podiumTitle"
    >
      <div
        v-for="slot in slots"
        :key="slot.entry.heroId"
        role="listitem"
        :class="[
          'relative',
          slot.orderClass,
          'flex flex-row items-center gap-s3 p-s3 rounded-md',
          slot.cardBgClass,
          'sm:bg-transparent sm:text-ink',
          'sm:flex-col sm:items-stretch sm:gap-0 sm:p-0 sm:pt-24 sm:rounded-none',
        ]"
      >
        <!-- Avatar: inline left on mobile, floats above the step on desktop -->
        <div
          :class="[
            'w-20 h-20 sm:w-32 sm:h-32',
            'rounded-thumb overflow-hidden bg-canvas-2 border border-hairline shrink-0 z-10',
            'sm:absolute sm:top-0 sm:left-1/2 sm:-translate-x-1/2',
            slot.entry.rank === 1 ? 'border-ink' : '',
          ]"
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

        <!-- Winner accent flag (5-bar motif) — desktop-only, sits above the floating avatar. -->
        <div
          v-if="slot.entry.rank === 1"
          class="hidden sm:flex absolute top-[-24px] left-1/2 -translate-x-1/2 items-end gap-[3px] h-4"
          aria-hidden="true"
        >
          <i class="block w-1 h-[5px] bg-accent not-italic" />
          <i class="block w-1 h-[8px] bg-accent not-italic" />
          <i class="block w-1 h-[11px] bg-accent not-italic" />
          <i class="block w-1 h-[14px] bg-accent not-italic" />
          <i class="block w-1 h-[16px] bg-accent not-italic" />
        </div>

        <!--
          Step content. On mobile it sits next to the avatar with no background of its
          own (the outer card carries the medal color). On desktop it becomes the
          "step" block under the floating avatar, with the medal color + tier height.
        -->
        <div
          :class="[
            'flex-1 min-w-0 flex flex-col items-start text-left gap-s1',
            'sm:w-full sm:flex-none sm:items-center sm:text-center sm:gap-2',
            'sm:rounded-t-md sm:pt-24 sm:pb-5 sm:px-4',
            slot.stepBgClass,
            slot.stepHeightClass,
          ]"
        >
          <!-- Medal pill -->
          <span
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-body font-semibold text-[11px] tracking-[0.04em] uppercase leading-none border border-current/20"
          >
            {{ slot.medalLabel }}
          </span>

          <!-- Hero name -->
          <p
            :class="[
              'font-display font-bold leading-tight tracking-tight m-0 text-wrap-balance break-words',
              slot.nameSize,
            ]"
          >
            {{ slot.name }}
          </p>

          <!-- Points -->
          <div class="flex items-baseline gap-1.5 sm:mt-auto sm:pt-1">
            <span
              :class="[
                'font-mono font-bold tabular-nums leading-none tracking-tight',
                slot.ptsSize,
              ]"
            >
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
