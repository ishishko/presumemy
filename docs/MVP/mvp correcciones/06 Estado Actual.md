# Estado Actual v6 — Presumemi microERP

**Fecha:** 2026-06-13  
**Commit:** `7c11045`

---

## Resumen

El MVP está funcionalmente completo para el uso diario de MemyDeni. Todos los módulos CRUD operan con datos reales, el editor de presupuestos incluye FSM, generación de PDF y vista pública compartible. El deploy en Render está configurado. Los pendientes restantes son mejoras de UX y deuda técnica, no bloqueantes para el lanzamiento.

---

## Backend (api/) — Completo

### Stack
- Hono 4.12 + @hono/node-server (puerto 3000)
- Prisma 6.19 + Supabase PostgreSQL
- Puppeteer 25.1 + Supabase Storage (PDFs)
- Zod 4.4 + @hono/zod-validator

### Rutas implementadas

| Módulo | Rutas | Estado |
|---|---|---|
| Health | `GET /health` | ✅ |
| Insumos | `GET/POST/PUT/DELETE /api/insumos`, categorías, proveedores | ✅ |
| Productos | `GET/POST/PUT/DELETE /api/productos`, categorías, BOM | ✅ |
| Clientes | `GET/POST/PUT/DELETE /api/clientes`, contactos, búsqueda por nombre/código | ✅ |
| Presupuestos | `GET/POST/PUT/DELETE /api/presupuestos`, `PATCH /estado` (FSM), `GET /:id/pdf` | ✅ |
| Vista pública | `GET /api/public/presupuestos/:token` (sin auth) | ✅ |
| Finanzas | `GET/POST /api/finanzas`, órdenes imprenta, distribución, KPIs por período | ✅ |
| Dashboard | `GET /api/dashboard/stats` — KPIs, recientes, stock bajo | ✅ |
| Ajustes | `GET/PUT /api/ajustes/configuracion`, `GET/PUT /api/ajustes/distribucion` | ✅ |

### Schema (modelos y campos relevantes)

**13 modelos — 11 enums**

- `ConfiguracionNegocio` — nombre, logoUrl, domicilio JSON, contactoCanal/Valor, moneda, cancelacionAuto, diasEspera
- `Insumo` — código único, categoría, unidad, stock/stockMinimo, costoPaquete/cantidadPack/costoUnitario
- `InsumoProveedor` — relación n:m con esPrincipal y precio
- `Producto` — código único, categoría, imagenUrl, tieneBom, tipoGanancia enum, ganancia/precio
- `CostoProductoInsumo` (BOM) — tipoLinea enum (insumo/cameo/embalaje/extra), insumoId nullable, orden
- `Cliente` — código único, domicilio JSON, contactos múltiples (canal: instagram/whatsapp/mail/otros)
- `Presupuesto` — folio único, estado enum (borrador/en_curso/cerrado/facturado/cancelado), tipoEntrega, fechaFiesta/Entrega, sena/total, `notasPublicas`, `publicToken` unique, `pdfPath`, `pdfGeneratedAt`, `updatedAt`
- `DetallePresupuesto` — precios congelados al crear, orden
- `Transaccion` — 12 tipos, 4 cuentas, referencia a presupuesto
- `OrdenImprenta` — referencia a presupuesto y producto, hojas, pagado, diferencia
- `DistribucionGanancia` — nombre, porcentaje

### Librerías nuevas desde v2

- **`api/src/lib/pdf.ts`** — Puppeteer con cola secuencial (mutex), genera PDF navegando a `/p/:token?pdf=1`, sube a Supabase Storage bucket `presupuestos-pdf`
- **`api/src/lib/supabase.ts`** — cliente admin service role para Storage

### Lógica especial
- Soft delete: `activo = false` en todos los DELETE
- FSM presupuestos: `borrador → en_curso → cerrado → facturado` (+ cancelado desde cualquier estado excepto facturado). `utils/fsm.ts` con `canTransition()`.
- Transacciones automáticas al facturar: ingreso, egreso insumos (BOM), egreso imprenta, distribución de ganancias
- PDF: fire-and-forget al cambiar estado, regeneración lazy si `pdfGeneratedAt < updatedAt`, on-demand vía `GET /:id/pdf`
- Backfill perezoso de `publicToken` en presupuestos anteriores a la feature

---

## Frontend (web/) — Completo

### Stack
- Vue 3 + Vite + TypeScript (puerto 5173)
- Vue Router 4 + Pinia
- Tailwind v4 (preflight) + design system CSS custom
- Supabase Auth + ofetch + Lucide Vue

### Pantallas implementadas

| Pantalla | Ruta | Funcionalidades |
|---|---|---|
| Dashboard | `/dashboard` | KPIs del mes, presupuestos recientes, insumos bajo stock, gráfico ingresos |
| Presupuestos | `/presupuestos` | Tabla con filtros FSM, editor fullscreen split (form + preview) |
| Productos | `/productos` | Grid/lista toggle, filtro por categoría, overlay de edición con BOM |
| Insumos | `/insumos` | Tabla, filtros estado/categoría, barras de stock, overlay de edición |
| Clientes | `/clientes` | Tabla con avatars, overlay con contactos e historial |
| Finanzas | `/finanzas` | KPIs, tabs movimientos/imprenta, filtros tipo/cuenta/período, drawers |
| Ajustes | `/ajustes` | Config negocio, distribución de ganancias, dirty tracking por bloque |
| Vista pública | `/p/:token` | Documento compartible sin login, modo `?pdf=1` para Puppeteer |
| Login | `/login` | Auth Supabase email/password |

