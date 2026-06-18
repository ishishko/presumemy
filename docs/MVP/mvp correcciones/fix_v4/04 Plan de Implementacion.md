# Plan de Implementación 04: Comportamientos Blur, Creación Dinámica, Accesibilidad, Eliminación Global de Proveedores y Solución de Viewport Height (VPH)

Se detalla la especificación para unificar el diseño y los comportamientos interactivos de la tabla de proveedores dentro de la ficha de insumos (`InsumoDetalle.vue`) con la hoja de cálculo de presupuestos (`lines-spreadsheet`), corregir los comportamientos de blur/foco, permitir la creación dinámica de proveedores inexistentes, añadir accesibilidad de teclado en el interruptor de costeo, la eliminación global de proveedores, y solucionar la visualización del footer al ajustar la altura de viewport (VPH) en los drawers de insumos y productos.

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

> [!WARNING]
> **Eliminación Global de Proveedores:**
> - Eliminar un proveedor permanentemente del catálogo realizará un soft delete en el backend (`activo = false`) y borrará todas las asociaciones `InsumoProveedor` correspondientes.
> - Esto desasociará al proveedor de cualquier otro insumo que lo tuviera asignado de forma inmediata. Se pedirá confirmación explícita mediante un modal de advertencia de peligro (`variant="danger"`).

> [!IMPORTANT]
> **Corrección de Altura del Viewport (VPH) en los Overlays:**
> - Cambiaremos la posición de los contenedores `.id-overlay` y `.pd-overlay` de `position: absolute; inset: 0` a `position: fixed; top: 56px; right: 0; bottom: 0; left: 240px; z-index: 30`.
> - Esto independiza el alto del drawer de la altura que tenga la tabla del catálogo por debajo, adaptándose de forma nativa a la altura de la pantalla (Viewport Height / VPH), y manteniendo el footer de acciones visible y estático en la parte inferior mientras el cuerpo tiene scroll interno.

---

## Proposed Changes

### Backend API (api/)

#### [MODIFY] [insumos.ts](file:///d:/Desarrollando/presumemy/api/src/routes/insumos.ts)
* **Eliminación Global de Proveedor**:
  * Definir la ruta `DELETE /proveedores/:id` antes del endpoint genérico wildcard `GET /:id` (para evitar conflictos de matching).
  * Implementar transaccionalidad mediante `prisma.$transaction` para eliminar de forma dura los registros de `InsumoProveedor` y aplicar soft delete (`activo: false`) al registro de `Proveedor`.

### Frontend SPA (web/)

#### [MODIFY] [components.css](file:///d:/Desarrollando/presumemy/web/src/assets/css/components.css)
* **Accesibilidad de Flip Switch**:
  * Modificar `.checkbox-wrapper-10` y `.checkbox-wrapper-10 .tgl` para posicionar el checkbox de forma absoluta cubriendo el botón (90x32px) con `opacity: 0` y `z-index: 10`, asegurando que sea focusable y clickeable en todos los navegadores.
  * Añadir el selector `.checkbox-wrapper-10 .tgl:focus-visible + .tgl-btn` para pintar un borde de foco con `outline: 2px solid var(--violet-500); outline-offset: 2px`.

#### [MODIFY] [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue)
* **Script Setup**:
  * Declarar `provTableRef = ref<HTMLElement | null>(null)` para referenciar el contenedor de la tabla.
  * Declarar `activeRowIdx = ref<number | null>(null)` para seguir la fila activa enfocada o clickeada.
  * Declarar `isConfirmingProv = ref(false)` como bandera para pausar la limpieza automática.
  * Declarar `showConfirmCreateProv = ref(false)` para abrir/cerrar el modal custom de confirmación de creación.
  * Declarar `pendingProvIdx = ref<number | null>(null)` y `pendingProvName = ref('')` para guardar el estado temporal de la fila en edición.
  * Declarar `showConfirmDeleteGlobalProv = ref(false)` para controlar el modal de eliminación de catálogo.
  * Declarar `pendingDeleteProvId = ref<number | null>(null)` y `pendingDeleteProvName = ref('')`.
  * Modificar `onProveedorBlur(idx)` para guardar los datos temporales del proveedor por crear y abrir el modal custom.
  * Implementar `handleCreateProvConfirm()` and `handleCreateProvCancel()` para procesar la creación mediante API e invocar la rutina `cleanupEmptyProveedores()`.
  * Crear la función `cleanupEmptyProveedores()` para verificar si el foco actual está fuera de `provTableRef.value`, y de ser así, podar las filas vacías (no guardadas y sin texto).
  * Modificar `onProvTableFocusout(e)` para limpiar la fila activa y realizar la poda si no hay confirmación en proceso.
  * Implementar `triggerDeleteGlobalProv(id, name)` para pausar la poda y abrir el modal confirmador de eliminación global.
  * Implementar `handleDeleteGlobalProvConfirm()` para realizar la llamada `DELETE /api/insumos/proveedores/:id`, remover al proveedor de `proveedoresList` y de todas las filas reactivas locales, y disparar `cleanupEmptyProveedores()`.
  * Implementar `handleDeleteGlobalProvCancel()` para cerrar el modal y reanudar flujos de foco.
