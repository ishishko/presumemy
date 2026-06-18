# Plan de Implementación 04: Comportamientos Blur y Creación Dinámica de Proveedores

Se detalla la especificación para unificar el diseño y los comportamientos interactivos de la tabla de proveedores dentro de la ficha de insumos (`InsumoDetalle.vue`) con la hoja de cálculo de presupuestos (`lines-spreadsheet`). Esto incluye corregir los comportamientos de blur/foco y la creación de proveedores inexistentes con confirmación del usuario.

## User Review Required

> [!IMPORTANT]
> **Unificación de Clases CSS y Estilos:**
> - Eliminaremos los estilos duplicados en la sección de `<style>` de `InsumoDetalle.vue` y utilizaremos la clase global `.lines-spreadsheet` del sistema de diseño.
> - Se aplicarán las clases `.cell-input`, `.num-input` y `.del-btn` en la tabla para heredar el aspecto exacto del editor de presupuestos.
> - Se utilizará la clase `.active` en la fila (`tr`) correspondiente basada en una nueva variable reactiva `activeRowIdx`.

> [!IMPORTANT]
> **Comportamiento Blur y Diálogo de Confirmación Custom:**
> - Introduciremos una bandera reactiva `isConfirmingProv` para evitar que la limpieza del foco (`onProvTableFocusout`) elimine una fila vacía mientras el diálogo de confirmación custom de Presumemi (`ConfirmDialog`) está abierto.
> - Capturaremos los datos del proveedor por crear en variables temporales reactivas (`pendingProvIdx`, `pendingProvName`) y activaremos la visualización del modal custom `showConfirmCreateProv = true`.
> - Las funciones `@confirm` y `@cancel` del modal llamarán respectivamente a `handleCreateProvConfirm` y `handleCreateProvCancel`, completando el flujo asíncrono y realizando posteriormente la poda de filas vacías con `cleanupEmptyProveedores()`.

---

## Proposed Changes

### Frontend SPA (web/)

#### [MODIFY] [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue)
* **Script Setup**:
  * Declarar `provTableRef = ref<HTMLElement | null>(null)` para referenciar el contenedor de la tabla.
  * Declarar `activeRowIdx = ref<number | null>(null)` para seguir la fila activa enfocada o clickeada.
  * Declarar `isConfirmingProv = ref(false)` como bandera para pausar la limpieza automática.
  * Declarar `showConfirmCreateProv = ref(false)` para abrir/cerrar el modal custom de confirmación.
  * Declarar `pendingProvIdx = ref<number | null>(null)` y `pendingProvName = ref('')` para guardar el estado temporal de la fila en edición.
  * Modificar `onProveedorBlur(idx)` para guardar los datos temporales del proveedor por crear y abrir el modal custom.
  * Implementar `handleCreateProvConfirm()` y `handleCreateProvCancel()` para procesar la creación mediante API e invocar la rutina `cleanupEmptyProveedores()`.
  * Crear la función `cleanupEmptyProveedores()` para verificar si el foco actual está fuera de `provTableRef.value`, y de ser así, podar las filas vacías (no guardadas y sin texto).
  * Modificar `onProvTableFocusout(e)` para limpiar la fila activa y realizar la poda si no hay confirmación en proceso.
* **Template**:
  * Reemplazar la clase del contenedor `id-prov-table` por `lines-spreadsheet`.
  * Añadir `ref="provTableRef"` al contenedor.
  * Añadir la directiva `:class="['ln-row', activeRowIdx === idx && 'active']"` a la fila `tr` y capturar `@mousedown="activeRowIdx = idx"`.
  * Usar la clase `cell-input` en el input del proveedor.
  * Usar la clase `cell-input num-input` en el input de precio.
  * Añadir `@focus="activeRowIdx = idx"` en ambos inputs.
  * Reemplazar el botón de eliminación por `<button class="del-btn" ...>` y usar el icono de `Trash2` para que coincida exactamente con presupuestos.
  * Añadir el componente `<ConfirmDialog>` en la sección de modales del final para manejar `showConfirmCreateProv`.
* **Styles**:
  * Eliminar todas las definiciones de estilo de `.id-prov-table` y sus descendientes de la etiqueta `<style>`, ya que heredarán directamente de `.lines-spreadsheet` de `components.css`.

---

## Verification Plan

### Automated Tests
- Validar compilación de TypeScript: `npx vue-tsc -b` en `/web`.

### Manual Verification
1. **Highlight de Fila Activa:** Al hacer clic o enfocar cualquier campo de la tabla de proveedores, la fila entera debe resaltar con borde violeta (igual que en presupuestos).
2. **Navegación y Blur:** 
   - Tabular entre las celdas de una misma fila no debe gatillar la limpieza de filas vacías.
   - Tabular fuera de la tabla de proveedores debe limpiar automáticamente cualquier fila que esté completamente vacía (sin nombre, sin precio).
3. **Creación Dinámica:**
   - Escribir un nombre de proveedor inexistente y tabular fuera.
   - Confirmar en el modal: se debe llamar a la API para crearlo, asignarle el nuevo ID, agregarlo a la lista de autocompletado y **restaurar el foco directamente en la celda de precio de la misma fila** para continuar la carga de datos sin perder el foco.
   - Cancelar en el modal: se debe limpiar la celda de nombre, remover la fila si corresponde, y **devolver el foco a la celda de nombre** de la fila en edición.
4. **Foco al Agregar Fila:** Al pulsar el botón "+ Agregar proveedor", se crea la nueva fila y se **pone el foco automáticamente en la celda de nombre** de la nueva fila.

