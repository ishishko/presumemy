# G5.8 — `features/public/PublicPresupuestoView.vue`

| | |
|---|---|
| **Ruta** | `web/src/features/public/PublicPresupuestoView.vue` |
| **Grupo / orden** | G5 (vistas) · 8º |
| **LOC actuales** | 208 |
| **Tipo** | migrar |
| **Dependencias** | G0; G4.3 (`PresupuestoDoc`); G3.1 (`BaseButton`) |
| **Consumidores** | ruta pública `/p/:token` (también la renderiza **Puppeteer** para el PDF) |

## Estado actual
Vista pública (sin auth) que hace `ofetch` directo al endpoint público, mapea el DTO a `PresupuestoDocData` y renderiza `PresupuestoDoc`. Maneja loading/notFound, modo PDF (`?pdf=1`), botón imprimir. Tiene `<style scoped>` (page, toolbar, state, spinner) **y un `<style>` global** con reglas de impresión/PDF que apuntan a `.preview-doc` (`@page`, `@media print`, `.pdf-mode .preview-doc`).

## Objetivo
Migrar estilos a Tailwind preservando **fielmente** el render para PDF/impresión. Mantener el dato del DTO. Coordinar con `PresupuestoDoc` (G4.3) para no romper los selectores de impresión.

## Plan de acción paso a paso
1. **(DIP — OBLIGATORIO rev.1)** Extraer el fetch a `services/public.ts` (`fetchPublicPresupuesto(token)`); la vista no usa `ofetch` crudo. Motivo: **consistencia + testabilidad** (no es purismo DIP — la ruta es pública y liviana, y el service también lo es). Mantiene la velocidad para Puppeteer.
2. **(Tailwind)** Migrar `<style scoped>` (page, toolbar, public-state, spinner) a utilidades; spinner con `animate-spin`. Botón imprimir → `BaseButton variant="secondary"`.
3. **(⚠️ PDF/print)** El bloque `<style>` global apunta a `.preview-doc` (clase de `PresupuestoDoc`). Al migrar `PresupuestoDoc` a Tailwind, esa clase puede desaparecer. **Acción:** mantener un hook estable — dejar `class="preview-doc"` en la raíz de `PresupuestoDoc` como ancla de impresión, **o** mover las reglas `@page`/`@media print`/`pdf-mode` a apuntar a un atributo/clase que `PresupuestoDoc` conserve. Documentar la decisión y **probar la generación de PDF** tras migrar.
4. **(C6)** `@page { size:A4; margin:14mm }` y `@media print` se conservan (no expresables en utilidades) en `<style>` global o `@layer`.

## Criterios de aceptación
- `vue-tsc` ok; loading/notFound/PDF-mode funcionan.
- **El PDF de Puppeteer y la impresión del navegador salen idénticos** (prueba real, no solo visual en pantalla).
- Sin `ofetch` crudo si se extrajo el service.

## Riesgos / notas
- **Riesgo alto en PDF:** la migración de `PresupuestoDoc` puede romper los selectores de impresión. Coordinar G4.3 ↔ G5.8 y validar el PDF end-to-end (gotcha de Puppeteer en WSL documentado en memoria del proyecto). **(rev.1)** Este es el **"Checkpoint PDF"** del índice: ejecutarlo tras G4.3 y **antes** de migrar esta vista; no avanzar a G6 sin PDF verificado.
- No inicializa auth (meta `public`); mantener.
