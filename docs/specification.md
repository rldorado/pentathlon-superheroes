# Specification — Pentatlón de Superhéroes

> What the product does and why, from the user's perspective. Implementation detail belongs in `plan.md`.
> Governed by `constitution.md`. Open questions are tracked in §6 and resolved during the clarification pass before `plan.md` begins.

---

## 1. Product summary

A single-page web app, in Spanish, that lets a user (the "organizador") register a roster of superheroes and then run them through a 5-event "Pentatlón" to crown a Gold / Silver / Bronze podium.

Two functional areas, each on its own route:

- **A. Gestión de héroes** — CRUD for superheroes (the persistent roster).
- **B. Simulador del pentatlón** — pick exactly 3 heroes, run 5 sequential events, see the final classification.

All hero data is persisted via the public REST API at `https://codetest-api.applivery.io` (see `constitution.md` §7 for auth/security rules; endpoint shapes are mapped in `plan.md`).

---

## 2. Actors

- **Organizador** (only actor): manages the roster and runs simulations. No authentication beyond the API key.

---

## 3. Domain model (user-facing)

### 3.1 Héroe

- `id` — assigned by the API; opaque string.
- `nombre` — **unique** across the roster, non-empty, trimmed.
- `imagen` — 128×128 px PNG/JPEG, **base64-encoded**. Exact pixel dimensions are validated client-side before upload.
- `atributos` — five integers in `[0, 10]`:
  - `agilidad`
  - `fuerza`
  - `peso`
  - `resistencia`
  - `carisma`

### 3.2 Pentatlón (simulación)

A pentathlon run is ephemeral: it is created in memory from a selection of 3 heroes, played through 5 ordered events, and produces a final classification. It is **not** persisted to the API (out of scope unless added during clarification).

The 5 events, in order:

| # | Nombre | Fórmula del valor por participante |
|---|---|---|
| 1 | Escalar el rascacielos | `(fuerza × 4) − (peso × 2)` |
| 2 | Contar un chiste | `(carisma²) − Σ(carisma de los rivales)` |
| 3 | Disparar al villano | `(agilidad + fuerza) + (5 si va último en la clasificación general acumulada hasta ahora, si no 0)` |
| 4 | Sprint de 200 km | `(agilidad × 4) + (resistencia × 2) + (10 si quedó 1.º en la prueba anterior, si no −1)` |
| 5 | Rescatar 100 gatitos | `(agilidad × 2) + (5 si ha ganado al menos dos pruebas hasta ahora, si no 0)` |

**Puntos por prueba:** dentro de cada prueba, el participante con el valor más alto recibe **5 pts**, el segundo **3 pts**, el tercero **1 pt**.
**Clasificación final:** suma de puntos a lo largo de las 5 pruebas. Oro / Plata / Bronce por orden descendente.

Events 3, 4, and 5 depend on prior results. Tie-handling for "último", "1.º en la prueba anterior", "ganado al menos dos pruebas", and final ranking is **open** — see §6.

---

## 4. User stories & acceptance criteria

### 4.1 Roster — Gestión de héroes

#### US-1 — Ver el plantel de héroes
**Como** organizador, **quiero** ver todos los héroes inscritos en una cuadrícula, **para** revisar mi plantel antes de simular.

**Acceptance:**
- AC-1.1 — Al entrar a `/heroes`, la app llama al endpoint de listado y muestra una tarjeta por héroe con: imagen (128×128, circular), nombre, los 5 atributos con su valor numérico y una barra de progreso (0–10).
- AC-1.2 — Encima de la cuadrícula aparece un encabezado: eyebrow "PLANTILLA", título "Héroes inscritos", subtítulo con el conteo dinámico ("N héroes en cuadro · listos para el pentatlón").
- AC-1.3 — Botón primario "+ Inscribir héroe" arriba a la derecha.
- AC-1.4 — Si la lista está vacía, se muestra un estado vacío con un slot punteado y CTA "Inscribir héroe".
- AC-1.5 — Mientras carga, se muestra un esqueleto con la misma altura que las tarjetas (evita CLS).
- AC-1.6 — Si la API falla, se muestra un mensaje de error en español con un botón "Reintentar".

#### US-2 — Inscribir un héroe nuevo
**Como** organizador, **quiero** crear un héroe con nombre, imagen y atributos, **para** sumarlo al plantel.

**Acceptance:**
- AC-2.1 — Formulario accesible vía "+ Inscribir héroe", con campos: `nombre` (texto), `imagen` (file picker, acepta PNG/JPEG), 5 sliders/inputs numéricos `0–10` para los atributos.
- AC-2.2 — El nombre se valida: requerido, único en el roster (case-insensitive después de `trim`), longitud máxima razonable (a definir en §6).
- AC-2.3 — La imagen se valida client-side: tipo PNG/JPEG, **dimensiones exactas 128×128 px**, tamaño máximo (a definir en §6). Si no cumple, se muestra error inline en español y el formulario no se envía.
- AC-2.4 — La imagen se convierte a base64 y se envía al endpoint correspondiente.
- AC-2.5 — Cada atributo se valida: entero en `[0, 10]`. El control no permite valores fuera de rango.
- AC-2.6 — Al enviar con éxito, el formulario se cierra, la lista se refresca, y se muestra una confirmación breve (toast o estado inline — a definir en §6).
- AC-2.7 — Al fallar el envío, el formulario permanece abierto, los datos no se pierden, y se muestra el error de la API traducido a español.
- AC-2.8 — El formulario es totalmente operable con teclado y cumple los mínimos a11y de la `constitution.md` §5.2.

