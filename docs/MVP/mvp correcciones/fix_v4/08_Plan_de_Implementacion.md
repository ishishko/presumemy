# Plan de Implementación 08: Epic D — Backlog técnico (signo Egresos, búsqueda global, paginación, tokens de canales, medidas de productos y sanitización de domicilio)

Este plan salda los pendientes accionables de **Epic D** del [01_Estado_Actual.md](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/fix_v4/01_Estado_Actual.md). Corrige el modelo de datos del signo de movimientos de Finanzas, conecta la búsqueda global del topbar (hoy decorativa) contra un endpoint multi-entidad, agrega paginación de presentación a las listas que más crecen, tokeniza los colores de canal hardcodeados en Clientes, incorpora un campo de medidas estructurado a Productos y corrige un bug de pérdida de datos en el domicilio del negocio.

## Alcance

**Incluido:**
1. **P1 — Signo en Egresos** (Alta)
2. **P2 — Búsqueda global en topbar** (Alta)
3. **P3 — Paginación de presentación** en Presupuestos y Finanzas (Media)
4. **P4 — Tokenización de colores de canal** en Clientes (Media)
5. **P8 — Campo Medidas en Productos** (excepción explícita pese a ser Baja)
6. **P9 — Sanitización del JSONB de domicilio** (incluido por ser un bug de pérdida de datos)

**Fuera de alcance (diferidos):** ampliación de tests Vitest, Export CSV, Modo oscuro y Dashboard V2.

## User Review Required

> [!IMPORTANT]
> **Modelo de signo de movimientos (`monto`) — se adopta el "Modelo B" (monto absoluto + signo derivado del `tipo`):**
> - El `monto` se almacena **siempre positivo** (`>= 0.01`, como ya exige el Zod). Si un movimiento es ingreso o egreso se deriva de su `tipo`, no del signo numérico del monto.
> - El signo deja de ser un dato y pasa a ser una **función única del `tipo`** (`esEgreso(tipo)`), eliminando la contradicción actual entre el drawer, la tabla de Finanzas, el Zod y el cálculo de KPIs.

> [!IMPORTANT]
> **Campo Medidas de Producto — una sola columna `medidas Json?` (JSONB estructurado):**
> - Una única columna almacena un objeto `{ tipo: 'plano' | 'cuerpo', base, altura, profundidad?, unidad: 'cm' }`.
> - **Plano (2D):** Base × Altura. **Cuerpo (3D):** Base × Altura × Profundidad.
> - La UI usa un control segmentado accesible para alternar plano/cuerpo y muestra los campos correspondientes.

> [!IMPORTANT]
> **Bug de pérdida de datos en domicilio (P9):** hoy la UI escribe el campo `ciudad` pero el Zod valida `localidad`; al no ser `.strict()`, Zod **descarta `ciudad` en silencio** y el dato se pierde al guardar. Se reconcilian los nombres de campo y se endurece la validación.

---

## Proposed Changes

### P1 — Signo en Egresos

#### [MODIFY] [finanzas.ts (tipos)](file:///d:/Desarrollando/presumemy/api/src/types/finanzas.ts)
* Exportar una **fuente única de clasificación** de tipos: `TIPOS_EGRESO` (y/o `TIPOS_INGRESO`) más un helper `esEgreso(tipo): boolean`. Hoy esta clasificación está duplicada (en `tipoMovs[].sign` del front y en `tiposIngreso`/`tiposEgreso` dentro de `finanzas.ts`).
* `monto: z.coerce.number().min(0.01)` se mantiene (ya exige positivo); documentar que el almacenamiento es **absoluto**.

#### [MODIFY] [finanzas.ts (route)](file:///d:/Desarrollando/presumemy/api/src/routes/finanzas.ts)
* En `getKpisForPeriod`, reemplazar las listas locales `tiposIngreso`/`tiposEgreso` por las constantes compartidas exportadas desde los tipos, para que la clasificación viva en un solo lugar.
* Sin cambios en el `POST`/`PUT`: ya guarda el `monto` tal cual (positivo).

