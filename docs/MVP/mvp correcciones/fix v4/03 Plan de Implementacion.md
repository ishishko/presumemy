# Plan de Implementación Definitivo: Mejoras en Insumos

Se detallan las especificaciones técnicas definitivas para el rediseño y mejoras en el módulo de Insumos y Categorías, respetando rigurosamente el orden de filas requerido, el nuevo switch tipo flip para el modo de costeo, y las adaptaciones de espaciado basadas en el editor de presupuestos.

## User Review Required

> [!IMPORTANT]
> **Orden Riguroso de Filas en la Ficha (Columna Izquierda)**:
> 1. **Fila 1 (Nombre):** Nombre del Insumo + Badge de Código (`insumo.codigo` alineado a la derecha en la base) en su propia sección (`SECCIÓN 1: Nombre`).
> 2. **Fila 2 (Categorización):** Dropdown de Categoría + Contenedor inline con el toggle switch de "Insumo activo" en su propia sección (`SECCIÓN 1b: Categorización`).
> 3. **Fila 3 (Costo y Flip Switch):** En la sección `SECCIÓN 2: Costeo` (sin bordes superiores ni paddings/márgenes inline):
>    - Flip Switch vertical/reducido con opciones **Pack** (por defecto, off) y **Simple** (on).
>    - **Modo Pack:** Grid de 3 columnas (`Costo Pack`, `Unidades por Pack`, `Unidad de medida`) + Costo Unitario calculado (readonly, destacado debajo sin borde superior ni paddings/márgenes excedentes).
>    - **Modo Simple:** Grid de 2 columnas (`Costo Unitario` de entrada directa y `Unidad de medida`).
> 4. **Fila 4 (Encabezado):** Título descriptivo "Control de stock" con línea divisoria superior e inline `margin-bottom: 4px;` en `SECCIÓN 3: Control de stock`.
> 5. **Fila 5 (Stock y Nivel):** Grid de 3 columnas asimétricas (`Stock actual` e `Stock mínimo` sin las etiquetas de unidades de medida para evitar el colapso horizontal, y el bloque de `Nivel` inline: badge de nivel y porcentaje alineados arriba, y barra de progreso abajo).
>
> **Columna Derecha (Proveedores y Notas)**:
> - **Arriba:** Proveedores (hasta 3 con referencias).
> - **Abajo:** Notas (textarea interno).

> [!IMPORTANT]
> **Nuevo Flip Switch para Pack / Simple**:
> Integraremos el switch tipo flip animado en 3D (`.tgl-flip`) adaptando sus colores para armonizar con el design system:
> - **Pack (off):** fondo `var(--violet-700)` con texto blanco.
> - **Simple (on):** fondo `var(--teal-500)` con texto blanco (corrigiendo la variable inexistente `--teal-600`).
> - Dimensiones reducidas y compactas para no ocupar espacio innecesario.

> [!IMPORTANT]
> **Semáforo de Stock de 4 Niveles**:
> Unificamos a 4 estados en la tabla (`InsumosView.vue`) y en el detalle (`InsumoDetalle.vue`):
> 1. **OK** (Verde): `stock >= stockMinimo` (bg: `var(--green-50)`, texto: `var(--green-700)`)
> 2. **Bajo** (Amarillo): `stock < stockMinimo` y `stock > stockMinimo * 0.2` (bg: `var(--yellow)`, texto: `var(--yellow-ink)`)
> 3. **Crítico** (Naranja): `stock > 0` y `stock <= stockMinimo * 0.2` (bg: `var(--orange-50)`, texto: `var(--orange-ink)`)
> 4. **Sin unidades** (Rojo): `stock === 0` (bg: `var(--coral-50)`, texto: `var(--coral-500)`. La barra de stock estará vacía con fondo rojo translúcido y borde coral).

---

## Proposed Changes

### Frontend SPA (web/)

#### [MODIFY] [components.css](file:///d:/Desarrollando/presumemy/web/src/assets/css/components.css)
* Redefinir estilos para `.stock-bar`:
  * `.stock-bar.ok > div`: `background: var(--green-700);`
  * `.stock-bar.bajo > div`: `background: var(--yellow);`
  * `.stock-bar.critico > div`: `background: var(--orange-500);`
  * `.stock-bar.sin_unidades`: fondo `var(--coral-50)` y borde `1px solid var(--coral-500)`.
* Implementar los estilos para el nuevo flip switch de costo (`.checkbox-wrapper-10`).
  * Corregir el color de fondo en checked a `var(--teal-500)` para solucionar la invisibilidad en modo Simple.
* Agregar el estilo `.id-toggle-row-inline` para integrar "Insumo activo" en la segunda fila del grid.

#### [MODIFY] [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue)
* **Nivel de Stock**:
  * Actualizar `Nivel` a: `'sin_unidades' | 'critico' | 'bajo' | 'ok'`.
  * Modificar `getNivel(i)` con la lógica de 4 niveles descrita en la sección anterior.
  * Cambiar `stateChips` para reordenar y pintar los 4 estados de forma coherente de mejor a peor: Todos, OK (verde), Bajo (amarillo), Crítico (naranja), Sin unidades (rojo).
  * En la tabla, pasar el nivel (`getNivel(i)`) a la clase de `.stock-bar` para aplicar los nuevos colores unificados.

