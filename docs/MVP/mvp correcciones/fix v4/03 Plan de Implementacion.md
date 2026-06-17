# Plan de Implementación Definitivo: Mejoras en Insumos

Se detallan las especificaciones técnicas definitivas para el rediseño y mejoras en el módulo de Insumos y Categorías, respetando rigurosamente el orden de filas requerido y adoptando el nuevo switch tipo flip para el modo de costeo.

## User Review Required

> [!IMPORTANT]
> **Orden Riguroso de Filas en la Ficha (Columna Izquierda)**:
> 1. **Fila 1 (Identidad):** Nombre del Insumo + Badge de Código (`insumo.codigo` alineado a la derecha en la base).
> 2. **Fila 2 (Categoría e Insumo Activo):** Dropdown de Categoría + Contenedor inline con el toggle switch de "Insumo activo" (alto y bordes idénticos al input).
> 3. **Fila 3 (Costo y Flip Switch):**
>    - Flip Switch vertical/reducido con opciones **Pack** (por defecto, off) y **Simple** (on).
>    - **Modo Pack:** Grid de 3 columnas (`Costo Pack`, `Unidades por Pack`, `Unidad de medida`) + Costo Unitario calculado (readonly, destacado debajo).
>    - **Modo Simple:** Grid de 2 columnas (`Costo Unitario` de entrada directa y `Unidad de medida`).
> 4. **Fila 4 (Encabezado):** Título descriptivo "Control de stock" con línea divisoria superior.
> 5. **Fila 5 (Stock y Nivel):** Grid de 3 columnas (`Stock actual` con su unidad, `Stock mínimo` con su unidad, y el bloque de `Nivel` inline: badge de nivel, barra de progreso y porcentaje alineados).
>
> **Columna Derecha (Proveedores y Notas)**:
> - **Arriba:** Proveedores (hasta 3 con referencias).
> - **Abajo:** Notas (textarea interno).

> [!IMPORTANT]
> **Nuevo Flip Switch para Pack / Simple**:
> Integraremos el switch tipo flip animado en 3D (`.tgl-flip`) adaptando sus colores para armonizar con el design system:
> - **Pack (off):** fondo `var(--violet-700)` con texto blanco.
> - **Simple (on):** fondo `var(--teal-600)` con texto blanco.
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
* Agregar el estilo `.id-toggle-row-inline` para integrar "Insumo activo" en la segunda fila del grid.

#### [MODIFY] [InsumosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/InsumosView.vue)
* **Nivel de Stock**:
  * Actualizar `Nivel` a: `'sin_unidades' | 'critico' | 'bajo' | 'ok'`.
  * Modificar `getNivel(i)` con la lógica de 4 niveles descrita en la sección anterior.
  * Cambiar `stateChips` para reordenar y pintar los 4 estados de forma coherente de mejor a peor: Todos, OK (verde), Bajo (amarillo), Crítico (naranja), Sin unidades (rojo).
  * En la tabla, pasar el nivel (`getNivel(i)`) a la clase de `.stock-bar` para aplicar los nuevos colores unificados.

#### [MODIFY] [InsumoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/InsumoDetalle.vue)
* **Lógica del Componente**:
  * Crear ref `tipoCosto = ref<'pack' | 'simple'>('pack')` (o un boolean para el checkbox donde `false` es 'pack' y `true` es 'simple').
  * Crear ref `costoUnitarioSimple = ref(0)`.
  * En `loadInsumo()`: inicializar `tipoCosto` como `'simple'` si `i.cantidadPack === 1`, de lo contrario `'pack'`. Cargar `costoUnitarioSimple` o `costoPaquete` correspondientemente.
  * En `validate()`: validar condicionalmente `costoPaquete` y `cantidadPack` si es Pack, o `costoUnitarioSimple` si es Simple.
  * En `handleSave()`: mapear `costoPaquete` y `cantidadPack` según el valor de `tipoCosto.value` al construir el payload.
  * Actualizar `nivel` y `nivelMeta` para soportar `'sin_unidades'` con color rojo, `'critico'` con color naranja, `'bajo'` con color amarillo, y `'ok'` con color verde.
* **Layout y Estructura (Template)**:
  * **Nombre y Código (Fila 1):** Flex container con el input de Nombre a la izquierda y el badge de código (`insumo.codigo`) alineado a la derecha en la base.
  * **Categoría e Insumo Activo (Fila 2):** Grid de 2 columnas. Columna izquierda: dropdown de categoría. Columna derecha: toggle de "Insumo activo" maquetado como input inline de alto 43px.
  * **Selector de Costo y Campos (Fila 3):**
    * Flip switch integrado (`.checkbox-wrapper-10`) etiquetado como "Modalidad".
    * **Si es Pack:** Grid de 3 columnas (`Costo Pack`, `Unidades por Pack`, `Unidad de medida`). Abajo, la fila de costo unitario calculado (readonly).
    * **Si es Simple:** Grid de 2 columnas (`Costo Unitario`, `Unidad de medida`).
  * **Separador y Control de Stock (Fila 4 y 5):**
    * Título `Control de stock` con línea divisoria superior.
    * Grid de 3 columnas: `Stock actual` (con su unidad), `Stock mínimo` (con su unidad), y el bloque de Nivel inline (`id-level-block-inline`) conteniendo la badge del nivel, la barra de progreso y el porcentaje de manera compacta.
  * **Columna Derecha:**
    * Proveedores (arriba).
    * Notas (abajo).

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
