# G6.1 — `components/drawers/ClienteDrawer.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/drawers/ClienteDrawer.vue` |
| **Grupo / orden** | G6 (pesados) · 1º |
| **LOC actuales** | 506 (≈195 de `<style scoped>`) |
| **Tipo** | migrar (+ extracción) |
| **Dependencias** | G2.8 (`DrawerShell`), G2.4/2.5 (`FloatingField`/`FloatingSelect`), G3.1 (`BaseButton`), G2.6 (`ConfirmDialog`), G1.3 (store), nuevo `ContactosEditor` |
| **Consumidores** | `ClientesView` (G5.2) |

## Estado actual
Drawer de alta/edición de cliente: nombre, domicilio, **editor de contactos (hasta 3, uno principal)**, notas. Valida con `clienteSchema` (zod). Smells:
- **Reimplementa el shell de drawer inline** (`.drawer-container/scrim/panel/head/body/foot` + transición, líneas 313-505) en vez de usar `DrawerShell` (G2.8) → duplicación grande.
- `import { post, put }` directo (**DIP**) — debería delegar en `useClientesStore`.
- `dirty` computado a mano (~35 líneas) en vez de `useDirty`.
- Contactos con `select`/`input`/`.contacto-*` raw (no usa `FloatingSelect`); radio principal custom; botón add con borde dashed.
- Usa `FloatingField` para los campos de texto (bien), pero mezcla con `.field`/`.fd-row`/`.fd-section-label` globales.

## Objetivo
Drawer delgado montado sobre `DrawerShell`, con el editor de contactos extraído, datos vía store (DIP), dirty con `useDirty`, todo Tailwind.

## Plan de acción paso a paso
1. **(DRY)** Reescribir usando `<DrawerShell :open title eyebrow @close>` con slots `body`/`foot`. Borra ~195 líneas de scoped duplicado.
2. **(SRP)** Extraer `components/clientes/ContactosEditor.vue` (v-model de `contactos[]`; maneja add/remove/setPrincipal, límite 3, regla "siempre uno principal"). Reutiliza `FloatingSelect` para el canal y `FloatingField` para el valor.
3. **(DIP)** Mover `post`/`put` al store (`store.create`/`store.update`); el drawer llama al store y emite `saved`.
4. **(dirty)** Reemplazar el `dirty` manual por `useDirty` (snapshot del payload).
5. **(Tailwind)** `.fd-row`/`.fd-section-label`/`.contacto-*`/`.add-contacto-btn` → utilidades. Radio principal y botón dashed con Tailwind.
6. **(reuso)** Botones foot → `BaseButton`. `ConfirmDialog` de salida sin guardar se mantiene.

## Componentes que crea/consume
Crea `ContactosEditor.vue`. Consume `DrawerShell`, `FloatingField`, `FloatingSelect`, `BaseButton`, `ConfirmDialog`, store, `useDirty`.

## Criterios de aceptación
- `vue-tsc` ok; alta/edición, validación zod, contactos (límite 3, principal), dirty + confirm-exit funcionan igual.
- Usa `DrawerShell` (sin shell duplicado); sin `services/api` directo.

## Riesgos / notas
- `ContactosEditor` debe servir también si otros forms usan contactos a futuro; mantener API por v-model limpia.
- `clienteSchema` (zod) se conserva; la validación puede quedar en el drawer o moverse al store (preferible en el drawer para feedback inmediato).
- `defineExpose({ loadCliente })` — revisar si algún padre lo usa antes de quitarlo.
