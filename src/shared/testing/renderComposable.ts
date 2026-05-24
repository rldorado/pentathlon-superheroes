import { createApp, type App } from 'vue'

/**
 * Canonical composable test harness.
 *
 * Per docs/constitution.md §4.2, composables MUST be tested through this
 * helper exclusively — direct-instance testing is disallowed because the
 * architecture relies on `provide`/`inject` and lifecycle hooks that require
 * an active component context. Pure non-Vue logic (e.g. scoring functions)
 * is tested as plain functions and does not use this helper.
 *
 * Do not modify this implementation. It is reproduced verbatim from the
 * constitution; any change requires a constitution amendment.
 */

interface RenderComposableResult<T> {
  result: T
  app: App
  unmount: () => void
}

export function renderComposable<T>(
  composable: () => T,
  options: { provides?: Record<string | symbol, unknown> } = {},
): RenderComposableResult<T> {
  let result!: T
  const app = createApp({
    setup() {
      result = composable()
      return () => null
    },
  })

  if (options.provides) {
    for (const [key, value] of Object.entries(options.provides)) {
      app.provide(key, value)
    }
  }

  app.mount(document.createElement('div'))

  return { result, app, unmount: () => app.unmount() }
}
