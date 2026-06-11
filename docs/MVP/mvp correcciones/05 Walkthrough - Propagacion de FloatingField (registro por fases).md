# Walkthrough — Propagación de FloatingField a toda la app (V5)

Este documento registra, fase por fase, el trabajo efectivamente realizado al propagar la estética y funcionalidad de `FloatingField` (input con *floating label* animado tipo "wave", sombras de estado celeste/verde/rojo, focus violeta y label pill) al resto de los formularios de la aplicación, según el plan `05 Plan de implementacion - Propagacion de FloatingField a toda la app`.

Se agrega una sección por cada fase a medida que se completa e implementa. Al momento de crear este registro, la planificación está cerrada y la implementación aún no comenzó; las secciones siguientes se irán completando con el detalle de las modificaciones, la verificación visual/manual y el aseguramiento de tipos de cada fase.

---

## Fase 0 — Fundaciones

Implementamos el núcleo de las fundaciones que habilitan reutilizar la estética FloatingField sin duplicar CSS.

### 1. Estilos `.ff-*` promovidos a globales
- Movimos todas las reglas del campo flotante (`.ff-group`, `.ff-control`, `.ff-label`, `.ff-char`, rings de estado, deshabilitado, etc.) desde el `<style scoped>` de `FloatingField.vue` hacia `web/src/assets/css/components.css`, en una sección propia ("Floating field — campos con label flotante animado").
- `FloatingField.vue` quedó sin estilos scoped: ahora consume las clases globales. El resultado visual del editor de presupuestos es idéntico (refactor puro).
- Se agregaron además las clases de la variante select: `.ff-select` (caja sin flecha nativa) y `.ff-chevron` (chevron propio).

### 2. Nuevo componente `FloatingSelect.vue`
- `web/src/components/ui/FloatingSelect.vue`: hermano de FloatingField para `<select>` nativo. Reutiliza las clases globales `.ff-*`, con label "wave", sombras por estado (celeste/verde/rojo), focus violeta y label pill.
- El select siempre está en modo flotado (siempre muestra un valor o el placeholder). Estado: `vacío` = sin selección real (`0`/`''`/`null`, típicamente la opción placeholder), `válido` = opción real elegida, `inválido` = `invalid` forzado o requerido vacío tras blur.
- Las opciones se pasan por slot (`<option>`). Soporta el modificador `v-model.number` vía `modelModifiers` para los selects numéricos (ej. `categoriaId`).

### 3. Controles secundarios — decisión
- `ToggleSwitch`, `CheckRow` y `SegmentedControl` se extraerán **al primer uso real durante la Fase 1**, para construirlos contra los requisitos concretos de cada pantalla y poder verificarlos de inmediato (menor riesgo que crearlos a ciegas). No se tocó el segmented ya afinado del editor de presupuestos.

### Verificación
- `npx vue-tsc -b` → cero errores.
- Verificación visual del editor de presupuestos (sin cambios esperados) a cargo del usuario; `FloatingSelect` se valida en runtime al integrarlo en la Fase 1 (primer drawer con select).

### Archivos
- [MODIFY] `web/src/assets/css/components.css` (estilos `.ff-*` globales + variante select)
- [MODIFY] `web/src/components/ui/FloatingField.vue` (sin estilos scoped)
- [NEW] `web/src/components/ui/FloatingSelect.vue`
