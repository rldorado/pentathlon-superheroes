<script setup lang="ts">
/**
 * Roster grid. Renders one HeroCard per hero in a 3-column desktop grid
 * that collapses to 2 columns at `md` and 1 column on mobile, per
 * docs/design-reference/Heroes Inscritos.html and constitution §6.4 (12-col
 * grid, 24 px gutter).
 *
 * When the roster is non-empty AND the final row is not full, a trailing
 * `HeroEmptySlot` invites the user to inscribe another hero. We never
 * render the empty slot when the roster is completely empty — that case
 * is owned by the parent page (`HeroesPage`) so it can show the larger
 * "Aún no hay héroes inscritos" empty state.
 */
import { computed } from 'vue'
import HeroCard from './HeroCard.vue'
import HeroEmptySlot from './HeroEmptySlot.vue'
import type { Hero } from '../types'

interface Props {
  heroes: readonly Hero[]
  /** Number of columns the grid wraps at; default is 3 (desktop default). */
  columns?: number
}

const props = withDefaults(defineProps<Props>(), { columns: 3 })

const emit = defineEmits<{
  edit: [hero: Hero]
  remove: [hero: Hero]
  inscribe: []
}>()

const showTrailingSlot = computed(
  () => props.heroes.length > 0 && props.heroes.length % props.columns !== 0,
)
</script>

<template>
  <section
    class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-s4"
    aria-label="Plantilla de héroes"
  >
    <HeroCard
      v-for="hero in heroes"
      :key="hero.id"
      :hero="hero"
      @edit="emit('edit', hero)"
      @remove="emit('remove', hero)"
    />
    <HeroEmptySlot v-if="showTrailingSlot" @inscribe="emit('inscribe')" />
  </section>
</template>