#### US-3 — Editar un héroe existente
**Como** organizador, **quiero** modificar el nombre, la imagen o los atributos de un héroe, **para** corregir errores o ajustar el plantel.

**Acceptance:**
- AC-3.1 — Botón "Editar" en cada tarjeta abre el mismo formulario que US-2, precargado con los valores actuales.
- AC-3.2 — La validación de unicidad de nombre excluye al héroe que se está editando.
- AC-3.3 — La imagen es opcional al editar: si el usuario no carga una nueva, se mantiene la actual.
- AC-3.4 — Al guardar con éxito, la tarjeta se actualiza in-situ.

#### US-4 — Eliminar un héroe
**Como** organizador, **quiero** eliminar un héroe del plantel, **para** retirarlo del torneo.

**Acceptance:**
- AC-4.1 — Botón "Eliminar" en cada tarjeta abre un diálogo de confirmación en español que nombra al héroe.
- AC-4.2 — Al confirmar, se llama al endpoint de borrado, se quita la tarjeta de la cuadrícula y se actualiza el conteo del encabezado.
- AC-4.3 — Si el héroe a eliminar ya estaba seleccionado en una simulación en curso, queda **deseleccionado** (la simulación no se persiste, así que no hay que reabrirla).
- AC-4.4 — Al fallar el borrado, la tarjeta permanece y se muestra el error.

### 4.2 Simulador

#### US-5 — Seleccionar 3 héroes para competir
**Como** organizador, **quiero** elegir exactamente 3 héroes distintos del plantel, **para** lanzar el pentatlón.

**Acceptance:**
- AC-5.1 — Ruta `/pentatlon` muestra la lista de héroes con selección múltiple.
- AC-5.2 — El botón "Simular pentatlón" se habilita **solo** cuando hay exactamente 3 héroes seleccionados.
- AC-5.3 — Intentar seleccionar un 4.º héroe está deshabilitado o muestra un aviso ("Selecciona exactamente 3").
- AC-5.4 — Si hay menos de 3 héroes en el plantel, la pantalla muestra un estado vacío que invita a "Inscribir héroe" antes de simular.

#### US-6 — Ejecutar el pentatlón
**Como** organizador, **quiero** ver cómo se desarrollan las 5 pruebas con sus puntuaciones, **para** entender por qué cada héroe acabó donde acabó.

**Acceptance:**
- AC-6.1 — Al pulsar "Simular pentatlón" se calcula la simulación completa (las 5 pruebas en orden, con la lógica secuencial de las pruebas 3, 4, 5).
- AC-6.2 — Por cada prueba se muestra: nombre de la prueba, fórmula aplicada (o descripción legible), valor calculado de cada héroe, y los puntos otorgados (5/3/1).
- AC-6.3 — Si la prueba aplica un bonus/penalización condicional, el motivo se muestra al usuario ("+5 por ir último en la general", "−1 por no quedar 1.º en la prueba anterior", etc.).
- AC-6.4 — El cálculo es determinista: misma selección → mismo resultado, sin aleatoriedad oculta (a confirmar en §6 para empates).

#### US-7 — Ver la clasificación final
**Como** organizador, **quiero** ver el podio final con Oro, Plata y Bronce, **para** declarar al ganador.

**Acceptance:**
- AC-7.1 — La pantalla final muestra un podio con los 3 héroes ordenados por puntos descendentes, usando los colores funcionales `gold` / `silver` / `bronze` (`constitution.md` §6.2).
- AC-7.2 — El encabezado: eyebrow "PENTATLÓN CERRADO", título "Clasificación final", subtítulo con "5 pruebas disputadas · 3 héroes en el podio · {oroPts} / {plataPts} / {broncePts} pts".
- AC-7.3 — Cada bloque del podio muestra: rango (1.º/2.º/3.º), nombre del héroe, badge "ORO/PLATA/BRONCE · N PTS" y la puntuación grande en JetBrains Mono con `tabular-nums`.
- AC-7.4 — Bajo el podio: CTA "Simular de nuevo →" que reinicia el flujo con la misma selección o vuelve a la pantalla de selección (a definir en §6).
- AC-7.5 — La pantalla es navegable con teclado; los colores de medalla mantienen ≥ AA con el texto sobreimpreso.

---

## 5. Non-functional requirements

