# G0.0 — Estructura modular (scaffolding) — corre PRIMERO

> Antecede a todo (incluido G0.1). Crea el esqueleto `app/ shared/ modules/` y reubica el arranque. Arquitectura completa en `00_Arquitectura_Modular.md`.

| | |
|---|---|
| **Ubicación** | crea `app/`, `shared/`, `modules/` |
| **Grupo / orden** | G0 (fundación) · 0º (antes de G0.1) |
| **Tipo** | crear estructura + mover arranque |
| **Dependencias** | ninguna |
| **Consumidores** | todo el proyecto |

## Estado actual
Estructura `package-by-layer`: `views/`, `components/{ui,layout,drawers,overlays,editors,presupuestos}/`, `stores/`, `services/`, `composables/`, `schemas/`, `utils/`, `assets/css/`, `types/`. El dominio está disperso (insumos en ≥3 carpetas).

## Objetivo
Esqueleto modular por dominio creado y arranque reubicado, listo para que cada Grupo escriba en su destino (Opción A).

## Plan de acción paso a paso
1. **Crear carpetas** vacías: `app/`, `app/{shell,state,styles}`, `shared/{ui,lib,api,config}`, `modules/{insumos,productos,clientes,presupuestos,finanzas,ajustes,dashboard,auth}/` (cada módulo con `components/` cuando aplique). **Nota:** no se crea `modules/categorias/`; las categorías viven en sus respectivos módulos de dominio.
2. **Mover arranque a `app/`:**
   - `src/main.ts` → `app/main.ts` (ajustar `index.html`/entry de Vite si referencia la ruta).
   - `src/App.vue` → `app/App.vue`.
   - `router/index.ts` → `app/router.ts`.
   - crear `app/pinia.ts` (setup de Pinia hoy implícito en `main.ts`).
3. **Singletons de orquestación a `app/state/`:** `composables/useEditorMode.ts` → `app/state/editorMode.ts`; `composables/useCreateTrigger.ts` → `app/state/createTrigger.ts`. **Nota:** estos singletons son estado global mutable (event-bus) sin reactividad propia (no usan `ref`/`reactive` de Vue). Se ubican en `app/state` porque son glue de orquestación entre el shell (`app/shell`) y los módulos; no son dominio ni UI reusable. (C15: `app` puede importar de todo; nadie de `modules`/`shared` importa de `app`.)
4. **Política de barrels (C14):** cada `modules/<x>/index.ts` exporta la API pública del módulo; `shared` se consume por segmento (`@/shared/ui`, `@/shared/lib`, `@/shared/api`).
5. **Alias:** confirmado que `@`→`./src` ya existe (vite+tsconfig); `@/app`, `@/modules/...`, `@/shared/...` resuelven sin config nueva. Opcional: agregar alias explícitos por claridad de review (no obligatorio).
6. **No mover todavía** el contenido de dominio (eso ocurre grupo por grupo, Opción A). Este paso solo crea el esqueleto y mueve el arranque.

## Criterios de aceptación
- `npm run dev` levanta con el entry en `app/main.ts`.
- `vue-tsc -b` sin errores tras mover arranque + singletons.
- Carpetas del esqueleto creadas; barrels vacíos donde corresponda.

## Riesgos / notas
- El entry de Vite/`index.html` apunta a `/src/main.ts`; actualizarlo a `/src/app/main.ts` (único punto frágil del movimiento de arranque).
- `useEditorMode`/`useCreateTrigger` son estado global mutable (deuda anotada en rev.1); se ubican en `app/state` sin refactorizar su naturaleza singleton ahora.
- Hacer este paso **antes** de G0.1 (tokens `@theme`), que ya escribe en `app/styles/main.css`.
