# Plan de Implementación 07: Epic C — Redefinición del Dashboard / Home (arquitectura híbrida store/server) + Fix de reapertura del FSM de Presupuestos

Este plan rediseña el Home según Epic C (C1–C5 de `01_Estado_Actual.md`) adoptando una **arquitectura híbrida** que elimina la redundancia detectada entre el endpoint `/dashboard/stats` y los datos que los stores ya descargan, sin exponer al dashboard al techo de paginación donde más dolería. Se quita el gráfico de ingresos semanales, se reorienta "Presupuestos recientes" a lo trabajable ordenado por última edición, se agrega "Próximos a entregar" con detección de atrasos, y se reemplaza "Insumos bajos" por "Capacidad de fabricación" (cruce BOM × stock). Adicionalmente, se corrige un desfase entre el FSM del backend y el del frontend que impide reabrir un presupuesto cerrado.

## User Review Required

> [!IMPORTANT]
> **Arquitectura híbrida store/server (decisión central) — qué se deriva del cliente y qué queda en el endpoint:**
> El reparto sigue la **línea de crecimiento de cada tabla**, no una preferencia arbitraria:
> - **Se deriva en el cliente (computed sobre stores ya cargados):**
>   - **Capacidad de fabricación (C5):** se calcula con **productos + insumos**, ambas tablas *acotadas* (catálogo/inventario). La lista de productos **ya incluye el BOM con el stock de cada insumo** (`/api/productos` hace `include: { bomLineas: { include: { insumo: true } } }`), así que `productosStore.data` tiene todo lo necesario. Cero queries adicionales.
>   - **Conteo "Insumos a reponer":** se deriva de `insumosStore.data` (insumos con `stock < stockMinimo`).
> - **Se mantiene server-side en `/dashboard/stats`:**
>   - **Slices de presupuestos** (recientes, próximos a entregar, `porCobrar`, `statsPorEstado`): se calculan sobre **presupuestos**, tabla que *crece sin techo* (uno por cotización, para siempre). El "top N / suma" resuelto en el server evita bajar el historial completo al cliente y queda a prueba de la paginación que Epic D planea introducir.
>   - **KPIs financieros del mes** (`ingresosMes`, `egresosMes`, `utilidadMes`): se agregan sobre **transacciones** (tabla creciente) y se fijan al mes actual en el server, evitando el acople con el período que la usuaria tenga seleccionado en Finanzas.
> - **Consecuencia:** el endpoint deja de cargar y recalcular insumos/capacidad (que el cliente ya tiene), y el cliente deja de depender del techo de 100 para los datos de presupuestos.

> [!IMPORTANT]
> **Reconciliación C2 + C4 — un solo panel, no dos:**
> - C2 ("Presupuestos recientes sin estados finales") y C4 ("Últimos editados") **se unifican** en el panel existente "Presupuestos recientes": pasa a **ordenarse por última modificación (`updatedAt desc`)** y a **excluir `facturado`/`cancelado`**. No se crea una sección "Últimos editados" aparte.
> - Se mantiene la cantidad actual de **5 resultados** (`take: 5`).

> [!IMPORTANT]
> **Algoritmo de Capacidad de fabricación (C5) — supuestos (ahora computed en el cliente):**
> - `capacidad = mínimo sobre cada insumo de floor(stock_insumo / cantidad_por_unidad)`. El insumo más escaso es el cuello de botella ("limitado por: …").
> - Solo las líneas de BOM con `insumoId` cuentan. Las líneas `cameo`/`embalaje`/`extra` sin insumo (costos por descripción) **no limitan**.
> - **Productos con receta pero sin ninguna línea de insumo se ocultan** del panel.
> - Cálculo **independiente por producto** (asume todo el stock disponible para ese producto; no reparte stock entre productos que comparten insumos): es capacidad teórica, no plan de producción.
> - Si un insumo aparece en varias líneas del producto, se **suma su consumo** antes de dividir por el stock.

> [!IMPORTANT]
> **Reapertura de presupuestos cerrados (fix de desincronización):**
> - El backend (`api/src/utils/fsm.ts`) **ya permite** `cerrado → en_curso` (y al ejecutarla limpia `fechaFinalizacion`). El frontend mantiene su **propia** tabla de transiciones en `PresupuestoEditor.vue` que **no la incluye**, por lo que el botón para reabrir nunca aparece.
> - El fix sincroniza la tabla del frontend con el FSM real. La opción se rotula **"En curso"** (consistente con el resto, sin copy especial). Tras reabrir, los campos vuelven a ser editables (`isEditable` ya contempla `en_curso`) y el documento conserva sus rutas (`en_curso → cerrado → facturado`).

---

## Proposed Changes

### 1. Backend API (api/)

#### [MODIFY] [dashboard.ts](file:///d:/Desarrollando/presumemy/api/src/routes/dashboard.ts)

Adelgazar el endpoint `GET /api/dashboard/stats` para que solo agregue lo que conviene server-side. **Eliminar por completo la query de insumos** (`prisma.insumo.findMany` de insumos bajos): la capacidad y el conteo de reposición pasan a derivarse en el cliente.

