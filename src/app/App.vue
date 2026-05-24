<script setup lang="ts">
import { provide } from 'vue'
import { RouterView } from 'vue-router'
import ToastHost from '@/shared/ui/toast/ToastHost.vue'
import { createToastBus } from '@/shared/ui/toast/createToastBus'
import { toastKey } from '@/shared/ui/toast/types'

// App-level toast bus per docs/plan.md §4.3. Provided here so every child —
// including future heroes/pentathlon features — can call `useToast()`.
const toastBus = createToastBus()
provide(toastKey, toastBus)
</script>

<template>
  <div id="app-root" class="min-h-screen bg-canvas text-ink font-body">
    <RouterView />
    <ToastHost />
  </div>
</template>