#### [MODIFY] [MovimientoDrawer.vue](file:///d:/Desarrollando/presumemy/web/src/components/drawers/MovimientoDrawer.vue)
* `monto` computed: enviar `Math.abs(valor)` (positivo), eliminando el factor de signo `(signo === 'in' ? 1 : -1)`.
* Al cargar un movimiento para editar, derivar `signo` desde el `tipo` (vía `esEgreso(tipo)` / `tipoMovs[].sign`), **no** desde `Number(t.monto) >= 0`. El `valor` ya usa `Math.abs(Number(t.monto))`.
* Mantener el `watch(tipo)` que autoselecciona el signo desde la metadata del tipo (ya correcto).

#### [MODIFY] [FinanzasView.vue](file:///d:/Desarrollando/presumemy/web/src/views/FinanzasView.vue)
* En la celda de monto (`fin-monto-pos`/`fin-monto-neg` y `signedMoney`), derivar el signo desde `esEgreso(m.tipo)` en lugar de `Number(m.monto) >= 0`. El monto crudo ahora es siempre positivo.
* Reusar la clasificación compartida (evitar redefinir signos localmente en `tipoMovs`).

---

### P2 — Búsqueda global en topbar (4 entidades, dropdown)

#### [CREATE] [search.ts](file:///d:/Desarrollando/presumemy/api/src/routes/search.ts)
* `GET /api/search?q=...` protegido por `authMiddleware`.
* Validar `q` (mínimo 2 caracteres); si no cumple, devolver resultados vacíos.
* Consultar en paralelo (`Promise.all`) las 4 entidades, respetando `activo` (soft-delete) y `take: 5` por entidad:
  * **Presupuestos:** `folio`, temática y nombre de cliente (`contains`, `mode: 'insensitive'`).
  * **Clientes:** `nombre`, `codigo`, valor de contacto.
  * **Productos:** `codigo`, `nombre`.
  * **Insumos:** `codigo`, `nombre`.
* Devolver una respuesta **normalizada** por resultado: `{ tipo, id, codigo, titulo, subtitulo }`, de modo que el frontend no conozca el esquema de cada entidad.

#### [MODIFY] [index.ts](file:///d:/Desarrollando/presumemy/api/src/index.ts)
* Importar y registrar `app.route('/api/search', searchRoutes)`.

#### [CREATE] [useGlobalSearch.ts](file:///d:/Desarrollando/presumemy/web/src/composables/useGlobalSearch.ts)
* Composable con `query`, `results`, `loading`, `error`.
* Debounce de 300 ms, longitud mínima 2, request **abortable** (cancelar la consulta anterior al teclear con `AbortController`).

#### [MODIFY] [AppHeader.vue](file:///d:/Desarrollando/presumemy/web/src/components/layout/AppHeader.vue)
* Conectar `v-model` del `<input>` al `query` del composable.
* Dropdown de resultados bajo el input (panel `--surface`, `1px solid var(--border)`, `--shadow-1`, `--r-lg`, entrada 180 ms `cubic-bezier(0.2, 0.8, 0.2, 1)`).
* Resultados agrupados por tipo, con ícono Lucide por entidad y `titulo` + `subtitulo`.
* Navegación por teclado: ↑/↓ mover selección, **Enter abre el primer resultado** (o el resaltado), Esc cierra. Cerrar también al click-fuera y al cambiar de ruta.
* Click/Enter sobre un resultado → reusar el patrón de deep-link existente `router.push({ name, query: { edit: codigo } })`:
  * Presupuesto → `{ name: 'presupuestos', query: { edit: folio } }`
  * Cliente → `{ name: 'clientes', query: { edit: codigo } }`
  * Producto → `{ name: 'productos', query: { edit: codigo } }`
  * Insumo → `{ name: 'insumos', query: { edit: codigo } }`