* **C2 + C4 — `presupuestosRecientes`:** sobre la query existente:
  * `where`: agregar `estado: { notIn: ['facturado', 'cancelado'] }` (manteniendo `activo: true`).
  * `orderBy`: cambiar `{ createdAt: 'desc' }` → `{ updatedAt: 'desc' }`.
  * Mantener `take: 5` e `include` del cliente.

* **C3 — `proximosEntregar` (query nueva):**
  ```typescript
  prisma.presupuesto.findMany({
    where: {
      activo: true,
      fechaEntrega: { not: null },
      estado: { notIn: ['facturado', 'cancelado'] },
    },
    include: { cliente: { select: { id: true, nombre: true } } },
    orderBy: { fechaEntrega: 'asc' },
    take: 3,
  })
  ```
  * El orden ascendente hace que las entregas **vencidas** (fecha < hoy) aparezcan primero. El resaltado de "atrasado" se resuelve en el frontend.

* **Mantener:** `statsPresupuestos` (`groupBy` por estado) y `statsFinanzas` (transacciones del mes). De ahí salen `porCobrar` y los KPIs `ingresosMes/egresosMes/utilidadMes` como hoy.

* **Payload de respuesta:**
  * `kpis`: `{ ingresosMes, egresosMes, utilidadMes, porCobrar }` — **quitar `insumosBajosCount`** (se deriva en el cliente).
  * **Quitar** `insumosBajos`.
  * **Agregar** `proximosEntregar`.
  * Mantener `presupuestosRecientes` y `statsPorEstado`.

#### [REFERENCE] [fsm.ts](file:///d:/Desarrollando/presumemy/api/src/utils/fsm.ts)
* **Sin cambios.** Se verifica que `cerrado: ['facturado', 'en_curso']` siga vigente (fuente de verdad de la reapertura). Solo referencia.

---

### 2. Frontend SPA (web/)

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* **Interfaz `DashboardStats`:**
  * En `kpis`, **eliminar `insumosBajosCount`** (queda `ingresosMes`, `egresosMes`, `utilidadMes`, `porCobrar`).
  * **Eliminar** `insumosBajos: Pick<Insumo, ...>[]`.
  * **Agregar** `proximosEntregar: Presupuesto[]`.
  * Mantener `presupuestosRecientes: Presupuesto[]` y `statsPorEstado`.
  * (La forma de `capacidadFabricacion` no va en `DashboardStats`: es un `computed` local sobre `productosStore`.)

#### [MODIFY] [DashboardView.vue](file:///d:/Desarrollando/presumemy/web/src/views/DashboardView.vue)

* **C1 — Quitar gráfico de ingresos semanales:**
  * Eliminar el `<div class="card">` del gráfico (markup "Ingresos por semana · últimas 8", ~líneas 179-204).
  * Eliminar las constantes `chartData`/`chartMax` (~45-46) y la función `moneyShort` (~29-34).

* **Orquestación de carga (híbrido):** el dashboard ahora necesita, además de `/dashboard/stats`, que `productosStore` e `insumosStore` estén cargados (para capacidad y conteo de reposición). En `onMounted`:
  ```typescript
  await Promise.all([
    store.fetch(),
    productosStore.hasFetched ? Promise.resolve() : productosStore.fetch(),
    insumosStore.hasFetched ? Promise.resolve() : insumosStore.fetch(),
  ])
  preloadStores() // resto (clientes, finanzas, presupuestos) sigue como prefetch de navegación
  ```
  * Ajustar `showLoading` para considerar también que `productosStore`/`insumosStore` tengan datos antes de pintar el panel de capacidad (o mostrar un loading local en ese panel hasta `productosStore.hasFetched`).

* **C5 (derivado) — `capacidadFabricacion` como computed sobre `productosStore`:**
  ```typescript
  const capacidadFabricacion = computed(() => {
    return productosStore.data
      .filter(p => p.tieneBom)
      .map(p => {
        const consumo = new Map<number, { nombre: string; stock: number; cantidad: number }>()
        for (const l of p.bomLineas ?? []) {
          if (!l.insumo || l.insumoId == null) continue
          const cantidad = Number(l.cantidad)
          if (cantidad <= 0) continue
          const prev = consumo.get(l.insumo.id)
          if (prev) prev.cantidad += cantidad
          else consumo.set(l.insumo.id, { nombre: l.insumo.nombre, stock: Number(l.insumo.stock), cantidad })
        }
        if (consumo.size === 0) return null
        let capacidad = Infinity, insumoLimitante = ''
        for (const ins of consumo.values()) {
          const u = Math.floor(ins.stock / ins.cantidad)
          if (u < capacidad) { capacidad = u; insumoLimitante = ins.nombre }
        }
        return { id: p.id, codigo: p.codigo, nombre: p.nombre, favorito: p.favorito, capacidad, insumoLimitante }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => (Number(b.favorito) - Number(a.favorito)) || (a.capacidad - b.capacidad))
      .slice(0, 10)
  })
  ```

