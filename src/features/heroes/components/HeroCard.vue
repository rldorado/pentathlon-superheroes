<script setup lang="ts">
/**
 * Hero roster card — circular 128×128 portrait (constitution §6.4),
 * Clash Display name, 5 attribute rows (label · ProgressBar · mono value),
 * and Editar / Eliminar action buttons.
 *
 * NOTE on design discrepancy: docs/design-reference/Heroes Inscritos.html
 * shows a square full-bleed avatar. constitution §6.4 overrides that with
 * "full-circle on 128×128 hero thumbnails". This component follows the
 * constitution; the deviation is logged in AI_WORKFLOW.md.
 */
import { computed } from 'vue'
import { messages } from '@/shared/i18n/messages'
import Card from '@/shared/ui/Card.vue'
import ProgressBar from '@/shared/ui/ProgressBar.vue'
import { toDataUrl } from './heroImage'
import type { Hero, HeroAttributes } from '../types'

interface Props {
  hero: Hero
}

const props = defineProps<Props>()
defineEmits<{ edit: [hero: Hero]; remove: [hero: Hero] }>()

interface Row {
  key: keyof HeroAttributes
  label: string
  value: number
}

const rows = computed<Row[]>(() => [
  { key: 'agility', label: messages.attributes.agility, value: props.hero.attributes.agility },
  { key: 'strength', label: messages.attributes.strength, value: props.hero.attributes.strength },
  { key: 'weight', label: messages.attributes.weight, value: props.hero.attributes.weight },
  {
    key: 'endurance',
    label: messages.attributes.endurance,
    value: props.hero.attributes.endurance,
  },
  { key: 'charisma', label: messages.attributes.charisma, value: props.hero.attributes.charisma },
])

const portraitSrc = computed(() => (props.hero.picture ? toDataUrl(props.hero.picture) : null))
</script>

<template>
  <Card :aria-label="hero.name" class="flex flex-col">
    <div class="p-5 flex flex-col gap-4">
      <div
        class="flex flex-col items-center text-center gap-s3 sm:flex-row sm:items-center sm:text-left sm:gap-4"
      >
        <div
          class="w-32 h-32 rounded-thumb overflow-hidden bg-canvas-2 border border-hairline shrink-0"
          aria-hidden="true"
        >
          <img
            v-if="portraitSrc"
            :src="portraitSrc"
            width="128"
            height="128"
            class="w-full h-full object-cover"
            :alt="''"
          />
        </div>
        <h2
          class="font-display font-medium text-h2 tracking-tight text-ink m-0 w-full sm:w-auto break-words"
        >
          {{ hero.name }}
        </h2>
      </div>

      <dl class="flex flex-col gap-s2 m-0">
        <div
          v-for="row in rows"
          :key="row.key"
          class="grid grid-cols-[78px_1fr_28px] items-center gap-3"
        >
          <dt class="font-body text-caption font-medium text-ink-2 whitespace-nowrap">
            {{ row.label }}
          </dt>
          <dd class="m-0">
            <ProgressBar :value="row.value" :label="row.label" />
          </dd>
          <dd class="m-0 font-mono text-body-sm font-bold text-ink tabular-nums text-right">
            {{ row.value }}
          </dd>
        </div>
      </dl>
    </div>

    <div class="grid grid-cols-2 border-t border-hairline">
      <button
        type="button"
        class="min-h-11 px-4 py-3 inline-flex items-center justify-center gap-2 font-body font-semibold text-body-sm text-ink hover:bg-canvas-2 transition-colors duration-base ease-pa"
        @click="$emit('edit', hero)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="square"
          stroke-linejoin="miter"
          aria-hidden="true"
        >
          <path d="M2 12 L2 14 L4 14 L12.5 5.5 L10.5 3.5 Z" />
          <line x1="9.5" y1="4.5" x2="11.5" y2="6.5" />
        </svg>
        {{ messages.heroes.actions.edit }}
      </button>
      <button
        type="button"
        class="min-h-11 px-4 py-3 inline-flex items-center justify-center gap-2 font-body font-semibold text-body-sm text-ink-2 border-l border-hairline hover:bg-canvas-2 hover:text-accent-strong transition-colors duration-base ease-pa"
        @click="$emit('remove', hero)"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="square"
          stroke-linejoin="miter"
          aria-hidden="true"
        >
          <line x1="2" y1="4" x2="14" y2="4" />
          <path d="M3.5 4 L4 13.5 L12 13.5 L12.5 4" />
          <path d="M6 4 L6 2.5 L10 2.5 L10 4" />
        </svg>
        {{ messages.heroes.actions.delete }}
      </button>
    </div>
  </Card>
</template>
