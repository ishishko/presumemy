# G5.7 — `features/auth/LoginView.vue`

> **Ubicación (modular, rev.2):** sale de `features/` → `modules/auth/LoginPage.vue` (es una pantalla, no una feature).

| | |
|---|---|
| **Ruta** | `web/src/features/auth/LoginView.vue` |
| **Grupo / orden** | G5 (vistas) · 7º |
| **LOC actuales** | 386 (la mayoría `<style scoped>`) |
| **Tipo** | migrar |
| **Dependencias** | G0; G3.1 (`BaseButton`) opcional |
| **Consumidores** | ruta `/login` (bare, sin shell) |

## Estado actual
Card glassmorphism centrada con blobs de fondo, logo, form email/password con inputs-con-ícono, botón premium con spinner/arrow, footer. **Casi todo el archivo es `<style scoped>`** (≈280 líneas): gradientes, `backdrop-filter`, animación `card-appear`, `spin`, hover de botón/arrow, y un bloque `@media (prefers-color-scheme: dark)`. Usa tokens + algunos hex crudos (`#276061`, `rgba(170,59,255,...)`).

## Objetivo
Login con la misma estética migrada a Tailwind. Animaciones puntuales como excepción C6. Inputs/botón pueden reusar primitivos o quedar custom-Tailwind (es una pantalla única).

## Plan de acción paso a paso
1. **(Tailwind)** Migrar layout y estética a utilidades: `login-wrap` (gradiente radial → `bg-[radial-gradient(...)]` o capa), blobs (`absolute rounded-full blur-[100px]`), card (`bg-white/82 backdrop-blur-xl border rounded-[24px] shadow-... p-10 max-w-[390px]`).
2. **(C6 excepción)** Conservar `@keyframes card-appear`/`spin` en `<style scoped>` mínimo (o `animate-[...]` de Tailwind v4). El spinner del `Loader2` puede usar `animate-spin`.
3. **(dark mode — DECIDIDO rev.1: eliminar)** El bloque `@media (prefers-color-scheme: dark)` es **dead code de facto**: ninguna otra pantalla soporta dark ni hay estrategia global. Se **elimina** en la migración (no se reescribe a `dark:`). Si en el futuro se decide soportar dark, será una iniciativa propia y global.
4. **(reuso opcional)** Inputs con ícono: evaluar `FloatingField` (tiene `prefix`, no ícono izquierdo) — probablemente se mantiene custom (input + ícono absoluto) en Tailwind. Botón submit: puede ser `BaseButton variant="primary"` + contenido con spinner/arrow, o quedar custom por el shadow/gradiente especial. Decidir al implementar; preferir `BaseButton` si cubre el estilo.
5. **(DS)** Reemplazar hex crudos por tokens donde exista equivalente (`#276061` ≈ hover de teal → `teal-700` o `brightness`).

## Criterios de aceptación
- `vue-tsc` ok; login funciona (submit, error, loading).
- Glassmorphism, blobs, animación de entrada y hover del botón idénticos.
- Foco accesible en inputs (ring teal) conservado.

## Riesgos / notas
- **(rev.1) Dark mode eliminado:** se quita el bloque dark de esta pantalla (era la única con dark). Confirmar con producto que no se espera dark mode en login.
- Pantalla aislada (ruta bare) → bajo riesgo de afectar otras vistas; buena para validar gradientes/animaciones en Tailwind.
