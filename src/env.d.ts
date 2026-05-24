/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_PENTATHLON_API_BASE_URL: string
  readonly VITE_PENTATHLON_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, never>, Record<string, never>, unknown>
  export default component
}
