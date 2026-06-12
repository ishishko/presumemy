# Plan de Implementación — Propagación de la estética FloatingField a toda la app (V5)

Este plan detalla cómo extender el componente `FloatingField` (input con *floating label* animado tipo "wave", sombras de estado celeste/verde/rojo, focus violeta y label pill) y su lenguaje visual a **todos los formularios** de la aplicación, no solo al editor de presupuestos.

El registro de lo efectivamente realizado se lleva en `05 Walkthrough - Propagacion de FloatingField (registro por fases).md`, actualizado al cerrar cada fase.

---

## Estado actual (punto de partida)

- `web/src/components/ui/FloatingField.vue` ya soporta **text / number / date / textarea / prefix `$`**, con label wave, sombras por estado, focus violeta y pill.
- Solo `PresupuestoEditor.vue` lo usa. El resto de los formularios usan `.input` / `.select` / `.textarea` con `<label>` separado.
- **Inventario (10 archivos con formularios, ~70 campos):**
  - Soportado hoy por FloatingField: text (~35), number (~12), date (4), textarea (5), prefix `$` (2).
  - **No soportado**: `<select>` (13), checkbox (2), toggle switch custom (4), radio custom (2), segmented (2), search del topbar (1), celdas de tabla editable (3 tablas).

---

## Fase 0 — Fundaciones (habilitar la reutilización)

> Es la fase clave: sin esto, propagar implica duplicar CSS en cada archivo.

#### [MODIFY] components.css
- Mover los estilos `.ff-*` (hoy scoped en `FloatingField.vue`) a `web/src/assets/css/components.css` como clases globales, para que cualquier componente de campo los reutilice.

#### [NEW] FloatingSelect.vue
- Hermano de FloatingField para `<select>` nativo: label wave + sombras de estado + focus violeta + chevron, en modo `alwaysFloat` (un select siempre tiene valor o placeholder).
- Cubre las 13 instancias de `<select>`.

#### [NEW] Controles secundarios compartidos
- Extraer/unificar lo que hoy está duplicado con clases distintas (`id-switch`, `aj-switch`, `contacto-radio`, `segmented`, `fd-sign-toggle`):
  - `ToggleSwitch.vue` (4 usos), `CheckRow.vue` (2), `SegmentedControl.vue` (2; ya accesible como radiogroup en Presupuesto → extraerlo).
- No llevan floating label, pero adoptan el **focus violeta** y los colores del DS para coherencia.

---

## Fase 1 — Migración de campos directos (bajo riesgo)

Reemplazar `.input`/`.textarea` por `<FloatingField>` y `<select>` por `<FloatingSelect>`, archivo por archivo. Orden sugerido:

| Orden | Archivo | Qué migra | Notas |
|---|---|---|---|
| 1 | `features/auth/LoginView.vue` | email, password | Decidir ícono (Mail/Lock): slot de ícono en FloatingField o dejar login aparte |
| 2 | `components/drawers/ImprentaDrawer.vue` | 8 campos + select metodoPago + checkbox | dinero → `prefix="$"` |
| 3 | `components/drawers/MovimientoDrawer.vue` | fecha, valor, detalle, nroFactura + 2 selects | valor con `$`; toggle in/out → SegmentedControl |
| 4 | `components/drawers/ClienteDrawer.vue` | nombre, dirección, notas + select canal + radio principal | tiene zod → cablear `invalid`/`required` |
| 5 | `views/AjustesView.vue` | negocio, domicilio, contacto + selects + switches | tablas de socios quedan como cell-input |
| 6 | `components/overlays/InsumoDetalle.vue` | unidad, stocks, costos, notas + select categoría | `nombre` inline grande queda como está; pills de unidad se mantienen |
| 7 | `components/overlays/ProductoDetalle.vue` | medida, descripción, ganancia, precio + select categoría | segmented tipoGanancia → SegmentedControl |

---

## Fase 2 — Validación coherente

- Donde haya zod (Cliente, Presupuesto), cablear `:invalid` y `:required` por campo para que rojo/verde reflejen validez real (no solo "tiene texto"), como en Presupuesto (Cliente/Seña).
- Donde no haya schema (Imprenta, Movimiento), definir reglas mínimas (requeridos, montos ≥ 0).

---

