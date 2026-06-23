# Walkthrough 07: Epic C — Redefinición del Dashboard / Home (arquitectura híbrida store/server) + Fix de reapertura del FSM de Presupuestos

Se completaron con éxito las mejoras técnicas y de diseño especificadas en el **Plan de Implementación 07** para rediseñar el Dashboard, agregar configuración de formato de fecha y solucionar el desfase del FSM de presupuestos.

## Cambios Realizados

### 1. Modelo de Datos y Servidor Backend (api/)
* **Nueva Configuración de Fecha (`formatoFechaDashboard`):** Se agregó la columna `formatoFechaDashboard String @default("relativo") @map("formato_fecha_dashboard")` al modelo `ConfiguracionNegocio` en [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma). Se ejecutó la migración correspondiente `20260622173923_add_formato_fecha_dashboard` y se regeneró el Prisma Client.
* **Actualización de Semillas:** Se modificó [seed.ts](file:///d:/Desarrollando/presumemy/api/prisma/seed.ts) para incluir el valor por defecto `'relativo'` al crear la configuración inicial del negocio.
* **Controlador de Ajustes:** Se actualizó el esquema de validación `configSchema` y el manejador PUT en [ajustes.ts](file:///d:/Desarrollando/presumemy/api/src/routes/ajustes.ts) para aceptar y guardar la propiedad `formatoFechaDashboard`.
* **Adelgazamiento del Endpoint `/dashboard/stats`:**
  - Se removió por completo la consulta de `insumosBajos` en [dashboard.ts](file:///d:/Desarrollando/presumemy/api/src/routes/dashboard.ts) para eliminar queries redundantes y delegar este cálculo al frontend.
  - Se modificó la consulta de `presupuestosRecientes` para ordenar por última edición (`updatedAt: 'desc'`) y excluir presupuestos en estados finales (`facturado`, `cancelado`).
  - Se introdujo la consulta `proximosEntregar` para traer las 3 entregas pendientes más urgentes (ordenadas por `fechaEntrega: 'asc'`).
  - Se actualizó el payload devuelto removiendo `insumosBajosCount` e `insumosBajos`, y agregando el array `proximosEntregar`.

### 2. Frontend SPA (web/)
* **Interfaces y Tipos:** Se agregaron las propiedades `formatoFechaDashboard` y `proximosEntregar` a las interfaces de TypeScript en [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts), removiendo los campos antiguos de insumos bajos.
* **Configuración del Formato de Fecha en Ajustes:**
  - Se incorporó un selector `FloatingSelect` en la sección de Inicio en [AjustesView.vue](file:///d:/Desarrollando/presumemy/web/src/views/AjustesView.vue) para configurar la visualización de fechas en el Dashboard (Relativo o Absoluto).
  - Se actualizó la función `saveConfig` para enviar este valor al backend al guardar.
* **Rediseño Híbrido, Reactivo y en 2 Columnas del Dashboard:**
  - Se eliminó por completo el gráfico de ingresos semanales en [DashboardView.vue](file:///d:/Desarrollando/presumemy/web/src/views/DashboardView.vue).
  - Se configuró la carga inicial en `onMounted` para obtener concurrentemente los stats y precargar `productosStore`/`insumosStore` si no se habían descargado aún.
  - Se reestructuró la maquetación en un **grid de 2 columnas**:
    * **Columna Izquierda**:
      1. **Card de Finanzas Integrada**: Unifica las tarjetas de "Ingresos este mes" y "Por cobrar" en una sola tarjeta `.highlight` con fondo lavanda y una línea divisoria central.
      2. **Próximos a entregar**: Muestra las 3 próximas entregas con formato de fecha dinámico (relativo: "Entrega hoy", "En 3 días", "Atrasado hace 2 días"; o absoluto: "24 Jun 2026"), aplicando fondo y texto coral (`--coral-500`) si está vencido.
      3. **Presupuestos recientes**: Muestra los 5 presupuestos modificados recientemente sin estados finales.
    * **Columna Derecha**:
      1. **Capacidad de fabricación**: Muestra los 10 productos con receta (BOM) con su capacidad máxima teórica calculada en vivo según el stock del insumo limitante. Resalta favoritos con estrella `★`, y aplica colores semánticos de capacidad (coral para capacidad 0, amarillo para capacidad entre 1 y 5, neutral para más de 5).
      2. **Insumos a reponer (Top 5)**: Muestra una lista/tabla con los 5 insumos que se encuentran por debajo de su stock mínimo, ordenados de forma inteligente según su nivel de criticidad (ratio stock/stockMinimo), con barra de progreso reactiva.
* **Fix de Reapertura del FSM de Presupuestos:**
  - Se agregó la transición `cerrado -> en_curso` en el objeto `TRANSITIONS` de [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/components/editors/PresupuestoEditor.vue) para sincronizarlo con el FSM del backend.
  - Se interceptó el cambio de estado en `handleStatusChange` para mostrar un modal de confirmación `ConfirmDialog` interactivo. Al confirmarse, se ejecuta un PATCH al backend para limpiar la fecha de finalización y reabrir el presupuesto, haciendo todos sus inputs editables nuevamente de inmediato.

---

## Verificación de Calidad

1. **Compilación de Tipos Backend (`api/`):**
   Se verificó la compilación de TypeScript en el backend:
   ```bash
   npx tsc --noEmit
   ```
   Resultado: **0 errores**.

2. **Compilación de Tipos Frontend (`web/`):**
   Se verificó la compilación del frontend:
   ```bash
   npx vue-tsc -b
   ```
   Resultado: **0 errores**.

3. **Pruebas del Backend (`api/`):**
   Se ejecutó la suite de pruebas automatizadas del API:
   ```bash
   npm run test
   ```
   Resultado: **Éxito absoluto (100% de tests pasados)**.

## Correcciones de Diseño Visual (Overlays Insumos y Productos)
Se aplicaron y verificaron en el navegador las correcciones de diseño flat y borderless para los overlays de detalles:
* **InsumoDetalle ([InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue)):**
  * Modificación de la clase `.id-card`: se comentaron las propiedades `background`, `border` y `box-shadow` para quitar bordes y sombras, logrando un aspecto plano e integrado.
* **ProductoDetalle ([ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)):**
  * Modificación de la clase `.pd-left-block`: se comentó `gap: 20px` para eliminar el espacio vertical entre el título y la cuadrícula interna.
  * Modificación de la clase `.pd-name-header-card`: se comentaron las propiedades `background`, `border` y `box-shadow`.
  * Modificación de la clase `.pd-card`: se comentaron las propiedades `background`, `border`, `border-radius`, `box-shadow` y `gap: 16px` para hacerlo plano, sin bordes ni separación interna excesiva (de modo que los divisores internos del formulario estructuren la información de precios).
  * **Restauración del espaciado interno y del grid:**
    * Se ajustó el espaciado de `.pd-left-grid` cambiando `gap` de `20px` a `16px`.
    * Se aplicó un espaciado específico por tipo de tarjeta dentro del grid izquierdo: `.pd-left-grid .pd-card:first-of-type` (Fotos) con `gap: 16px` y `.pd-left-grid .pd-card:last-of-type` (Identidad) con `gap: 26px`. Esto mantiene la maquetación visual perfectamente equilibrada y espaciada como se requiere.

**Verificación en el navegador:**
* Se inició sesión en la aplicación local y se navegó a `/insumos` y `/productos`.
* Se abrieron los overlays de detalles respectivos y se verificó con scripts de consola y capturas de pantalla que los estilos computados del DOM reflejan los cambios (background transparente, boxShadow en none, border en 0px) y que la UI se despliega de forma totalmente alineada y limpia, respetando las especificaciones del Design System (con espaciado de 16px para el grid y fotos, 26px para la tarjeta de identidad, y apilado directo de 0px en la tarjeta de precios de la derecha).