> **Verificación previa:** confirmar que `ProductosView`, `InsumosView` y `ClientesView` observen `route.query.edit` para abrir su overlay (PresupuestosView ya lo hace; el Dashboard ya navega con `edit` a productos/insumos). Si alguna no lo tiene, agregar el watcher con el mismo patrón de [PresupuestosView.vue:195](file:///d:/Desarrollando/presumemy/web/src/views/PresupuestosView.vue).

---

### P3 — Paginación de presentación (Presupuestos + Finanzas)

Estrategia: **client-side sobre datos ya filtrados en memoria** (los filtros/orden actuales son client-side). No se mueve la arquitectura de filtros al servidor.

#### [CREATE] [usePagination.ts](file:///d:/Desarrollando/presumemy/web/src/composables/usePagination.ts)
* `usePagination(items, pageSize)` → expone `pageItems`, `page`, `totalPages`, `next`, `prev`, `goTo`. Resetear a página 1 cuando cambia el conjunto filtrado.

#### [CREATE] [Pagination.vue](file:///d:/Desarrollando/presumemy/web/src/components/ui/Pagination.vue)
* Controles prev/next + indicador "página X de Y", estilado con el design system (botones `.btn-secondary`/`.btn-ghost`, deshabilitados al 50% sin fondo gris). Tipografía y `tabular-nums` para los números.

#### [MODIFY] [presupuestos.ts (store)](file:///d:/Desarrollando/presumemy/web/src/stores/presupuestos.ts) y [finanzas.ts (store)](file:///d:/Desarrollando/presumemy/web/src/stores/finanzas.ts)
* **Matar la truncación silenciosa del `limit: 100`:** subir el `limit` de fetch (p. ej. 1000) o traer todas las páginas en la carga inicial, de modo que la paginación visual no oculte filas.

#### [MODIFY] [PresupuestosView.vue](file:///d:/Desarrollando/presumemy/web/src/views/PresupuestosView.vue) y [FinanzasView.vue](file:///d:/Desarrollando/presumemy/web/src/views/FinanzasView.vue)
* Aplicar `usePagination` sobre la lista ya filtrada y renderizar `<Pagination>` al pie de la tabla. En Finanzas, aplicar al libro de movimientos (tab "movimientos").

---

### P4 — Tokenización de colores de canal (Clientes)

#### [MODIFY] [colors_and_type.css](file:///d:/Desarrollando/presumemy/docs/MVP/design-system/project/colors_and_type.css)
* Agregar tokens de canal: `--canal-instagram` (#D7548C), `--canal-whatsapp` (#1F8A5B), `--canal-mail`, `--canal-otros`.
* Donde ya exista token equivalente, reusarlo: `otros` (#6B6270) → `--ink-muted`; introducir `--teal-ink` (#2E6F70) y reusarlo también en los badges de Finanzas.

#### [MODIFY] [ClientesView.vue](file:///d:/Desarrollando/presumemy/web/src/views/ClientesView.vue)
* Reemplazar los hex crudos de `canalColors` (líneas ~22-26) por `var(--canal-*)`.
* Cerrar la duplicación de `#8B2570` → `var(--violet-700)` en las palettes de avatar (líneas ~38-40).

---

### P8 — Campo Medidas en Productos (JSONB estructurado plano/cuerpo)

#### [MODIFY] [schema.prisma](file:///d:/Desarrollando/presumemy/api/prisma/schema.prisma)
* Modelo `Producto`: agregar `medidas Json? @map("medidas")` (una sola columna).

#### [MODIFY] [seed.ts](file:///d:/Desarrollando/presumemy/api/prisma/seed.ts)
* Opcional: poblar algunos productos de ejemplo con medidas plano/cuerpo para validar la UI.

#### [MODIFY] [productos.ts (tipos)](file:///d:/Desarrollando/presumemy/api/src/types/productos.ts)
* Agregar al `productoSchema` la validación de `medidas`:
  * `z.object({ tipo: z.enum(['plano','cuerpo']), base: z.number().positive(), altura: z.number().positive(), profundidad: z.number().positive().optional(), unidad: z.string().default('cm') }).optional().nullable()`.
  * Validación condicional: `profundidad` **obligatoria** si `tipo === 'cuerpo'` (vía `superRefine`/`refine`).

#### [MODIFY] [productos.ts (route)](file:///d:/Desarrollando/presumemy/api/src/routes/productos.ts)
* En `POST`/`PUT`, persistir `medidas` (con manejo de `Prisma.JsonNull` cuando sea `null`, como ya se hace con `domicilio` en Ajustes).

#### [MODIFY] [index.ts (types front)](file:///d:/Desarrollando/presumemy/web/src/types/index.ts)
* Agregar a la interfaz `Producto` el tipo de `medidas` (`{ tipo: 'plano' | 'cuerpo'; base: number; altura: number; profundidad?: number; unidad: string } | null`).

#### [MODIFY] [ProductoDetalle.vue](file:///d:/Desarrollando/presumemy/web/src/components/overlays/ProductoDetalle.vue)
* **Edición (UX/accesibilidad excelentes):**
  * Interruptor flip switch accesible **"Plano / Cuerpo"** usando la clase `.medidas-toggle-group` ajustada a las reglas de estilo de `.checkbox-wrapper-10`.
  * Inputs numéricos para Base, Altura y —solo en cuerpo— Profundidad: `<label>` real asociado, `inputmode="decimal"`, sufijo de unidad (`cm`), focus ring teal del DS, validación de positivos.
  * Al cambiar de plano a cuerpo se revela Profundidad; al volver a plano se preserva/limpia coherentemente.
* **Display:** render "30 × 20 cm" (plano) o "30 × 20 × 15 cm" (cuerpo) con ícono dimensional Lucide, respetando `tabular-nums`.

---

### P9 — Sanitización del JSONB de domicilio

#### [MODIFY] [ajustes.ts](file:///d:/Desarrollando/presumemy/api/src/routes/ajustes.ts)
* **Reconciliar los nombres de campo** del objeto `domicilio` entre Zod y la UI (hoy Zod tiene `localidad`/`provincia` y la UI escribe `ciudad`). Definir el set canónico de claves (p. ej. `calle`, `numero`, `ciudad`, `provincia`) y usarlo en ambos lados.
* Endurecer el `z.object(domicilio)` con `.strict()` (rechazar/whitelistear claves desconocidas) y aplicar `.trim()` a los valores string, evitando basura y pérdida silenciosa en el JSONB.

#### [MODIFY] [AjustesView.vue](file:///d:/Desarrollando/presumemy/web/src/views/AjustesView.vue)
* Ajustar los campos del formulario de domicilio para que coincidan exactamente con el set canónico de claves del Zod, eliminando el desajuste `ciudad`/`localidad`.

---

### P10 — Reemplazo de SegmentedControl por Flip Switch en Entrega de Presupuestos

#### [MODIFY] [PresupuestoEditor.vue](file:///d:/Desarrollando/presumemy/web/src/components/editors/PresupuestoEditor.vue)
* Reemplazar el `SegmentedControl` (Retira/Envío) por un flip switch con la clase `.segmented` alineada al centro (`align-self: center`) de forma vertical para optimizar el espacio horizontal del campo contiguo `ed-lugar-envio`.

#### [MODIFY] [components.css](file:///d:/Desarrollando/presumemy/web/src/assets/css/components.css)
* Unificar la clase `.segmented` agregándola a todos los selectores de `.checkbox-wrapper-10` y `.medidas-toggle-group` globales para compatibilidad total de diseño y comportamiento, removiendo las clases de segmented antiguas.

---

## Verification Plan

### Automated Tests
- Typecheck frontend: `npx vue-tsc -b` (dentro de `web/`).
- Typecheck backend: `npx tsc --noEmit` (dentro de `api/`).
- Tests de API: `npm run test` (dentro de `api/`).

### Manual Verification
1. **Migración:** correr `npm run db:migrate` y validar la nueva columna `medidas` en `productos`.
2. **P1 — Egresos:** crear un movimiento de egreso (p. ej. "Compra insumo") y verificar que (a) se guarda sin error 400, (b) la tabla lo muestra con "−" y color coral, y (c) el KPI de egresos y la utilidad del mes son correctos.
3. **P2 — Búsqueda:** escribir ≥2 caracteres en el topbar; verificar resultados agrupados de las 4 entidades, navegación por teclado, Enter abre el primer resultado y el overlay/editor correcto se abre vía `?edit=`.
4. **P3 — Paginación:** en Presupuestos y Finanzas, verificar controles de página, que filtrar resetea a página 1 y que ninguna fila se trunca con >100 registros.
5. **P4 — Tokens:** inspeccionar en el DOM que los puntos de canal y los inks de avatar usan variables CSS (no hex crudos).
6. **P8 — Medidas:** crear un producto plano (Base × Altura) y uno cuerpo (Base × Altura × Profundidad); verificar el control segmentado, la accesibilidad por teclado, la validación de positivos/profundidad y el render del display.
7. **P9 — Domicilio:** tipear "Ciudad" en Ajustes, guardar, recargar y confirmar que el valor **persiste** (ya no se descarta). Verificar que claves desconocidas no se almacenan.