- **NFR-1 — Idioma:** toda la UI en español; `<html lang="es">`.
- **NFR-2 — Diseño:** consume los tokens del tema Tailwind definido en `constitution.md` §6.1. Sin valores hardcoded de color/tipografía.
- **NFR-3 — Responsive:** mobile-first; sin scroll horizontal en móvil; targets táctiles ≥ 44 px.
- **NFR-4 — Accesibilidad:** WCAG AA en contraste, navegación de teclado completa, focus visible, formularios etiquetados.
- **NFR-5 — Rendimiento:** LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1 en build de producción (mid-tier mobile).
- **NFR-6 — Seguridad:** API key vía variable de entorno; nunca commiteada ni logueada (`constitution.md` §7).
- **NFR-7 — Determinismo:** la simulación es función pura de la selección + reglas + política de empates; sin aleatoriedad.
- **NFR-8 — Testing:** Vitest para lógica/composables (composables siempre vía `renderComposable`); Playwright para los caminos críticos: (a) crear un héroe; (b) correr una simulación de 3 héroes hasta la clasificación final.
- **NFR-9 — Manejo de errores:** todos los fallos de red/API muestran mensaje en español accionable; nunca un alert nativo crudo.
- **NFR-10 — Estado de carga:** toda llamada de red tiene estado de carga visible que no provoca CLS.

---

## 6. Resolved decisions (clarification pass closed)

All questions below were resolved in the clarification pass. Decisions are binding for `plan.md` and implementation.

### Roster & forms

1. **Nombre — longitud.** Min **2**, max **40** caracteres. Sin emojis.
2. **Imagen — tamaño.** Máximo **200 KB** del archivo original (PNG/JPEG), antes de base64; rechazo client-side si excede.
3. **Nombre — charset.** Letras Unicode (incluye acentos, ñ) + dígitos + espacio + `.'-`. Rechazo de control chars y emojis.
4. **Confirmación post-acción.** Toast en esquina inferior, ≤ 3 s, dismissible, anunciado vía `role="status"`.
5. **Estados vacíos.** Distintos por contexto:
   - Roster vacío: "Aún no hay héroes inscritos".
   - Simulador con < 3: "Necesitas al menos 3 héroes para simular un pentatlón. Llevas {N}/3."

### Pentatlón — reglas y empates

6. **Empate en una prueba (reparto 5/3/1) — Opción B.** Promedio de los puestos empatados. Dos primeros empatados → (5+3)/2 = **4** cada uno, tercero recibe **1**. Tres empatados → (5+3+1)/3 ≈ **3** cada uno. Segundo y tercero empatados → primero recibe **5**, los dos empatados (3+1)/2 = **2** cada uno.
7. **"Quedó 1.º en la prueba anterior" (Evento 4) bajo empate.** Todos los empatados en el valor máximo cumplen la condición → todos reciben **+10**. Quien NO está empatado en el máximo recibe **−1**.
8. **"Va último en la general acumulada" (Evento 3) bajo empate.** Todos los empatados en la última posición reciben el **+5**. Si los 3 están empatados, los 3 lo reciben.
9. **"Ha ganado al menos 2 pruebas hasta ahora" (Evento 5) bajo empate.** Empatar en el valor máximo de una prueba **cuenta como victoria** a efectos del conteo.
10. **General "hasta ahora" en Evento 3.** Suma de puntos de las pruebas **1 y 2**.
11. **Empate en la clasificación FINAL — Opción B (desempate determinista).** Orden de desempate: (a) mayor número de pruebas ganadas (incluyendo victorias compartidas por empate, por consistencia con la regla 9); (b) mayor valor calculado en la última prueba (Prueba 5); (c) orden alfabético del nombre (locale `es`, case-insensitive). El podio siempre tiene 3 ocupantes distintos.
12. **Valores negativos del evento.** Permitidos. Sin clamping. La asignación de puntos se hace por orden descendente del valor.

### Simulador — UX

13. **Ritmo — paso a paso.** Cada prueba se muestra una a una con CTA "Siguiente prueba →". Tras la Prueba 5, CTA cambia a "Ver clasificación →". Respeta `prefers-reduced-motion`.
14. **"Simular de nuevo" (AC-7.4).** Vuelve a la pantalla de selección (la simulación es determinista, re-jugar sería idéntico).
15. **Histórico de simulaciones.** No se persiste. Fuera de alcance.

### Misc

16. **Tema oscuro.** Fuera de alcance. Tokens dark quedan en el theme sin toggle ni activación.
17. **Rutas.** `/heroes` (roster), `/pentatlon` (simulador), `/` → redirige a `/heroes`.
18. **API key.** Variable de entorno **`VITE_PENTATHLON_API_KEY`**. El desarrollador genera la key una vez vía curl/Postman contra `POST /apikeys` y la pega en `.env.local`. El cliente nunca llama a `POST /apikeys`.

---

## 7. Out of scope

- Autenticación de usuario (más allá del API key).
- Persistencia del histórico de simulaciones.
- Internacionalización (UI sólo en español).
- Modo oscuro activable por el usuario.
- Reordenar manualmente los heroes en el plantel.
- Avatares generados / placeholders automáticos: el usuario aporta la imagen 128×128.