* **KPI fila superior — "Insumos a reponer" (derivado):**
  * Renombrar la tercera tarjeta de `Insumos bajos` a **"Insumos a reponer"**.
  * Valor por computed: `const insumosAReponer = computed(() => insumosStore.data.filter(i => i.stock < i.stockMinimo).length)`.
  * Subtexto "Revisar inventario" enlazando a `/insumos`.

* **C2 + C4 — Panel "Presupuestos recientes":**
  * Sin cambios estructurales en el markup (sigue iterando `store.stats.presupuestosRecientes`). El nuevo orden/filtro llega del backend. Verificar que el título siga "Presupuestos recientes".

* **C3 — Panel nuevo "Próximos a entregar":**
  * Card con header "Próximos a entregar" (+ "Ver todos" → `/presupuestos`, opcional).
  * Iterar `store.stats.proximosEntregar`: folio, cliente, temática y `fechaEntrega` formateada.
  * **Atraso:** `const atrasado = new Date(p.fechaEntrega) < hoy` (a medianoche). Si está atrasado, resaltar fila/badge en `--coral-500` con etiqueta "atrasado" (coral solo para alerta, según design system). Los atrasados quedan arriba por el orden del backend.
  * Click → `router.push({ name: 'presupuestos', query: { edit: p.folio } })`.
  * Empty state: "Sin entregas próximas".

* **C5 — Panel nuevo "Capacidad de fabricación" (reemplaza "Insumos bajos"):**
  * Card con header "Capacidad de fabricación" (+ "Ver productos" → `/productos`).
  * Iterar `capacidadFabricacion` (computed): nombre + código, estrella `★` si `favorito`, copy **"Capacidad actual: {capacidad} unidades"** y línea secundaria "limitado por: {insumoLimitante}".
  * Resaltar capacidad crítica (ej. `capacidad === 0` en `--coral-500`, baja en tono de advertencia) reutilizando la semántica de stock del design system.
  * Click → `router.push({ name: 'productos', query: { edit: i.codigo } })`.
  * Empty state: "Sin productos con receta de insumos".

* **Layout del cuerpo (decisión: recientes ancho + 2 apilados):**
  * Mantener `grid-2`. Izquierda: "Presupuestos recientes" (panel alto). Derecha: contenedor en columna (gap `--s-4`) con "Próximos a entregar" arriba y "Capacidad de fabricación" abajo.
  * Eliminar todo resto del antiguo panel "Insumos bajos" y del bloque del gráfico.

#### [MODIFY] [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/components/editors/PresupuestoEditor.vue)

* **Fix de reapertura — sincronizar `TRANSITIONS` con el FSM del backend:**
  * En el objeto `TRANSITIONS` (~línea 44), cambiar `cerrado: ['facturado'],` por `cerrado: ['facturado', 'en_curso'],`.
  * Sin copy especial: la opción aparece como **"En curso"** vía `statusTones`. Al confirmarla se dispara el `patch(.../estado, { estado: 'en_curso' })` existente; el backend limpia `fechaFinalizacion` e `isEditable` rehabilita la edición.
  * (Opcional, fuera de alcance) A futuro, centralizar las transiciones en un módulo compartido front/back para evitar que se vuelvan a desincronizar.

---

## Verification Plan

### Automated Tests
- Tipos en `/web`: `npx vue-tsc -b`.
- Tipos en `/api`: `npx tsc --noEmit`.
- Tests de API en `/api`: `npm run test`.

### Manual Verification

1. **C1 — Gráfico removido:** el Home ya no muestra "Ingresos por semana"; sin errores de consola por variables sin usar.
2. **C2 + C4 — Presupuestos recientes:** excluye `facturado`/`cancelado`; editar un presupuesto antiguo lo lleva al tope (orden por `updatedAt`); máximo 5.
3. **C3 — Próximos a entregar:** presupuestos con `fechaEntrega` futura aparecen por fecha ascendente, máximo 3; uno con fecha pasada (sin cerrar) aparece **primero y resaltado** como atrasado; sin `fechaEntrega`/`facturado`/`cancelado` no aparecen.
4. **C5 — Capacidad de fabricación (derivado):**
   - Un producto con receta de insumos muestra "Capacidad actual: N unidades" (N = floor(stock/cantidad) del insumo más escaso) e indica el limitante.
   - Bajar/subir el stock del insumo limitante **actualiza el panel sin recargar la página** (reactividad del computed) tras refrescar el store de insumos.
   - Favoritos primero; dentro de cada grupo, menor capacidad primero; máximo 10.
   - Un producto con receta pero sin líneas de insumo **no aparece**.
   - La tarjeta KPI muestra "Insumos a reponer" con el conteo de insumos bajo mínimo.
5. **Híbrido — sin redundancia:** en la pestaña Network, la carga del Home **no** trae insumos dos veces para el mismo fin; `/dashboard/stats` ya no incluye `insumosBajos` ni capacidad.
6. **Reapertura del FSM:** un presupuesto `cerrado` ofrece "En curso" en el dropdown; al guardarlo vuelve a `en_curso`, sus campos vuelven a ser editables y `fechaFinalizacion` queda en null; desde ahí puede volver a `cerrado` y luego `facturado`.
