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

---

## Tablas — Pase a detalle (parte 1: tabla de líneas de Presupuesto)

Arrancamos el pase de tablas por la grilla de productos del editor de presupuestos, que tenía dos problemas detectados por el usuario.

### Foco doble
La fila activa mostraba su remarco violeta **y** la celda enfocada un fondo teal al mismo tiempo, dando la sensación de "dos focos". Además, al salir de la tabla con el mouse el resaltado de fila quedaba pegado, porque el `@blur` del contenedor no burbujea y nunca limpiaba `activeRow`.

- Dejamos el **borde violeta de la fila activa como único indicador** y alineamos el fondo de la celda enfocada al mismo violeta (`.cell-input:focus` pasó de `--teal-100` a `--violet-50`), para que lea como un solo foco cohesivo.
- Reemplazamos el manejo por `@focus`/`@blur` (que no burbujean) por un único `@focusout="onTableFocusout"` en el contenedor (`focusout` sí burbujea): limpia `activeRow` solo cuando el foco sale realmente de la tabla (`relatedTarget` fuera del contenedor). Se quitó el `tabindex="-1"` y los handlers `handleTableFocus`/`handleTableBlur`.

### Botón "Agregar línea"
Antes el botón dependía del estado `editing` (aparecía/desaparecía y se auto-agregaba una fila al entrar a la tabla), lo que lo hacía inestable.

- Eliminamos el estado `editing` y el auto-append. El botón **"Agregar línea" queda siempre visible** mientras la orden es editable (`v-if="isEditable"`).
- `handleAddLine` solo agrega la fila y enfoca su primer campo. Se quitó el hint inferior (`lines-hint`) y su CSS muerto.

### CSS duplicado y hover inconsistente
Al revisar a fondo por qué la fila "cambiaba de vista" al pasar el mouse, encontramos que **todo el bloque `.lines-spreadsheet` estaba duplicado**: idéntico en el global `components.css` y en el `<style scoped>` del editor. Las copias ya divergían (el foco de celda estaba en `--violet-50` en el scoped y en `--teal-100` en el global), y ganaba el scoped por el `[data-v-hash]` de Vue: editar un solo lugar daba resultados impredecibles.

- **Fuente única**: borramos el bloque `.lines-spreadsheet` del scoped y dejamos `components.css` como único dueño. En el editor solo quedan los estilos exclusivos (`.add-line-btn`, `.ed-totals`, etc.).
- Consolidamos el foco de celda en `--violet-50` en el global (coherente con el borde violeta de la fila activa).
- **Hover estable**: el `tbody tr:hover { background }` teñía toda la fila y, sumado al foco opaco de la celda, dejaba tonos disparejos. Lo eliminamos: la fila ya no cambia de fondo al pasar el mouse.
- **Único cambio en hover = el grip**: el ícono de arrastre pasa a estar oculto en reposo y aparece solo al hacer hover en la fila. La papelera dejó de ser reveal-on-hover y queda siempre visible (atenuada, coral al hover del propio botón).

### Fix del borde violeta que se borraba (opacity sobre el `<td>`)
El reveal del grip se hacía poniendo `opacity` sobre el `<td class="grip">` completo. Pero `opacity` afecta **todo** lo que renderiza ese td, incluido el `box-shadow` inset que dibuja el borde violeta de la fila activa en la primera celda (`tr.active td:first-child`). Resultado: con la fila activa pero sin hover, el grip td quedaba en `opacity: 0` y se borraba el segmento izquierdo del borde → se rompía la estética.

- Movimos la opacidad del `<td>` al **ícono SVG** del grip (`td.grip svg { opacity: 0 }` / `tr:hover td.grip svg { opacity: 0.85 }`). Así el td queda siempre opaco y su `box-shadow`/borde nunca se borra; solo el icono aparece/desaparece en hover.