### Componentes de UI creados (`web/src/components/ui/`)
- `FloatingField.vue` — input/textarea con label flotante, estados valid/invalid/focus, prefix `$`
- `FloatingSelect.vue` — select con label flotante
- `ToggleSwitch.vue` — accesible con Space/Enter, focus ring violeta
- `SegmentedControl.vue` — radiogroup con navegación por flechas
- `ConfirmDialog.vue` — modal con focus-trap, aria-modal
- `DrawerShell.vue` — contenedor para drawers laterales
- `ToastContainer.vue` — notificaciones auto-dismiss (4 s éxito, 6 s error) con undo

### Componentes por módulo
- `editors/PresupuestoEditor.vue` — editor completo con tabla de líneas, FSM, PDF/link, snapshot dirty
- `presupuestos/PresupuestoDoc.vue` — plantilla compartida entre preview del editor, vista pública y Puppeteer
- `drawers/ClienteDrawer.vue`, `MovimientoDrawer.vue`, `ImprentaDrawer.vue`
- `overlays/ProductoDetalle.vue`, `InsumoDetalle.vue`

### Stores Pinia (patrón uniforme fetch/upsert/remove)
`useAuthStore`, `usePresupuestosStore`, `useClientesStore`, `useProductosStore`, `useInsumosStore`, `useFinanzasStore`, `useDashboardStore`

### Composables
- `useEditorMode.ts` — estado global del editor (título, dirty, handlers)
- `useCreateTrigger.ts` — abre formularios desde el botón del header
- `useToast.ts` — notificaciones globales
- `useDirty.ts` — tracking de cambios por snapshot JSON

---

## Design System implementado

- Tokens en `web/src/assets/colors_and_type.css` (colores, tipografía, espaciado, radios, sombras)
- Estilos de componentes en `web/src/assets/components.css` (sidebar, topbar, botones, cards, tablas, drawers, `.preview-doc`)
- Fuente Onest 400/500/600/700 via Google Fonts
- Lucide Vue — stroke 1.5, currentColor

---

## Deploy

| Capa | Servicio | Notas |
|---|---|---|
| Frontend | Netlify | Build: `web/`. SPA redirect `/* → /index.html` en netlify.toml. |
| Backend | Render (Web Service Node) | `render.yaml` en raíz. Build instala Chrome; `PUPPETEER_CACHE_DIR` en `/opt/render/project/`. |
| Base de datos | Supabase PostgreSQL | Pooler transaction-mode para queries, session-mode para migraciones. |
| Auth | Supabase Auth | JWT validado por el backend vía `/auth/v1/user`. |
| Storage | Supabase Storage | Bucket privado `presupuestos-pdf`, signed URLs 1 h. |

---

## Completado desde v2 (2026-06-03 → 2026-06-13)

| Feature | Walkthrough |
|---|---|
| Correcciones de interfaz y persistencia (overlays, z-index, productoss/insumos) | 01 |
| Auditoría A11y y validación de flujos en entorno aislado | 02 |
| FSM 5 estados + distribución financiera automática al facturar | 03 |
| FloatingField, badge de estado en topbar, accesibilidad del editor | 04 |
| Propagación de FloatingField a toda la app, ToggleSwitch, SegmentedControl, tabla de líneas | 05 |
| Vista pública `/p/:token`, PDF con Puppeteer + Supabase Storage, deploy Render | 06 |

---

## Pendiente para MVP y más allá

| Pendiente | Prioridad | Nota |
|---|---|---|
| **Auditoría de flujos Insumos, Productos y Presupuestos** | Alta | Primera auditoría end-to-end de los flujos principales tras 6 fases de cambios. Detectar regressions, gaps de UX y comportamientos inesperados. |
| **Búsqueda global (topbar)** | Alta | UI existe (placeholder en AppHeader), lógica no conectada. Requiere endpoint multi-entidad en backend + composable con debounce + dropdown de resultados en frontend. |
| **Paginación en UI** | Media | Stores cargan con `limit: 100`. Suficiente para el volumen actual de MemyDeni, pero es deuda técnica. |
| **Tests (Vitest)** | Media | 0 tests escritos. No bloquea el lanzamiento pero aumenta el riesgo de regresiones. |
| **Export CSV de tablas** | Baja | No bloqueante para MVP. |
| **Modo oscuro** | Baja | Nice-to-have. Toggle en Ajustes > Apariencia. |
| **Campo Medidas en productos** | Baja | Mencionado desde v2, nunca priorizado. |
| **Dashboard V2** | Baja | Widgets personalizables, agenda de entregas, top clientes. El dashboard actual es suficiente para MVP. |
