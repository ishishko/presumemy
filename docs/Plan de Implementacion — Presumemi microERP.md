# Plan de Implementacion — Presumemi microERP

## Contexto

**Presumemi** es un microERP web para MemyDeni (negocio artesanal de articulos de papel, Argentina). El proyecto es 100% greenfield — solo existe documentacion y un prototipo React como referencia visual. No hay codigo fuente.

**Objetivo:** Implementar el MVP completo en Nuxt 3 siguiendo las 5 fases definidas en CLAUDE.md, usando la documentacion en `docs/` como especificacion y el prototipo interactivo en `docs/MVP/design-system/project/ui_kits/presumemi/` como referencia pixel-perfect.

**Stack:** Nuxt 3, Vue 3 (Composition API, `<script setup>`), Nitro, PostgreSQL/Supabase, Prisma, Supabase Auth, Pinia, Tailwind CSS + DaisyUI, Zod, Lucide icons, fuente Onest.

---

## FASE 1 — Base (Setup + Schema + Auth + Layout)

### 1.1 Inicializar proyecto Nuxt 3

| Archivo | Responsabilidad |
|---|---|
| `package.json` | Deps: nuxt, @nuxtjs/supabase, @pinia/nuxt, @nuxtjs/tailwindcss, prisma, @prisma/client, zod, lucide-vue-next, daisyui |
| `nuxt.config.ts` | Modules, css imports, app head (Onest font), runtimeConfig, hooks pages:extend para modulos |
| `tailwind.config.ts` | Extender theme con tokens del design system (colors, font, spacing, radius, shadows) |
| `tsconfig.json` | Hereda de .nuxt/tsconfig.json, paths para ~/modules/* y ~/shared/* |
| `.env.example` | Template: DATABASE_URL, DIRECT_URL, SUPABASE_URL, SUPABASE_KEY, SUPABASE_SERVICE_KEY |
| `.gitignore` | node_modules, .nuxt, .output, .env |

### 1.2 CSS base y tokens

| Archivo | Responsabilidad |
|---|---|
| `assets/css/tokens.css` | Copia de `colors_and_type.css` — todas las CSS custom properties |
| `assets/css/components.css` | Estilos reutilizables extraidos de `styles.css`: .btn-*, .card, .badge, .field, .input, .data-table, .stock-bar, .drawer, etc. |
| `assets/css/main.css` | Import de tokens + components. Registrado en nuxt.config.ts css[] |

**Ref:** `docs/MVP/design-system/project/colors_and_type.css`, `docs/MVP/design-system/project/ui_kits/presumemi/styles.css`

### 1.3 Prisma schema (16 tablas)

**Archivo:** `prisma/schema.prisma`

**Config (1):** configuracion_negocio (id=1, nombre, logo_url, domicilio JSON, contacto_canal, contacto_valor, moneda, cancelacion_auto, dias_espera)

**Productos (7):** categorias_producto, categorias_insumo, proveedores, insumos (con costo_unitario calculado en app), insumo_proveedor (max 3, 1 principal), productos (tiene_bom, tipo_ganancia, precio_calculado en app, validacion en app), costo_producto_insumo (BOM con tipo_linea enum)

**Comercial (4):** clientes (codigo auto C-{id}), cliente_contactos (canal enum, es_principal), presupuestos (FSM 6 estados, total calculado en app), detalle_presupuesto (precio congelado, subtotal calculado en app)

**Finanzas (3):** distribucion_ganancias (3 filas fijas), transacciones (12 tipos movimiento, inmutable created_at), ordenes_imprenta

**Reglas:**
- Sin hard delete: `activo = false`
- Sin FLOAT: todo Decimal
- Campos GENERATED de PG se calculan en capa de aplicacion (Prisma no soporta nativamente)

### 1.4 Migracion y seed

| Archivo | Responsabilidad |
|---|---|
| `prisma/seed.ts` | 9 categorias_producto, 8 categorias_insumo, proveedores, 18 insumos (de INSUMOS_RICH), 3 distribucion (Meme 40%, Pety 30%, Gastos 30%), configuracion inicial |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/data.jsx`, `insumo_detalle.jsx`

### 1.5 Utilidades server

| Archivo | Responsabilidad |
|---|---|
| `server/utils/prisma.ts` | Singleton PrismaClient |
| `server/utils/errors.ts` | Helpers createError tipados |
| `server/utils/validators.ts` | Schemas Zod reutilizables (paginacion, id, decimal) |

### 1.6 Auth (Supabase)

| Archivo | Responsabilidad |
|---|---|
| `layouts/auth.vue` | Layout login: fondo page-bg, centrado, sin shell |
| `modules/auth/pages/login.vue` | Logo 220px, email, password, boton "Iniciar sesion", manejo errores |
| `modules/auth/composables/useAuth.ts` | Wrapper: login(), logout(), user computed |
| `middleware/auth.global.ts` | Redirige a /login si no hay sesion; redirige a / si ya logueado |

### 1.7 Layout principal (shell)

| Archivo | Responsabilidad |
|---|---|
| `app.vue` | `<NuxtLayout><NuxtPage /></NuxtLayout>` |
| `layouts/default.vue` | Grid 240px + 1fr, min-h 100vh |
| `shared/components/TheSidebar.vue` | Sticky 100vh, violet-700, logo en card blanco, nav 2 secciones (Operacion + Datos), footer (Ajustes + avatar + logout). Lucide icons 24px |
| `shared/components/TheTopbar.vue` | 56px, sticky, blur backdrop, breadcrumbs, search input |
| `shared/components/PageHead.vue` | Props: title, sub. Slot actions |
| `shared/components/BaseCard.vue` | Props: highlight. .card con shadow-1, border, r-lg |
| `shared/components/BaseBadge.vue` | Props: tone, dot |
| `shared/components/BaseToast.vue` | Teleport body, autohide 2.4s |
| `shared/components/BaseDrawer.vue` | Scrim + aside 520px, slide-in. Slots: header, body, footer |
| `shared/components/BaseButton.vue` | Props: variant, size, disabled |
| `shared/components/BaseInput.vue` | Label, hint, error |
| `shared/components/BaseSelect.vue` | Wrapper select |
| `shared/components/BaseTable.vue` | .data-table, props: columns. Slot tbody |
| `shared/composables/useToast.ts` | Show/hide toast global |
| `shared/types/index.ts` | Paginacion, ApiResponse<T>, SelectOption |
| `shared/utils/money.ts` | money(n), moneyShort(n) formato $ 1,250.00 |
| `shared/utils/dates.ts` | fmtFecha(), fmtFechaCorta(), todayISO() |
| `pages/index.vue` | Redirect a /dashboard |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/shell.jsx`

### 1.8 Pagina placeholder Dashboard

`modules/dashboard/pages/dashboard.vue` — PageHead "Hola, [usuario]", cards vacias. Se completa en Fase 5.

### Verificacion Fase 1
- `npm run dev` arranca sin errores
- /login muestra formulario con logo, login funciona con Supabase
- Shell visible: sidebar violet, topbar blur, content scrollable
- Sidebar navega entre rutas
- `npx prisma studio` muestra 16 tablas con seed data
- Tokens CSS y Onest funcionan

---

## FASE 2 — Productos (Insumos + Catalogo + BOM)

### 2.1 API Insumos

| Archivo | Responsabilidad |
|---|---|
| `modules/insumos/types/index.ts` | Insumo, InsumoCreate, InsumoUpdate, NivelStock |
| `modules/insumos/server/api/insumos/index.get.ts` | Lista con filtros (estado, categoria), include proveedor principal |
| `modules/insumos/server/api/insumos/index.post.ts` | Crear, calcular costo_unitario, validar Zod |
| `modules/insumos/server/api/insumos/[id].get.ts` | Detalle con proveedores |
| `modules/insumos/server/api/insumos/[id].put.ts` | Actualizar, recalcular costo_unitario |
| `modules/insumos/server/api/insumos/[id].delete.ts` | Soft delete |
| `modules/insumos/utils/computeNivel.ts` | computeNivel(stock, min) -> critico/bajo/ok |

### 2.2 Store Insumos

| Archivo | Responsabilidad |
|---|---|
| `modules/insumos/stores/useInsumosStore.ts` | State, actions CRUD, getters (counts por nivel, filtered) |
| `modules/insumos/composables/useInsumoForm.ts` | Form state, validacion Zod, submit |

### 2.3 Pagina Insumos (lista)

| Archivo | Responsabilidad |
|---|---|
| `modules/insumos/pages/insumos.vue` | PageHead + pills estado + pills categoria + tabla |
| `modules/insumos/components/InsumoStatePills.vue` | Pills Todos/Critico/Bajo/OK con contadores y dots |
| `modules/insumos/components/InsumoCategoryPills.vue` | Pills de las 8 categorias |
| `modules/insumos/components/InsumoTable.vue` | Tabla: nombre+codigo, categoria, stock, minimo, costo, proveedor, stock-bar, badge |
| `modules/insumos/components/InsumoStockBar.vue` | Barra 6px con color por nivel |
| `modules/insumos/components/InsumoStateBadge.vue` | Badge con dot |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/screens.jsx` (InsumosScreen)

### 2.4 Detalle Insumo (overlay)

| Archivo | Responsabilidad |
|---|---|
| `modules/insumos/components/InsumoDetalleOverlay.vue` | Fullscreen overlay (left:240px). Header + form (nombre, categoria, unidad, stock, costo_paquete, cantidad_pack, costo_unitario readonly) + proveedores table + footer |
| `modules/insumos/components/InsumoProveedoresTable.vue` | Mini-tabla editable proveedores, toggle es_principal |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/insumo_detalle.jsx`

### 2.5 API Productos

| Archivo | Responsabilidad |
|---|---|
| `modules/productos/types/index.ts` | Producto, ProductoConBOM, CostoProductoInsumo |
| `modules/productos/server/api/productos/index.get.ts` | Lista con filtro categoria |
| `modules/productos/server/api/productos/index.post.ts` | Crear con BOM |
| `modules/productos/server/api/productos/[id].get.ts` | Detalle con BOM |
| `modules/productos/server/api/productos/[id].put.ts` | Actualizar + BOM (replace) |
| `modules/productos/server/api/productos/[id].delete.ts` | Soft delete |
| `modules/productos/server/api/categorias-producto/index.get.ts` | Lista categorias |

### 2.6 Store Productos

| Archivo | Responsabilidad |
|---|---|
| `modules/productos/stores/useProductosStore.ts` | State, CRUD, filtroCategoria, vistaMode (grid/lista) |
| `modules/productos/composables/useProductoForm.ts` | Form + BOM management |

### 2.7 Pagina Catalogo (grid + lista)

| Archivo | Responsabilidad |
|---|---|
| `modules/productos/pages/catalogo.vue` | PageHead + toggle vista + pills categoria + grid o tabla |
| `modules/productos/components/ProductoGridView.vue` | Grid 4 cols (.prod-grid) de ProductoCard |
| `modules/productos/components/ProductoListView.vue` | Tabla lista |
| `modules/productos/components/ProductoCard.vue` | Card: thumb, nombre, meta, precio |
| `modules/productos/components/CategoriaFilter.vue` | Pills de categoria |
| `modules/productos/components/ViewToggle.vue` | Toggle grid/lista |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/screens.jsx` (CatalogoScreen)

### 2.8 Detalle Producto (overlay con BOM)

| Archivo | Responsabilidad |
|---|---|
| `modules/productos/components/ProductoDetalleOverlay.vue` | Overlay: form + BOM spreadsheet + precios + footer |
| `modules/productos/components/BomSpreadsheet.vue` | Tabla editable: tipo (insumo/cameo/embalaje/extra), autocomplete insumo, cantidad, costo, subtotal auto |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/producto_detalle.jsx`

### Verificacion Fase 2
- /insumos muestra tabla con 18 insumos seed, filtros funcionan
- Detalle insumo editable, costo_unitario se calcula auto
- /catalogo muestra grid, toggle a lista, filtro categoria
- Detalle producto con BOM editable
- CRUD completo persiste en BD, soft delete funciona

---

## FASE 3 — Comercial (Clientes + Presupuestos)

### 3.1 API Clientes

| Archivo | Responsabilidad |
|---|---|
| `modules/clientes/types/index.ts` | Cliente, ClienteContacto, CanalType |
| `modules/clientes/server/api/clientes/index.get.ts` | Lista con aggregate pedidos/total |
| `modules/clientes/server/api/clientes/index.post.ts` | Crear con contactos |
| `modules/clientes/server/api/clientes/[id].get.ts` | Detalle con contactos + presupuestos |
| `modules/clientes/server/api/clientes/[id].put.ts` | Actualizar cliente + contactos |
| `modules/clientes/server/api/clientes/[id].delete.ts` | Soft delete |

### 3.2 Pagina Clientes

| Archivo | Responsabilidad |
|---|---|
| `modules/clientes/stores/useClientesStore.ts` | Store |
| `modules/clientes/pages/clientes.vue` | Tabla con avatars, canales, pedidos, totales |
| `modules/clientes/components/ClienteAvatar.vue` | Iniciales + paleta deterministica |
| `modules/clientes/components/ClienteTable.vue` | Tabla clientes |
| `modules/clientes/utils/avatarPalette.ts` | avatarPaletteFor(name), initialsFor(name) |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/screens.jsx` (ClientesScreen), `cliente_detalle.jsx`

### 3.3 Detalle Cliente (overlay)

| Archivo | Responsabilidad |
|---|---|
| `modules/clientes/components/ClienteDetalleOverlay.vue` | Avatar + form (nombre, domicilio JSON, notas) + contactos table + historial presupuestos |
| `modules/clientes/components/ContactosTable.vue` | Tabla editable canales (instagram/whatsapp/mail/otros), toggle principal |

### 3.4 API Presupuestos

| Archivo | Responsabilidad |
|---|---|
| `modules/presupuestos/types/index.ts` | Presupuesto, DetallePresupuesto, EstadoPresupuesto, FSM |
| `modules/presupuestos/server/api/presupuestos/index.get.ts` | Lista con filtro estado, include cliente |
| `modules/presupuestos/server/api/presupuestos/index.post.ts` | Crear con detalles, congelar precios, calcular total |
| `modules/presupuestos/server/api/presupuestos/[id].get.ts` | Detalle con lineas + cliente |
| `modules/presupuestos/server/api/presupuestos/[id].put.ts` | Actualizar, validar FSM |
| `modules/presupuestos/server/api/presupuestos/[id]/estado.patch.ts` | Cambiar estado con FSM |
| `modules/presupuestos/server/api/presupuestos/[id].delete.ts` | Soft delete |
| `modules/presupuestos/utils/fsm.ts` | canTransition(from, to), TRANSITIONS map |

**FSM:** borrador -> enviado -> en_curso -> cerrado -> facturado. Cualquiera (excepto facturado) -> cancelado.

### 3.5 Pagina Presupuestos (lista)

| Archivo | Responsabilidad |
|---|---|
| `modules/presupuestos/stores/usePresupuestosStore.ts` | Store |
| `modules/presupuestos/pages/presupuestos.vue` | PageHead + filter chips estado + tabla |
| `modules/presupuestos/components/PresupuestoTable.vue` | Tabla: folio, cliente, tematica, fecha, estado badge, total |
| `modules/presupuestos/components/EstadoFilterChips.vue` | Chips por estado con colores STATUS_TONES |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/screens.jsx` (PresupuestosScreen)

### 3.6 Editor Presupuestos (fullscreen overlay) — Componente mas complejo

| Archivo | Responsabilidad |
|---|---|
| `modules/presupuestos/components/PresupuestoEditor.vue` | .editor-overlay fullscreen (left:240px). Header + split body + footer |
| `modules/presupuestos/components/EditorForm.vue` | Panel izquierdo: 5 secciones (cliente+evento, entrega, pago, productos spreadsheet, notas) |
| `modules/presupuestos/components/EditorPreview.vue` | Panel derecho: PreviewDoc o empty state |
| `modules/presupuestos/components/PreviewDoc.vue` | Doc tipo PDF: logo, folio, fecha, cliente, tabla lineas, totales, entrega, notas |
| `modules/presupuestos/components/LinesSpreadsheet.vue` | Tabla editable: drag reorder, autocomplete producto, cantidad, precio, subtotal. Tab/Shift+Tab/Enter/Escape. Auto-add row |
| `modules/presupuestos/components/EditorTotals.vue` | Subtotal + total |
| `modules/presupuestos/components/FormSection.vue` | Step pill + titulo + body |
| `modules/presupuestos/components/SegmentedControl.vue` | Toggle retira/envio |
| `modules/presupuestos/components/MoneyInput.vue` | Prefijo "$" + input |
| `modules/presupuestos/components/DateField.vue` | Input fecha con icono |
| `modules/presupuestos/composables/usePresupuestoEditor.ts` | Logica completa: form state, lines CRUD, totals computed, save/send |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/editor.jsx`

### Verificacion Fase 3
- /clientes muestra tabla con avatars y canales
- Detalle cliente editable con contactos e historial
- /presupuestos lista filtrable por estado
- Editor fullscreen: split form+preview
- Autocomplete clientes y productos funciona
- Spreadsheet de lineas: editar, reordenar, eliminar, auto-add
- Precio congelado en detalle (no cambia si producto cambia)
- FSM de estados funciona correctamente

---

## FASE 4 — Finanzas

### 4.1 API Finanzas

| Archivo | Responsabilidad |
|---|---|
| `modules/finanzas/types/index.ts` | Transaccion, OrdenImprenta, TipoMovimiento (12 tipos), Cuenta, MetodoPago |
| `modules/finanzas/server/api/transacciones/index.get.ts` | Lista con filtros (tipo, cuenta, periodo), KPIs agregados |
| `modules/finanzas/server/api/transacciones/index.post.ts` | Crear |
| `modules/finanzas/server/api/transacciones/[id].put.ts` | Actualizar |
| `modules/finanzas/server/api/transacciones/[id].delete.ts` | Soft delete |
| `modules/finanzas/server/api/ordenes-imprenta/index.get.ts` | Lista por periodo |
| `modules/finanzas/server/api/ordenes-imprenta/index.post.ts` | Crear |
| `modules/finanzas/server/api/ordenes-imprenta/[id].put.ts` | Actualizar |
| `modules/finanzas/server/api/ordenes-imprenta/[id].delete.ts` | Soft delete |
| `modules/finanzas/server/api/distribucion/index.get.ts` | Distribucion actual |
| `modules/finanzas/server/api/distribucion/index.put.ts` | Actualizar (validar suma <= 100%) |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/finanzas_drawer.jsx` (TIPO_MOVIMIENTOS, TIPO_BADGE_TONE, CUENTAS)

### 4.2 Pagina Finanzas

| Archivo | Responsabilidad |
|---|---|
| `modules/finanzas/stores/useFinanzasStore.ts` | Store: movimientos, ordenes, periodo, filtros, KPIs |
| `modules/finanzas/pages/finanzas.vue` | Period selector + tabs (Movimientos/Imprenta) + KPIs |
| `modules/finanzas/components/FinanzasKPIs.vue` | 3 cards: Ingresos, Egresos, Utilidad (highlight) |
| `modules/finanzas/components/PeriodSelector.vue` | Prev/next mes, label "Mayo 2026" |
| `modules/finanzas/components/FinanzasTabs.vue` | Tabs con counters |
| `modules/finanzas/components/MovimientosTab.vue` | Filtros tipo + cuenta + tabla movimientos con badges color |
| `modules/finanzas/components/ImprentaTab.vue` | Tabla ordenes: hojas, valores, diferencia, pagado |
| `modules/finanzas/components/TipoBadge.vue` | Badge tipo movimiento con TIPO_BADGE_TONE |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/screens.jsx` (FinanzasScreen)

### 4.3 Drawers Finanzas

| Archivo | Responsabilidad |
|---|---|
| `modules/finanzas/components/MovimientoDrawer.vue` | Drawer 520px: toggle ingreso/egreso, monto (color por signo), tipo, cuenta, fecha, referencia, detalle, nro_factura, vincular presupuesto |
| `modules/finanzas/components/ImprentaDrawer.vue` | Drawer 520px: fecha, presupuesto, tematica, hojas, tipo_hoja, valores, metodo_pago, pagado, diferencia |
| `modules/finanzas/composables/useMovimientoForm.ts` | Form composable |
| `modules/finanzas/composables/useImprentaForm.ts` | Form composable |

### Verificacion Fase 4
- /finanzas muestra KPIs, period selector funciona
- Tabs Movimientos/Imprenta con filtros
- Drawer movimiento: toggle ingreso/egreso, guardar persiste
- Drawer imprenta: crear/editar ordenes
- Distribucion ganancias valida suma <= 100%

---

## FASE 5 — Ajustes, Dashboard y pulido

### 5.1 Ajustes

| Archivo | Responsabilidad |
|---|---|
| `modules/ajustes/pages/ajustes.vue` | Stack de 5 bloques |
| `modules/ajustes/components/AjustesBlock.vue` | Bloque generico: header + body + footer guardar |
| `modules/ajustes/components/AjSwitch.vue` | Toggle switch |
| `modules/ajustes/components/BloqueInicio.vue` | Nombre, moneda, logo upload, domicilio, contacto |
| `modules/ajustes/components/BloquePresupuestos.vue` | Toggle cancelacion auto + dias espera |
| `modules/ajustes/components/BloqueFinanzas.vue` | Tabla socios con %, toggle activo, validacion suma |
| `modules/ajustes/components/BloqueUsuarios.vue` | Tabla usuarios, invitar (V2 badge) |
| `modules/ajustes/components/BloqueCuenta.vue` | Nombre, email readonly, cambiar password |
| `modules/ajustes/stores/useAjustesStore.ts` | Store configuracion |
| `modules/ajustes/server/api/configuracion/index.get.ts` | GET config |
| `modules/ajustes/server/api/configuracion/index.put.ts` | PUT config |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/ajustes.jsx`

### 5.2 Dashboard completo

| Archivo | Responsabilidad |
|---|---|
| `modules/dashboard/pages/dashboard.vue` | (Actualizar) KPIs + presupuestos recientes + insumos bajos + chart semanal |
| `modules/dashboard/components/DashboardKPIs.vue` | 3 cards: Ingresos mes, Por cobrar (highlight), Insumos bajos |
| `modules/dashboard/components/RecentPresupuestos.vue` | Card tabla ultimos 5 |
| `modules/dashboard/components/LowStockList.vue` | Card lista insumos bajo minimo |
| `modules/dashboard/components/WeeklyChart.vue` | Grafico barras simple (sin libreria): 8 barras, ultima violet, resto lavender |
| `modules/dashboard/server/api/dashboard/stats.get.ts` | Agregar KPIs de todos los modulos |

**Ref:** `docs/MVP/design-system/project/ui_kits/presumemi/dashboard.jsx`

### 5.3 Busqueda global

| Archivo | Responsabilidad |
|---|---|
| `shared/composables/useGlobalSearch.ts` | Query, results agrupados, debounce 300ms |
| `shared/components/GlobalSearchResults.vue` | Dropdown bajo search del topbar |
| `server/api/search.get.ts` | Busca en presupuestos, clientes, productos, insumos (5 por tipo) |

### 5.4 Tests

| Archivo | Responsabilidad |
|---|---|
| `vitest.config.ts` | Config Vitest |
| `tests/unit/utils/money.test.ts` | Formateo moneda |
| `tests/unit/utils/fsm.test.ts` | FSM presupuestos |
| `tests/unit/utils/computeNivel.test.ts` | Nivel stock |
| `tests/unit/utils/avatarPalette.test.ts` | Determinismo paleta |

### Verificacion Fase 5
- /ajustes 5 bloques editables, distribucion valida suma
- Dashboard con KPIs reales, chart semanal, presupuestos recientes, insumos bajos
- Busqueda global encuentra entidades de todos los modulos
- Tests pasan (`npx vitest run`)

---

## Notas de implementacion

1. **App funcional en cada paso** — nunca romper el build
2. **Regla de modulos:** solo importar del propio modulo, shared/, o librerias. Si presupuestos necesita productos, usar `$fetch('/api/productos')`, no importar store de productos
3. **Campos GENERATED:** calcular en server handlers (POST/PUT) antes de save
4. **Soft delete:** DELETE handlers hacen `update({ activo: false })`, GET filtran `where: { activo: true }`
5. **Moneda:** Decimal en Prisma, formatear en frontend con money()
6. **Rutas modulares:** configurar `hooks: { 'pages:extend' }` en nuxt.config.ts para registrar pages de cada modulo
7. **Prototipo React:** usar como referencia visual pixel-perfect, reimplementar en Vue — no copiar codigo React

## Archivos de referencia clave

- `docs/MVP/design-system/project/colors_and_type.css` — tokens CSS
- `docs/MVP/design-system/project/ui_kits/presumemi/styles.css` — estilos componentes
- `docs/MVP/design-system/project/ui_kits/presumemi/editor.jsx` — editor presupuestos (mas complejo)
- `docs/MVP/design-system/project/ui_kits/presumemi/insumo_detalle.jsx` — seed data + overlay insumos
- `docs/MVP/design-system/project/ui_kits/presumemi/producto_detalle.jsx` — BOM + overlay productos
- `docs/MVP/design-system/project/ui_kits/presumemi/cliente_detalle.jsx` — avatars + overlay clientes
- `docs/MVP/design-system/project/ui_kits/presumemi/finanzas_drawer.jsx` — tipos movimiento + drawers
- `docs/MVP/design-system/project/ui_kits/presumemi/ajustes.jsx` — pantalla ajustes
- `docs/MVP/design-system/project/ui_kits/presumemi/app.jsx` — routing + estado global