### Detalle adicional
- Se ocultó el **chevron nativo del `<datalist>`** (`::-webkit-calendar-picker-indicator` / `::-webkit-list-button`) en los `cell-input`, que el navegador mostraba en hover/focus en la celda Producto. El autocompletado sigue funcionando.

### Verificación
- `npx vue-tsc -b` → cero errores.
- Manual: un solo foco visible al editar celdas; el resaltado de fila se limpia al hacer click fuera; el botón "Agregar línea" se mantiene estable; con la fila activa sin hover el borde violeta se ve completo en los 4 lados; al pasar el mouse por una fila solo asoma el ícono del grip, sin cambios de fondo ni chevron.

### Archivos
- [MODIFY] `web/src/components/editors/PresupuestoEditor.vue` (lógica + se quita el bloque `.lines-spreadsheet` duplicado del scoped)
- [MODIFY] `web/src/assets/css/components.css` (foco `--violet-50`, sin hover de fila, grip solo en hover, papelera siempre visible)

---

## Tablas — Pase a detalle (parte 1 · comportamiento de edición de la tabla de líneas)

Sobre la base ya estabilizada, le dimos a la tabla el comportamiento "vivo" de planilla. Todo vive en `PresupuestoEditor.vue`; Tab (navegación por celda) y `onOverlayKeydown` (Escape/Tab) no se tocaron.

### Cantidad automática al elegir producto
- `handleProductChange` ahora, además de completar el precio, pone `cantidad = 1` cuando se elige un producto real del catálogo y la celda de cantidad está vacía.

### Enter = navegación por fila
Sumamos un estado `cellDirty` (ref) que marca si la celda enfocada fue editada desde que recibió el foco: se resetea en `onCellFocus(id)` (que también setea `activeRow`) y se prende en cada input (`onCellInput` para cantidad/precio, y dentro de `handleProductChange` para producto).

`onCellEnter(id)` (cableado con `@keydown.enter.prevent` en las tres celdas) implementa:
- Celda **recién editada** (`cellDirty`) → confirma el cambio y se queda (resetea el flag); hace falta un segundo Enter para avanzar.
- Celda **no editada** → baja a la **primera celda de la fila siguiente** (`focusRowFirstCell`, que ubica la fila por un `data-id` agregado al `<tr>`).
- **Sin fila debajo**: si la fila actual tiene datos → crea una fila nueva y la enfoca (`handleAddLine`); si está vacía → saca el foco fuera de la tabla, al siguiente focusable de la página (`focusAfterTable`, vía `getFocusable`).

### Prune en blur
- `onTableFocusout`, al salir el foco realmente de la tabla, además de limpiar `activeRow`, elimina las filas vacías. Si no queda ninguna, deja una fila limpia (invariante ya usado en `reset`/`removeLine`).

### Vacío vs. inválido (feedback rojo)
Definimos dos helpers para distinguir estados de fila, ambos mirando los tres campos (producto, cantidad, precio):
- `isRowEmpty(l)` → fila sin ningún dato. Se usa para el prune y para decidir si Enter sale de la tabla. **Clave**: mira los tres campos, no solo el producto; así una fila con cantidad/precio cargados pero sin producto **no** se considera vacía (antes salía de la tabla por error al hacer Enter).
- `isRowInvalid(l)` → fila con algún dato pero incompleta (sin producto, o sin una cantidad > 0). Reemplaza la condición inline previa del borde rojo y ahora **también** marca en rojo el caso "cantidad/precio cargados sin producto seleccionado", que antes no daba feedback visual.

### Verificación
- `npx vue-tsc -b` → cero errores.
- Manual: elegir producto con cantidad vacía completa precio + cantidad 1; Enter en celda recién editada se queda y el segundo baja a la fila siguiente; Enter en última fila con datos crea fila nueva; Enter en fila nueva vacía saca el foco de la tabla; al salir de la tabla las filas vacías desaparecen; una fila con cantidad/precio sin producto queda en rojo; Tab sigue moviéndose celda a celda.

### Archivos
- [MODIFY] `web/src/components/editors/PresupuestoEditor.vue`
