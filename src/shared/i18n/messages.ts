/**
 * Centralized Spanish copy.
 *
 * Every user-facing string lives here. Components and composables import from
 * this module rather than inlining literals so we can audit copy in one place
 * and prevent accidental English leakage into the Spanish UI.
 */

export const messages = {
  app: {
    title: 'Pentatlón de Superhéroes',
    tagline: 'Inscribe héroes, simula el pentatlón y corona al ganador.',
  },

  nav: {
    heroes: 'Héroes',
    pentatlon: 'Pentatlón',
  },

  errors: {
    /** No `VITE_PENTATHLON_API_KEY` configured. Surfaced at app boot. */
    missingApiKey:
      'Falta configurar la API key. Genera una con `POST /api-keys/` y guárdala en `VITE_PENTATHLON_API_KEY` dentro de `.env.local`.',
    missingApiBaseUrl: 'Falta configurar `VITE_PENTATHLON_API_BASE_URL` en `.env.local`.',

    /** Mapped from HTTP status families in shared/http/errors.ts. */
    unauthorized: 'No autorizado. Revisa que la API key sea válida.',
    forbidden: 'Acceso denegado por el servidor.',
    notFound: 'Recurso no encontrado.',
    conflict: 'Conflicto: el recurso ya existe o está en uso.',
    validation: 'Datos no válidos. Revisa los campos del formulario.',
    server: 'Error del servidor. Inténtalo de nuevo en unos segundos.',
    network: 'Sin conexión con el servidor. Comprueba tu red.',
    malformed: 'Respuesta del servidor mal formada.',
    generic: 'Ha ocurrido un error inesperado.',
  },

  actions: {
    retry: 'Reintentar',
    cancel: 'Cancelar',
    close: 'Cerrar',
    save: 'Guardar',
    delete: 'Eliminar',
    edit: 'Editar',
    confirm: 'Confirmar',
  },

  a11y: {
    dialogCloseLabel: 'Cerrar diálogo',
    toastDismissLabel: 'Descartar aviso',
    toastRegionLabel: 'Avisos',
  },
} as const

export type Messages = typeof messages
