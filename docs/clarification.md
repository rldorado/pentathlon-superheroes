# Clarification — Pentatlón de Superhéroes

> Decisions made during the clarification pass on `specification.md`. Binding for `plan.md`, `tasks.md`, and implementation. Mirrored in `specification.md` §6 for narrative context; this file is the canonical, standalone decision log.

Format: `Q-N` = question; `D-N` = decision; `R-N` = rationale.

---

## Roster & forms

### Q-1 — Nombre, longitud

**D-1.** Min 2, max 40 characters. No emojis.
**R-1.** Avoids degenerate single-char names and unreadable overlong names in cards. Emojis would break the typographic system.

### Q-2 — Imagen, tamaño máximo

**D-2.** ≤ 200 KB del archivo original (PNG/JPEG), antes de base64. Rechazo client-side si excede.
**R-2.** 128×128 PNG/JPEG normally fits well under this; cap prevents abusive uploads and bloated API payloads.

### Q-3 — Nombre, charset

**D-3.** Letras Unicode (incluye acentos, ñ) + dígitos + espacio + `.'-`. Rechazo de control chars y emojis.
**R-3.** Accommodates Spanish names while preventing visual sabotage.

### Q-4 — Confirmación post-acción

**D-4.** Toast en esquina inferior, ≤ 3 s, dismissible, anunciado vía `role="status"`.
**R-4.** Non-intrusive, screen-reader friendly, doesn't shift layout.

### Q-5 — Estados vacíos

**D-5.** Distintos por contexto:

- Roster vacío: "Aún no hay héroes inscritos".
- Simulador con < 3: "Necesitas al menos 3 héroes para simular un pentatlón. Llevas {N}/3."

---

## Pentatlón — reglas y empates

### Q-6 — Empate de valor dentro de una prueba (reparto 5/3/1)

**D-6. Option B: promedio de los puestos empatados.**

| Tie shape               | Reparto   |
| ----------------------- | --------- |
| Sin empates             | 5 · 3 · 1 |
| 1.º = 2.º, 3.º distinto | 4 · 4 · 1 |
| 1.º distinto, 2.º = 3.º | 5 · 2 · 2 |
| Los 3 empatados         | 3 · 3 · 3 |

**R-6.** Matches the spirit of fair-share scoring; deterministic; well-defined; trivial to test.

### Q-7 — "Quedó 1.º en la prueba anterior" (Evento 4) bajo empate

**D-7.** Todos los empatados en el valor máximo de la Prueba 3 cumplen la condición → todos reciben **+10**. Quien NO está empatado en el máximo recibe **−1**.
**R-7.** Consistent with D-9 — "winning" tolerates ties.

### Q-8 — "Va último en la general acumulada" (Evento 3) bajo empate

**D-8.** Todos los empatados en la última posición tras pruebas 1+2 reciben el **+5**. Si los 3 están empatados, los 3 lo reciben.
**R-8.** Symmetric with D-7. Degenerate but consistent.

### Q-9 — "Ha ganado al menos 2 pruebas hasta ahora" (Evento 5) bajo empate

**D-9.** Empate en el valor máximo cuenta como victoria a efectos del conteo de "pruebas ganadas".
**R-9.** Consistent definition of "ganar una prueba" across the whole engine.

### Q-10 — General "hasta ahora" en Evento 3

**D-10.** Suma de puntos de las Pruebas 1 y 2.
**R-10.** Only events strictly before event 3 contribute.

### Q-11 — Empate en la clasificación FINAL (oro/plata/bronce)

**D-11. Option B: desempate determinista.** Orden:

1. Mayor número de pruebas ganadas (definición de D-9, incluye victorias compartidas).
2. Mayor valor calculado en la Prueba 5 (la última).
3. Orden alfabético del nombre (locale `es`, case-insensitive).

El podio siempre tiene 3 ocupantes distintos.
**R-11.** Podium UI has 3 distinct slots; deterministic order; reads cleanly.

### Q-12 — Valores negativos del evento

**D-12.** Permitidos. Sin clamping. Asignación 5/3/1 por orden descendente del valor real.
**R-12.** Prueba 1 (`(fuerza × 4) − (peso × 2)`) puede ser negativo legítimamente. Clamping rompería el orden.

---

## Simulador — UX

### Q-13 — Ritmo de la simulación

**D-13.** Paso a paso. Cada prueba en su propia vista con CTA "Siguiente prueba →". Tras la Prueba 5 la CTA pasa a "Ver clasificación →". Respeta `prefers-reduced-motion`.
**R-13.** Dramatiza la secuencia y deja claro al usuario que las pruebas 3/4/5 dependen de las anteriores.

### Q-14 — "Simular de nuevo" (AC-7.4)

**D-14.** Vuelve a la pantalla de selección.
**R-14.** La simulación es determinista; re-jugar con los mismos 3 daría el mismo resultado.

### Q-15 — Histórico de simulaciones

**D-15.** No se persiste. Fuera de alcance.

---

## Misc

### Q-16 — Tema oscuro

**D-16.** Fuera de alcance. Tokens dark quedan en el theme sin toggle.

### Q-17 — Rutas

**D-17.** `/heroes` (roster), `/pentatlon` (simulador), `/` → redirige a `/heroes`.

### Q-18 — API key

**D-18.** Variable de entorno `VITE_PENTATHLON_API_KEY`. El desarrollador genera la key una vez vía `curl -X POST https://codetest-api.applivery.io/api-keys/ -H "Content-Type: application/json" -d '{}'` y pega el `id` en `.env.local`. El cliente nunca llama a `POST /api-keys/`.
**R-18.** Más seguro, evita exponer el endpoint de provisión desde el cliente, y mantiene la key fuera del bundle salvo en `.env.local` (gitignored).
