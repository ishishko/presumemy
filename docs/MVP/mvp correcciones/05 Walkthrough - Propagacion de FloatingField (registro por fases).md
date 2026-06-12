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

---

## Fase 1 — Migración de campos directos

Migramos los formularios a `FloatingField` / `FloatingSelect`, archivo por archivo, conservando los controles especiales de cada pantalla. Se mantuvo el criterio de no degradar UX: lo que no es un campo estándar (switches, segmented, tablas editables, montos grandes coloreados, nombres inline, filas compactas de repetidores) se dejó como estaba.

### Extensión previa de FloatingField
- Se agregó soporte de `v-model.number` (vía `modelModifiers`) y se amplió `modelValue` a `string | number`, para los campos numéricos que alimentan cálculos (hojas, valores, stocks, costos, etc.).

### Archivos migrados
- **ImprentaDrawer**: fecha, presupuesto, temática, hojas, tipo de hoja, valores ($), método de pago (select). Se dejó el checkbox "pagado".
- **MovimientoDrawer**: fecha, cuenta y tipo (selects), detalle, nro de factura, presupuesto. Se dejó el bloque especial de Valor (toggle Ingreso/Egreso + monto grande coloreado).
- **ClienteDrawer**: nombre (con error de zod cableado a `invalid`/`required`), domicilio y notas. Se dejó la fila compacta de contactos (select + input + radio).
- **AjustesView**: nombre del negocio, moneda, domicilio, canal y valor de contacto, y los campos de Cuenta (nombre/email, readonly). Se dejaron switches, tabla de socios y "días de espera" (con su pill). Se eliminó el dot de color del canal (al pasar a FloatingSelect).
- **InsumoDetalle**: categoría (select), unidad, stock actual/mínimo y costos, manteniendo las pills de unidad al lado del campo. Se dejó el nombre inline, el costo unitario readonly, el switch, la tabla de proveedores y la card de notas.
- **ProductoDetalle**: URL de imagen, categoría (select), medida y descripción. Se dejó el nombre inline, los switches, toda la card de Precios (segmented + montos) y el BOM.

### Pendiente
- **LoginView**: por decisión del usuario, se deja con su estilo propio (inputs con ícono Mail/Lock); no se migra.
- Controles secundarios compartidos (`ToggleSwitch`, `CheckRow`, `SegmentedControl`): se extraerán cuando se aborden esos controles de forma unificada (no fue necesario para la migración de campos directos).

### Verificación
- `npx vue-tsc -b` → cero errores tras cada archivo.
- Verificación visual de cada drawer/overlay/vista a cargo del usuario.

### Archivos
- [MODIFY] `web/src/components/ui/FloatingField.vue` (soporte `v-model.number`)
- [MODIFY] `web/src/components/drawers/ImprentaDrawer.vue`
- [MODIFY] `web/src/components/drawers/MovimientoDrawer.vue`
- [MODIFY] `web/src/components/drawers/ClienteDrawer.vue`
- [MODIFY] `web/src/views/AjustesView.vue`
- [MODIFY] `web/src/components/overlays/InsumoDetalle.vue`
- [MODIFY] `web/src/components/overlays/ProductoDetalle.vue`

---

## Fase 2 — Validación coherente

Cableamos `required` / `invalid` en los campos clave para que las sombras de estado (verde/rojo) reflejen la validez real, y agregamos reglas mínimas de guardado donde no había schema.

### Cambios por archivo
- **ImprentaDrawer**: `temática / cliente` ahora es `required`; los valores monetarios marcan `invalid` si son negativos. Se agregó un `validate()` que bloquea el guardado si falta la temática o hay valores negativos (con toast).
- **MovimientoDrawer**: `validate()` que exige que el valor sea mayor a 0 antes de guardar (con toast).
- **AjustesView**: `nombre del negocio` marcado como `required`.
- **InsumoDetalle**: `categoría` y `unidad de medida` marcadas como `required` (la categoría en `0` queda en rojo tras interactuar).
- **ProductoDetalle**: `categoría` marcada como `required`.
- **ClienteDrawer / PresupuestoEditor**: ya tenían la validación zod cableada a `invalid`/`required` desde fases anteriores (sin cambios).

