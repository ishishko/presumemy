# Walkthrough de FSM de 5 Estados, Dropdowns Personalizados y Conciliación Financiera (V3)

Hemos finalizado e implementado con éxito la reestructuración completa del ciclo de vida de los presupuestos y su distribución financiera. A continuación se detallan las mejoras, pruebas y resultados.

---

## Modificaciones Implementadas

### 1. Modelo FSM de 5 Estados y Reglas de Transición
- **Borrador**: Estado inicial editable.
- **En curso**: Enviado al cliente y editable.
- **Cerrado**: Confirmado. Registra automáticamente `fechaFinalizacion` y bloquea la edición del presupuesto.
- **Facturado**: Conciliado formalmente (estado terminal).
- **Cancelado**: Anulado (estado terminal).

### 2. Actualizaciones Optimistas en Tabla
- Al cambiar el estado de un presupuesto desde la celda interactiva de la tabla:
  - Se actualiza el color y texto instantáneamente en el navegador (carga optimista).
  - Si la petición al backend falla, el estado se revierte a su valor original y se muestra un mensaje toast descriptivo del error.

### 3. Persistencia Unificada en el Editor
- Al cambiar el estado de un presupuesto dentro del cajón editor:
  - El botón "Guardar cambios" se habilita inmediatamente (usando snapshots reactivos de `isDirty`).
  - Al presionar "Guardar cambios", se realiza primero el `PUT` de los detalles/cabecera, y de haber modificaciones de estado, se dispara el `PATCH` de estado atómicamente.

### 4. Menús Desplegables Estilizados (Custom Dropdowns)
- Reemplazamos los selectores `<select>` nativos del navegador por dropdowns interactivos puros hechos en Vue.
  - Tienen animación de entrada suave.
  - Heredan las variables cromáticas del HSL Design System.
  - La flecha Chevron hereda la tonalidad del badge (`currentColor`).
  - Se configuraron detectores de clic global en `window` para cerrar cualquier dropdown abierto al hacer clic fuera del badge.
  - Se ajustó el contenedor `.table-wrap` a `overflow: visible` para evitar el truncamiento o clipping de menús flotantes en la última fila de la tabla.

### 5. Contabilidad Automatizada en Facturación y Tolerancia a Latencia
- Al cambiar a **Facturado**, el backend procesa en una transacción Prisma:
  - Cobro de saldo pendiente (`total - sena`) como ingreso.
  - Egreso estimado de materiales basado en el BOM del producto.
  - Egreso por imprenta/plotter asociado a sus órdenes activas.
  - Distribución neta de ganancias entre Meme, Pety y Gastos según porcentajes de base de datos.
- **Optimización de Transacciones**: Se movieron las lecturas a consultas independientes fuera de la transacción y se configuró un `timeout: 30000ms` y `maxWait: 15000ms` para asegurar alta resiliencia frente a la latencia de base de datos de Supabase.

---

## Verificación Visual y Manual

A través del navegador en `http://localhost:5174/presupuestos`, validamos y capturamos las siguientes interacciones:

### 1. Menús desplegables e interacciones
Al dar clic en los badges interactivos del listado y editor, los nuevos dropdowns se muestran sin recortes ni desbordamientos:

- **Dropdown inline en la tabla (con overflow visible)**:
  Se observa la lista de transacciones disponibles sobre el final de la tabla sin recortarse.
- **Dropdown en la cabecera del Editor**:
  Se despliega la lista flotante con sombra suave y micro-animación de entrada.

### 2. Flujo completo y conciliación de movimientos
1. Se abrió el presupuesto `P-1001` (Borrador).
2. Se cambió el estado local a **En curso** y se activó el botón de "Guardar cambios". Se guardó correctamente.
3. Desde la tabla, se cambió de **En curso** a **Cerrado** (Mint badge).
4. Finalmente, se cambió a **Facturado** (Lavender badge) ejecutando exitosamente la distribución contable en el backend.
5. Se navegó a **Finanzas**, donde se verificaron las 4 transacciones asociadas a `P-1001`:
   - Cobro de saldo: `+ $ 100.00`
   - Retiro Meme (35%): `+ $ 35.00`
   - Retiro Gastos (35%): `+ $ 35.00`
   - Retiro Pety (30%): `+ $ 30.00`

---

## Aseguramiento de Tipos y Calidad
- La validación mediante `npx vue-tsc -b` se completó con **cero errores** de compilación.
- Los textos respetan la tipografía y no usan emojis ni puntos finales en las etiquetas o botones.