* **Template**:
  * Reemplazar la clase del contenedor `id-prov-table` por `lines-spreadsheet`.
  * Añadir `ref="provTableRef"` al contenedor.
  * Añadir la directiva `:class="['ln-row', activeRowIdx === idx && 'active']"` a la fila `tr` y capturar `@mousedown="activeRowIdx = idx"`.
  * Usar la clase `cell-input` en el input del proveedor.
  * Usar la clase `cell-input num-input` en el input de precio.
  * Añadir `@focus="activeRowIdx = idx"` en ambos inputs.
  * Reemplazar el botón de eliminación por `<button class="del-btn" ...>` y usar el icono de `Trash2` para que coincida exactamente con presupuestos.
  * Envolver el input de proveedor en un contenedor relativo (`position: relative; display: flex; align-items: center; width: 100%; height: 100%;`).
  * Agregar un botón flotante absolutamente posicionado en el extremo derecho del input (`v-if="p.proveedorId > 0"`) con la clase `.prov-global-del-btn` e icono `Trash2` de tamaño 12px para borrar globalmente.
  * Añadir el componente `<ConfirmDialog>` para `showConfirmCreateProv`.
  * Añadir el componente `<ConfirmDialog>` para `showConfirmDeleteGlobalProv` con `variant="danger"`.
* **Styles**:
  * Cambiar `.id-overlay` a `position: fixed; top: 56px; right: 0; bottom: 0; left: 240px; z-index: 30` para solucionar el comportamiento de Viewport Height (VPH) y desbordamiento.
  * Eliminar todas las definiciones de estilo de `.id-prov-table` y sus descendientes de la etiqueta `<style>`, ya que heredarán directamente de `.lines-spreadsheet` de `components.css`.
  * Definir estilos para `.prov-global-del-btn:hover { color: var(--coral-500) !important; }` en la sección de estilos de la vista.

#### [MODIFY] [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)
* **Styles**:
  * Cambiar `.pd-overlay` a `position: fixed; top: 56px; right: 0; bottom: 0; left: 240px; z-index: 30` para solucionar el comportamiento de Viewport Height (VPH) y desbordamiento.

---

## Verification Plan

### Automated Tests
- Validar compilación de TypeScript: `npx vue-tsc -b` en `/web`.

### Manual Verification
1. **Highlight de Fila Activa:** Al hacer clic o enfocar cualquier campo de la tabla de proveedores, la fila entera debe resaltar con borde violeta.
2. **Navegación y Blur:** 
   - Tabular entre las celdas de una misma fila no debe gatillar la limpieza de filas vacías.
   - Tabular fuera de la tabla de proveedores debe limpiar automáticamente cualquier fila que esté completamente vacía.
3. **Creación Dinámica:**
   - Escribir un nombre de proveedor inexistente y tabular fuera.
   - Confirmar en el modal: se crea, se agrega a la lista de autocompletado y se restaura el foco en la celda de precio.
   - Cancelar: se limpia el nombre y se retorna el foco al input del proveedor.
4. **Foco al Agregar Fila:** Al pulsar "+ Agregar proveedor", se crea la nueva fila y se enfoca automáticamente el input del proveedor.
5. **Accesibilidad del Switch de Costo:**
   - Tabular hacia el flip switch de costo ("Modalidad de costo").
   - Verificar que se dibuja un contorno violeta claro de foco (`focus-visible`).
   - Verificar que al pulsar la tecla Espaciadora se cambia el valor entre "Simple" y "Pack".
6. **Eliminación Global:**
   - En una fila con proveedor existente en base de datos (`proveedorId > 0`), visualizar el icono de papelera a la derecha.
   - Hacer clic en la papelera: se abre el modal advirtiendo la eliminación permanente de catálogo.
   - Confirmar: se envía la petición de borrado global, desaparece de la base de datos (soft delete) y de la lista de sugerencias autocompletable.
7. **Viewport Height (VPH):**
   - Abrir el formulario de creación o edición de insumos y productos.
   - Verificar que la barra de botones del footer con "Volver a insumos", "Eliminar", y "Guardar cambios/Crear" se mantiene siempre visible y fija al final de la pantalla (Viewport Height), mientras que la zona del cuerpo del formulario hace scroll vertical cuando el contenido excede el espacio.
