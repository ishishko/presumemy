# Plan de Corrección de Estados FSM (5 Estados), Distribución Financiera y Estilos en Presumemi

Este plan detalla el ciclo de vida de los presupuestos simplificado a 5 estados, el envío al contacto principal del cliente, la persistencia unificada de estado en el editor, actualizaciones optimistas en la tabla, y el reemplazo de selectores nativos por menús desplegables estilizados.

---

## User Review Required

> [!IMPORTANT]
> **Modelo FSM de 5 Estados:**
> - **`borrador`**: Estado inicial. Totalmente editable. Permite el envío al contacto principal del cliente.
> - **`en_curso`**: Cliente vio/recibió el presupuesto. Sigue siendo editable.
> - **`cerrado`**: Trabajo confirmado y aceptado. Registra automáticamente `fecha_finalizacion` y bloquea/congela la edición del presupuesto. No puede retroceder a `cancelado`.
> - **`cancelado`**: Pedido anulado. Estado terminal y de solo lectura.
> - **`facturado`**: Conciliado formalmente. Estado terminal. Al entrar aquí se asientan automáticamente en finanzas:
>   - Ingreso por el resto a cobrar (`total - sena`).
>   - Egreso estimado de insumos (costo del BOM de productos).
>   - Egreso estimado de imprenta (asociado a órdenes de imprenta).
>   - Retiro proporcional de ganancias netas: Meme 40%, Pety 30%, Gastos 30% (o porcentajes configurados).

---

## Proposed Changes

### Componente: Base de Datos y Backend API

#### [MODIFY] [schema.prisma](file:///D:/Desarrollando/presumemy-worktree/api/prisma/schema.prisma)
- Añadir el campo opcional `fechaFinalizacion` (`fecha_finalizacion` en DB) al modelo `Presupuesto`:
  ```prisma
  fechaFinalizacion DateTime?          @map("fecha_finalizacion")
  ```

#### [MODIFY] [fsm.ts](file:///D:/Desarrollando/presumemy-worktree/api/src/utils/fsm.ts)
- Definir las transiciones:
  - `borrador: ['en_curso', 'cancelado']`
  - `en_curso: ['cerrado', 'cancelado']`
  - `cerrado: ['facturado']`
  - `facturado: []`
  - `cancelado: []`
  - Compatibilidad:
    - `enviado: ['en_curso', 'cancelado']`

#### [MODIFY] [presupuestos.ts](file:///D:/Desarrollando/presumemy-worktree/api/src/routes/presupuestos.ts)
- **Creación (`POST /`)**: Forzar el estado inicial en `'borrador'` en lugar de `'en_curso'`.
- **Edición (`PUT /:id`)**: Permitir modificaciones si el estado actual es `'borrador'` o `'en_curso'`.
- **Transición de Estado (`PATCH /:id/estado`)**:
  - Si el nuevo estado es `'cerrado'`, guardar la fecha actual en `fechaFinalizacion`.
  - Si el nuevo estado es `'facturado'`, ejecutar el trigger contable:
    - Sumar costos de insumos BOM (`costoInsumosTotal`) y órdenes de imprenta (`costoImprentaTotal`).
    - Calcular `gananciaNeta`: `total - costoInsumosTotal - costoImprentaTotal`.
    - En una transacción de base de datos, insertar:
      1. Ingreso de venta (`venta_presupuesto`) por `total - sena` (si es > 0).
      2. Egreso por insumos (`compra_insumo`) por `costoInsumosTotal` (si es > 0).
      3. Egreso por imprenta (`pago_imprenta`) por `costoImprentaTotal` (si es > 0).
      4. Retiros de socios (`retiro_socio`) basados en la tabla `distribucion_ganancias` y la `gananciaNeta` (si es > 0).

---

### Componente: Frontend Web

#### [MODIFY] [PresupuestoEditor.vue](file:///D:/Desarrollando/presumemy-worktree/web/src/components/editors/PresupuestoEditor.vue)
- **FSM y Editable**:
  - `isEditable` devolverá `true` si es nuevo o el estado es `'borrador'` o `'en_curso'`.
  - Agregar `estado` a `getFormSnapshot()` para que cambiar el estado localmente habilite el botón de "Guardar cambios".
  - Al hacer clic en "Guardar cambios": guardar los datos (`PUT`) y, si el estado cambió, aplicar el cambio de estado (`PATCH`).
- **Botón "Enviar a [Contacto]"**:
  - Mostrar un botón adicional de "Enviar" si el presupuesto está en `'borrador'`.
  - El botón mostrará el contacto principal del cliente (obtenido a través de `contactos.find(c => c.esPrincipal) || contactos[0]`).
  - Al hacer clic: guarda el presupuesto (si es dirty), actualiza el estado a `'en_curso'` y muestra un toast descriptivo del envío.
- **Selector Desplegable Estilizado**:
  - Reemplazar el select de estado por un menú de dropdown personalizado en Vue.
  - Al hacer clic en la pastilla de estado se abrirá un menú flotante con las transiciones disponibles.
  - El dropdown tendrá un Chevron que heredará el color del texto (`currentColor`) y un menú flotante con sombras y animación de aparición.
- **Remoción de Alerta**:
  - Eliminar por completo el `<div class="alert-banner">` superior.

#### [MODIFY] [PresupuestosView.vue](file:///D:/Desarrollando/presumemy-worktree/web/src/views/PresupuestosView.vue)
- **Filtros por Estado**:
  - Actualizar `filters` y `statusTones` para mostrar los 5 estados (`borrador`, `en_curso`, `cerrado`, `facturado`, `cancelado`), removiendo por completo `enviado`.
- **Carga Optimista**:
  - Al seleccionar un nuevo estado en la celda interactiva, actualizar inmediatamente `p.estado = nuevoEstado` en la tabla.
  - Si el PATCH del backend falla, revertir la propiedad `p.estado` a su valor original y notificar mediante toast.
- **Dropdown Estilizado en Fila**:
  - Reemplazar el select nativo de la celda de estado por la misma estructura de dropdown personalizada en Vue.

#### [MODIFY] [components.css](file:///D:/Desarrollando/presumemy-worktree/web/src/assets/css/components.css)
- **Estilos del Dropdown Personalizado**:
  - Definir las clases `.custom-status-dropdown`, `.status-dropdown-menu`, `.status-dropdown-item` y el Chevron `.chevron-arrow`.
  - Eliminar los selectores y overrides del select nativo (`.status-select`).

---

## Verification Plan

### Automated Verification
- Validar tipos: `cd web && npx vue-tsc -b`

### Manual Verification
1. **Crear y Guardar**:
   - Crear un presupuesto. Validar que comience en **Borrador**.
   - Validar que al cambiar el estado en el encabezado a **En curso**, el botón de "Guardar cambios" se habilite. Guardar y comprobar que el estado se persista.
2. **Botón Enviar**:
   - Para un presupuesto en **Borrador** con un cliente que tenga contactos (ej. WhatsApp), validar el botón "Enviar a Whatsapp (...)".
   - Pulsar el botón y verificar el cambio a **En curso** y el toast descriptivo.
3. **Carga Optimista en Tabla**:
   - En la tabla de presupuestos, cambiar un presupuesto de **En curso** a **Cerrado**.
   - Validar que cambie visualmente al instante.
   - Forzar un error (ej. desconectando red o intentando una transición inválida) y verificar que regrese al estado original con un toast de error.
4. **Verificar Distribución en Facturado**:
   - Cambiar un presupuesto cerrado a **Facturado** y comprobar los 8 asientos correctos en la vista de Finanzas.