#### [MODIFY] [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue)
* **Lógica del Componente**:
  * Crear ref `esSimple = ref(false)` para controlar la modalidad del costo.
  * En `validate()`: validar condicionalmente `costoPaquete` y `cantidadPack` si es Pack, o `costoPaquete` si es Simple.
  * En `handleSave()`: mapear `cantidadPack = 1` si `esSimple` es true.
  * Actualizar `nivel` y `nivelMeta` para soportar `'sin_unidades'` con color rojo, `'critico'` con color naranja, `'bajo'` con color amarillo, y `'ok'` con color verde.
* **Layout y Estructura (Template)**:
  * **Nombre y Código (Fila 1):** Flex container en su propio `<section class="form-section">` (`SECCIÓN 1: Nombre`).
  * **Categoría e Insumo Activo (Fila 2):** En su propio `<section class="form-section">` (`SECCIÓN 1b: Categorización`) con la clase `.form-row`.
  * **Selector de Costo y Campos (Fila 3):**
    * En su propio `<section class="form-section">` (`SECCIÓN 2: Costeo`) sin bordes ni rellenos inline.
    * Flip switch integrado (`.checkbox-wrapper-10`) etiquetado como "Modalidad de costo".
    * **Si es Pack:** Grid de 3 columnas (`Costo Pack`, `Unidades por Pack`, `Unidad de medida`) con clase `.id-grid-3`. Abajo, la fila de costo unitario calculado `.id-cost-row.grand` sin borde superior, paddings ni márgenes (estilo limpio).
    * **Si es Simple:** Grid de 2 columnas (`Costo Unitario`, `Unidad de medida`) con clase `.form-row`.
  * **Separador y Control de Stock (Fila 4 y 5):**
    * En su propio `<section class="form-section">` (`SECCIÓN 3: Control de stock`) sin bordes inline.
    * Título `Control de stock` en `.form-section-head` con `style="margin-bottom: 4px;"`.
    * Grid asimétrico de 3 columnas con clase `.id-grid-stock` (con columnas `1fr 1fr 2fr` para dar suficiente ancho a la barra de nivel).
    * `Stock actual` e `Stock mínimo` sin los unit pills.
    * Bloque de Nivel inline (`.id-level-block-inline`) sin altura fija (para evitar colapso). Contiene la badge y las estadísticas alineadas en una fila de `display: flex; justify-content: space-between; align-items: center;` en la parte superior, y la barra `.id-level-bar` abajo.
* **Estilos (CSS Scoped)**:
  * Definir `.form-section-body` con `gap: 18px` para homologar el espaciado vertical entre campos con el del editor de presupuestos.
  * Definir `.id-grid-stock` para separar la distribución del stock de la del costo.
  * Remover reglas de `border-top`, `padding` y `margin` en `.id-cost-row` y `.id-cost-row.grand`.
  * Adaptar `.id-prov-table` para aplicar estilos y box-shadows de `.lines-spreadsheet` mediante el selector `:focus-within` en celdas y filas.
  * Remover estilos obsoletos (`.id-prov-add`, `.id-notes-full` y `.textarea`).

* **Columna Derecha (Proveedores y Notas)**:
  * **Proveedores:** Integrar el botón "+ Agregar proveedor" dentro de la misma caja de la tabla `.id-prov-table` usando la clase global `.add-line-btn` de `components.css`.
  * **Notas:** Quitar el `fieldset.id-card.id-notes-full` con cabeceras redundantes y dejar el `FloatingField` flotando directamente en `.id-notes-wrapper` con una descripción pequeña debajo para el hint de privacidad ("Información interna · solo visible para tu equipo").

---

## Verification Plan

### Automated Tests
* Ejecutar verificación de tipos TypeScript en el frontend: `npx vue-tsc -b` en `/web`.
* Ejecutar tests del backend: `npm run test` en `/api` para descartar regresiones.

### Manual Verification
1. **Layout**: Validar la correcta disposición de las 5 filas descritas a la izquierda, y de proveedores/notas a la derecha.
2. **Flip Switch**: Cambiar entre los modos Pack y Simple y verificar que se oculten/muestren los campos correctos y que al guardar persista el valor unitario en la base de datos (con `cantidadPack = 1` en modo Simple).
3. **Badge del Código**: Verificar la alineación del badge del código al lado derecho de la fila de Nombre.
4. **Semáforo de Stock**: Modificar cantidades para testear los 4 estados de stock y que se reflejen en la barra del listado y en la badge/barra del detalle del insumo en sus respectivos colores.
5. **Estilo Planilla (Proveedores)**: Hacer foco en el dropdown de proveedor o en el input de precio de referencia y validar que la fila se resalte con un borde violeta y la celda activa tenga un fondo violeta suave. Confirmar que el botón "+ Agregar proveedor" aparezca fusionado con el contenedor de la tabla.
6. **Sección de Notas**: Validar que el campo Notas se muestre como un input simple flotante con su label wave, eliminando la tarjeta de doble borde.