### Verificación
- `npx vue-tsc -b` → cero errores.
- Manual: intentar guardar una orden de imprenta sin temática o un movimiento con valor 0 → se bloquea con toast; los campos requeridos vacíos se ponen en rojo al perder foco.

### Archivos
- [MODIFY] `web/src/components/drawers/ImprentaDrawer.vue`
- [MODIFY] `web/src/components/drawers/MovimientoDrawer.vue`
- [MODIFY] `web/src/views/AjustesView.vue`
- [MODIFY] `web/src/components/overlays/InsumoDetalle.vue`
- [MODIFY] `web/src/components/overlays/ProductoDetalle.vue`

---

## Fase 3 — Controles secundarios compartidos (parte 1: switches y segmented)

Unificamos los controles que estaban duplicados con clases distintas (`id-switch`, `aj-switch`, `pd-switch`, `segmented` inline) en componentes reutilizables, adoptando el foco violeta del DS. **Las tablas se trabajan aparte (a detalle)**, así que los controles que viven dentro de tablas se dejaron sin tocar.

### Componentes nuevos
- **`ToggleSwitch.vue`**: switch accesible (`<button role="switch">`, `aria-checked`, teclado Space/Enter, focus-visible violeta). Estilos globales `.toggle-switch` en `components.css` (track + thumb, on = teal).
- **`SegmentedControl.vue`**: extracción del segmented accesible del editor de presupuestos (`radiogroup` + `seg-btn`, navegación con flechas, `disabled`, `aria-label`/`aria-labelledby`). Reutiliza las clases globales `.segmented`/`.seg-btn`.

### Aplicación
- **ToggleSwitch**: `AjustesView` (cancelación automática), `InsumoDetalle` (insumo activo), `ProductoDetalle` (producto activo, costo por receta). El switch de la **tabla de socios** (Ajustes) y los radios de proveedores quedan para el pase de tablas.
- **SegmentedControl**: `ProductoDetalle` (tipo de ganancia) y `PresupuestoEditor` (método de envío Retira/Envío, reemplazo 1:1 conservando el layout afinado de Entrega y eliminando el `onEnvioKeydown` local).

### Mejora de contraste del segmented
A pedido del usuario (la opción elegida casi no se distinguía), se reforzó el estado seleccionado y el foco en `.seg-btn` (`components.css`):
- **Seleccionado**: pill **violeta llena** (`--violet-700`) con texto blanco en negrita y `shadow-2` (antes era una pill blanca sobre track gris, muy sutil).
- **Foco**: outline **teal sólido inset** (`outline: 2px solid var(--teal-500); outline-offset: -2px`), visible tanto sobre la pill violeta como sobre el track.
- Aplica a ambos segmenteds (Producto y Entrega) sin tocar markup.

### Pendiente de la Fase 3
- Tablas editables (cell-input y sus controles: socios, BOM, proveedores, líneas) → pase a detalle aparte.
- `CheckRow` (checkboxes de Imprenta/Presupuesto) y radios (`esPrincipal`) → opcional, a unificar más adelante.
- Quedan reglas CSS muertas (`.id-switch`, `.pd-switch`) que se pueden limpiar en una pasada posterior.

### Verificación
- `npx vue-tsc -b` → cero errores.
- Manual: los switches togglean con click y teclado (Space/Enter) y muestran foco violeta; el segmented de Producto y el de Entrega funcionan igual que antes (flechas incluidas).

### Archivos
- [NEW] `web/src/components/ui/ToggleSwitch.vue`
- [NEW] `web/src/components/ui/SegmentedControl.vue`
- [MODIFY] `web/src/assets/css/components.css` (estilos `.toggle-switch`)
- [MODIFY] `web/src/views/AjustesView.vue`
- [MODIFY] `web/src/components/overlays/InsumoDetalle.vue`
- [MODIFY] `web/src/components/overlays/ProductoDetalle.vue`
- [MODIFY] `web/src/components/editors/PresupuestoEditor.vue`
