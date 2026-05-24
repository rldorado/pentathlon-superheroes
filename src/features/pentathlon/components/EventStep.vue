<script setup lang="ts">
/**
 * Renders one EventResult: event name, formula description, participant table
 * (name · value · points), reason chips, and the advance CTA.
 * Receives run context via `pentathlonStoreKey` injection.
 */
import { computed, inject } from 'vue'
import { useHeroesStore } from '@/features/heroes/store'
import { pentathlonStoreKey } from '../types'
import Button from '@/shared/ui/Button.vue'
import Chip from '@/shared/ui/Chip.vue'
import { messages } from '@/shared/i18n/messages'

const store = inject(pentathlonStoreKey)!
const heroesStore = useHeroesStore()

const event = computed(() => store.currentEvent)
const isLastEvent = computed(() => store.cursor === 4)
const ctaLabel = computed(() =>
  isLastEvent.value ? messages.pentathlon.seeClassificationCta : messages.pentathlon.nextEventCta,
)

const rows = computed(() => {
  if (!event.value) return []
  return event.value.participants.map((p) => ({
    ...p,
    name: heroesStore.byId(p.heroId)?.name ?? p.heroId,
  }))
})

function handleAdvance(): void {
  store.advance()
}
</script>

<template>
  <div v-if="event" class="flex flex-col gap-s5">
    <div class="flex flex-col gap-s1">
      <p class="font-body font-semibold text-caption uppercase tracking-widest text-ink-2 m-0">
        Prueba {{ event.eventId }} de 5
      </p>
      <h2 class="font-display font-bold text-h2 tracking-tight text-ink m-0">
        {{ event.name }}
      </h2>
      <p class="font-body text-body-sm text-ink-2 m-0">{{ event.formula }}</p>
    </div>

    <table class="w-full border-collapse">
      <thead>
        <tr class="border-b border-hairline">
          <th
            class="py-s2 pr-s3 text-left font-body font-semibold text-caption text-ink-2 uppercase tracking-wider"
          >
            {{ messages.pentathlon.tableHero }}
          </th>
          <th
            class="py-s2 px-s3 text-right font-body font-semibold text-caption text-ink-2 uppercase tracking-wider"
          >
            {{ messages.pentathlon.tableValue }}
          </th>
          <th
            class="py-s2 pl-s3 text-right font-body font-semibold text-caption text-ink-2 uppercase tracking-wider"
          >
            {{ messages.pentathlon.tablePoints }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, idx) in rows"
          :key="row.heroId"
          class="border-b border-hairline last:border-0"
          :class="idx === 0 ? 'text-ink' : 'text-ink-2'"
        >
          <td class="py-s3 pr-s3 font-display font-semibold text-body">
            {{ row.name }}
            <div v-if="row.reasons.length" class="flex flex-wrap gap-1 mt-1">
              <Chip v-for="reason in row.reasons" :key="reason" variant="accent">{{ reason }}</Chip>
            </div>
          </td>
          <td class="py-s3 px-s3 font-mono font-bold text-body tabular-nums text-right">
            {{ row.value }}
          </td>
          <td class="py-s3 pl-s3 font-mono font-bold text-body tabular-nums text-right">
            {{ row.points }}
          </td>
        </tr>
      </tbody>
    </table>

    <div class="flex justify-end">
      <Button variant="primary" @click="handleAdvance">
        {{ ctaLabel }}
      </Button>
    </div>
  </div>
</template>