## Fase 3 — Decisiones pendientes (NO tocar sin confirmar)

- **Search del topbar**: no es campo de formulario; mantener su estilo propio.
- **Nombres inline grandes** (Insumo/Producto): título editable, no floating-label. Dejar.

---

## Tablas editables — Pase a detalle

Las tablas con `cell-input` (patrón spreadsheet, no floating-label) se trabajan en una pasada propia, una tabla a la vez. No se les agrega floating-label; el objetivo es coherencia de foco/estado con el DS y estabilidad visual.

### Parte 1 — Tabla de líneas del Presupuesto (hecha)
- **Foco único**: el borde violeta de la fila activa es el único indicador; el foco de celda se alineó al mismo violeta (`.cell-input:focus → --violet-50`). Limpieza de `activeRow` vía `@focusout` (que burbujea).
- **Botón "Agregar línea" siempre visible**: se eliminó el estado `editing` y el auto-append.
- **Fuente única de CSS**: el bloque `.lines-spreadsheet` estaba duplicado (global + scoped, ya divergente). Se borró el scoped; `components.css` queda como único dueño.
- **Hover estable**: la fila no cambia de fondo en hover; lo único que aparece es el ícono del grip (con la opacidad sobre el SVG, no sobre el `<td>`, para no borrar el borde activo). Papelera siempre visible. Chevron nativo del datalist oculto.

#### Comportamiento de edición (planificado)

Sobre la base ya estabilizada (foco único, fuente única de CSS, hover calmo), se planifica el comportamiento "vivo" de planilla. Todo vive en `web/src/components/editors/PresupuestoEditor.vue`; Tab (navegación por celda) y `onOverlayKeydown` (Escape/Tab) no se tocan.

**Objetivos**
1. **Cantidad automática**: al elegir un producto real del catálogo, además del precio se completa `cantidad = 1` si la celda de cantidad está vacía.
2. **Enter = navegación por fila** (distinta de Tab):
   - Enter sobre una celda **no editada en ese foco** → salta a la **primera celda de la fila de abajo**.
   - Si no hay fila debajo y la actual **tiene datos** → crea una fila nueva y la enfoca (comportamiento actual de `handleAddLine`).
   - Si no hay fila debajo y la actual **está vacía** → el foco sale de la tabla, al siguiente focusable de la página.
   - Enter sobre una celda **recién editada** → solo confirma el cambio y se queda (hace falta un segundo Enter para avanzar).
3. **Prune en blur**: al salir el foco de la tabla, las filas **sin datos** (sin producto) se eliminan; si no queda ninguna, se deja una fila limpia.

**Consideración**: `@keydown.enter.prevent` en la celda Producto puede interferir con confirmar una sugerencia del `<datalist>` con teclado; como el Enter "sucio" solo confirma sin mover, el valor tipeado se conserva. Se valida en runtime.

**Verificación**
- `cd web && npx vue-tsc -b` sin errores.
- Manual: producto con cantidad vacía → precio + cantidad 1; Enter en celda recién editada se queda, segundo Enter baja a la fila siguiente; Enter en última fila con datos crea fila nueva; Enter en fila nueva vacía saca el foco de la tabla; al salir de la tabla las filas vacías desaparecen; Tab sigue moviéndose celda a celda.

### Pendiente (próximas partes)
- **Tabla de socios** (`AjustesView`): switch + radios dentro de la tabla.
- **BOM de Producto** (`ProductoDetalle`): celdas de receta.
- **Proveedores de Insumo** (`InsumoDetalle`): radios `esPrincipal`.

---

## Verification Plan

### Automated
- `cd web && npx vue-tsc -b` sin errores tras cada fase/archivo.

### Manual
- Recorrida de cada drawer/vista: label wave, estados celeste/verde/rojo, focus violeta, validación inline, navegación por teclado.
- Commit por archivo o por fase (el working tree se mantiene limpio gracias a `.gitattributes`).

---

## Riesgos / esfuerzo
- **Fase 0 primero**: evita reescribir estilos 8 veces. Esfuerzo: 1 componente nuevo grande (FloatingSelect) + extracción de CSS + 3 componentes chicos.
- Fase 1: bajo riesgo (cambio visual mecánico). Mayor cuidado en Insumo/Producto por pills/switches/tablas.
