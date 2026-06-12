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
