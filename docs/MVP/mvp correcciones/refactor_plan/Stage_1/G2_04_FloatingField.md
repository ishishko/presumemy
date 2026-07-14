# G2.4 — `shared/ui/FloatingField.vue`

> **Ubicación (modular, rev.2):** destino `shared/ui/FloatingField.vue` · import `@/shared/ui`.

| | |
|---|---|
| **Ruta destino** | `web/src/shared/ui/FloatingField.vue` |
| **Grupo / orden** | G2 (primitivos) · 4º |
| **LOC actuales** | 130 |
| **Tipo** | migrar (con excepción de animación) |
| **Dependencias** | G0; coordinar con G2.5 (`FloatingSelect`, comparte estilos) |
| **Consumidores** | casi todos los forms: drawers, overlays, editor, login, ajustes |

## Estado actual
Input/textarea con **label flotante animado "wave"** (cada carácter sube escalonado vía `--index`). Lógica rica: estados `focus/invalid/valid/empty` (computed `state`), `floated`, `hasValue`, soporte `prefix` ($), `type` date/number/text, `multiline`, `modelModifiers.number`, a11y (`aria-invalid`, `aria-describedby`). Estilos en `components.css` (`.ff-group`, `.ff-control`, `.ff-label`, `.ff-char`, rings de estado ~3231-3382) + clases de estado `ff-focus/ff-valid/ff-invalid/ff-empty`.

## Objetivo
Mantener intactas la API y la lógica de estado/a11y. Migrar a Tailwind **todo menos la animación escalonada del label**, que es la **excepción C6** (queda como `<style scoped>` mínimo o `@utility`).

## Plan de acción paso a paso
1. **(análisis)** Leer en `components.css` el bloque `.ff-*` (≈3231-3382) para separar: (a) layout/colores/bordes/rings → migrables a Tailwind; (b) la animación `wave` del label (`transform`/`transition` por `--index`) → irreductible.
2. **(Tailwind)** Migrar el control (`.ff-control`): borde, `rounded-md`, padding, `text-14`, focus ring teal (`focus:shadow-[var(--focus-ring)]` o utilidad `focus:ring`). Rings de estado por **mapa** (`ff-focus`→violeta, `ff-invalid`→coral, `ff-valid`→verde, `ff-empty`→teal tenue) traducidos a clases.
3. **(C6 excepción)** El label flotante con caracteres escalonados (`.ff-label`, `.ff-char`, `--index`, posición flotada) se conserva en `<style scoped>` reducido. Documentar por qué (animación por-carácter no expresable en utilidades).
4. **(Vue)** Conservar todos los computed (`state`, `floated`, `hasValue`, `effectiveAlwaysFloat`, `placeholderShown`), props y `modelModifiers`. Opcional: `defineModel` con modifiers (evaluar; hoy maneja `.number` manual — mantener si `defineModel` complica).
5. **(SRP/coordinación)** La lógica de `state` es idéntica a `FloatingSelect` → extraer a un composable `useFieldState(props)` compartido (G2.5 lo reutiliza). Solo si reduce duplicación real (Regla de Tres: 2 usos claros + futuros).

## Antes → Después
- **Migrado:** `.ff-control` → utilidades; rings de estado → mapa de clases.
- **Conservado (scoped):** `.ff-label`/`.ff-char` + keyframes/transición wave.

## Mapeo Tailwind (parcial)
| Antes | Después |
|---|---|
| `.ff-control` | `w-full rounded-md border border-border bg-surface px-3 py-2 text-14 outline-none` |
| `.ff-group.ff-focus .ff-control` | `focus-within` → ring violeta (mapa) |
| `.ff-invalid` ring | `ring-coral` (clase de estado) |
| `.ff-label`, `.ff-char` (wave) | **scoped** (excepción C6) |

## Criterios de aceptación
- `vue-tsc` ok; v-model, `.number`, `prefix`, `multiline`, `type=date` funcionan igual.
- Animación wave del label idéntica; rings de estado por color correctos.
- A11y (`aria-invalid`, `aria-describedby`, `required`) intacta.

## Riesgos / notas
- **Componente de alto riesgo por reuso masivo**: una regresión aquí afecta todos los forms. Migrar con cuidado y comparar foco/estados uno por uno.
- Decidir el composable `useFieldState` junto con G2.5 para no duplicar el cálculo de `state`.
