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

  heroes: {
    pageEyebrow: 'Plantilla',
    pageTitle: 'Héroes inscritos',
    metaCountSingular: 'héroe en cuadro · listo para el pentatlón',
    metaCountPlural: 'héroes en cuadro · listos para el pentatlón',
    metaCountEmpty: 'sin héroes en cuadro · plantilla vacía',
    inscribeCta: 'Inscribir héroe',

    empty: {
      rosterEmpty: 'Aún no hay héroes inscritos',
      slot: 'Aún no hay héroes inscritos\nen este hueco.',
      slotCta: 'Inscribir héroe',
    },

    actions: {
      edit: 'Editar',
      delete: 'Eliminar',
    },

    form: {
      titleCreate: 'Inscribir héroe',
      titleEdit: 'Editar héroe',
      submitCreate: 'Inscribir héroe',
      submitEdit: 'Guardar cambios',
      nameLabel: 'Nombre',
      namePlaceholder: 'p. ej. Capitán Fuerza',
      pictureLabel: 'Imagen',
      pictureHint: 'PNG o JPEG · 128×128 · máx. 200 KB',
      pictureCta: 'Seleccionar imagen',
      pictureChangeCta: 'Cambiar imagen',
      attributesLegend: 'Atributos (0–10)',
    },

    delete: {
      title: 'Eliminar héroe',
      bodyPrefix: '¿Seguro que quieres eliminar a',
      bodySuffix: '? Esta acción no se puede deshacer.',
      submit: 'Eliminar héroe',
    },

    toasts: {
      created: 'Héroe inscrito correctamente.',
      updated: 'Héroe actualizado correctamente.',
      removed: 'Héroe eliminado.',
    },

    validation: {
      nameRequired: 'El nombre es obligatorio.',
      nameTooShort: 'El nombre debe tener al menos 2 caracteres.',
      nameTooLong: 'El nombre no puede superar los 40 caracteres.',
      nameInvalidChars: 'Solo se permiten letras, dígitos, espacio y los símbolos . \' -',
      nameTaken: 'Ya existe un héroe con ese nombre.',
      pictureRequired: 'La imagen es obligatoria.',
      pictureBadType: 'Formato no admitido. Usa PNG o JPEG.',
      pictureTooHeavy: 'La imagen supera los 200 KB.',
      pictureBadDims: 'La imagen debe ser exactamente de 128×128 píxeles.',
      attributeOutOfRange: 'Cada atributo debe ser un entero entre 0 y 10.',
    },
  },

  attributes: {
    agility: 'Agilidad',
    strength: 'Fuerza',
    weight: 'Peso',
    endurance: 'Resistencia',
    charisma: 'Carisma',
  },

  pentathlon: {
    pageEyebrow: 'Arena',
    pageTitle: 'Simulador del pentatlón',

    selectionInstruction: 'Selecciona 3 héroes',
    simulateCta: 'Simular pentatlón',
    insufficientHeroes:
      'Necesitas al menos 3 héroes inscritos para iniciar el pentatlón.',
    goToHeroesCta: 'Inscribir héroes',

    nextEventCta: 'Siguiente prueba →',
    seeClassificationCta: 'Ver clasificación →',
    tableHero: 'Héroe',
    tableValue: 'Valor',
    tablePoints: 'Pts',
    pts: 'pts',

    podiumEyebrow: 'Pentatlón cerrado',
    podiumTitle: 'Clasificación final',
    simulateAgainCta: 'Simular de nuevo →',
    ranks: {
      gold: 'Oro',
      silver: 'Plata',
      bronze: 'Bronce',
    },
  },
} as const

export type Messages = typeof messages
