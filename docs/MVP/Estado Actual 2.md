# Estado Actual v2 — Presumemi microERP

**Fecha:** 2026-06-03
**Commit:** `pendiente`

---

## Resumen

Arquitectura Hono + Vue 3 SPA implementada. Backend completo con 7 módulos CRUD. Frontend con las 7 pantallas funcionando con datos reales del API. Layout refinado con header unificado, búsqueda centrada y navegación corregida.

---

## Backend (api/) — ✅ Completo

### Stack
- Hono + @hono/node-server (puerto 3000)
- Prisma v6 + Supabase PostgreSQL (proyecto: zhegcpjdmcjqodcmhlcc)
- Zod validation + Supabase Auth middleware

### Base de datos
- **16 tablas** migradas y con seed data
- Config (1), Productos (7), Comercial (4), Finanzas (3)
- 18 insumos, 9 categorías producto, 8 categorías insumo, 8 proveedores, 8 clientes
- Distribución ganancias: Meme 40%, Pety 30%, Gastos 30%

### Rutas implementadas

| Módulo | Rutas | Estado |
|---|---|---|
| Health | `GET /health` | ✅ |
| Insumos | `GET/POST/PUT/DELETE /api/insumos`, proveedores, categorías | ✅ |
| Productos | `GET/POST/PUT/DELETE /api/productos`, categorías, BOM | ✅ |
| Clientes | `GET/POST/PUT/DELETE /api/clientes`, contactos | ✅ |
| Presupuestos | `GET/POST/PUT/DELETE /api/presupuestos`, `PATCH /estado` (FSM) | ✅ |
| Finanzas | `GET/POST /api/finanzas`, `GET/POST /api/finanzas/ordenes-imprenta`, distribución | ✅ |
| Dashboard | `GET /api/dashboard/stats` — KPIs agregados | ✅ |
| Ajustes | `GET/PUT /api/ajustes/configuracion`, `GET/PUT /api/ajustes/distribucion` | ✅ |

### Lógica especial
- Soft delete: `activo = false` en todos los DELETE
- Campos calculados en app: `costo_unitario`, `subtotal`, `total`
- FSM presupuestos: `borrador → enviado → en_curso → cerrado → facturado` (+ cancelado)
- Precios congelados en detalle_presupuesto al crear
- Validación distribución: suma porcentajes ≤ 100%

### Comandos
```bash
cd api
npm run dev          # tsx watch
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run db:seed      # prisma db seed
npm run db:reset     # reset + seed
```

---

## Frontend (web/) — ✅ Pantallas funcionando

### Stack
- Vue 3 + Vite + TypeScript (puerto 5173)
- Vue Router 4 + Pinia
- Tailwind v4 (preflight) + design system CSS custom
- Supabase Auth (frontend)
- ofetch (HTTP client con proxy a api/)
- @lucide/vue (iconos)

### Layout
- `TheSidebar.vue` — nav con 2 secciones (Operación + Datos), avatar, logout
- `AppHeader.vue` — header unificado: título dinámico (20px), búsqueda centrada (520px), botón crear (solo ícono), notificaciones
- `PageHead.vue` — título + subtítulo + acciones por pantalla
- `LoginView.vue` — login con Supabase
- `App.vue` — layout condicional (auth vs shell)

### Pantallas implementadas (con datos reales)

| Pantalla | Ruta | Funcionalidades |
|---|---|---|
| Dashboard | `/dashboard` | KPIs, presupuestos recientes, insumos bajos, gráfico ingresos |
| Insumos | `/insumos` | Tabla, filtros estado/categoría, barras de stock |
| Productos | `/productos` | Grid/lista toggle, filtro categorías |
| Clientes | `/clientes` | Tabla con avatars, contactos, código |
| Presupuestos | `/presupuestos` | Tabla, filtros FSM, folios |
| Finanzas | `/finanzas` | Tabs movimientos/imprenta, KPIs, filtros tipo/cuenta/período |
| Ajustes | `/ajustes` | Config negocio, cancelación auto, distribución ganancias |

### Services
- `api.ts` — wrapper de ofetch con auth token automático
- `auth.ts` — Pinia store con Supabase auth
- `dashboard.ts` — fetch de KPIs

### Design system
- `tokens.css` — copiado de `colors_and_type.css`
- `components.css` — copiado de `styles.css` (99% del styling)
- Onest font via Google Fonts
- Logo `memydeni-logo.png` en public/

### HMR
- Configurado con `usePolling: true` para WSL + NTFS

### Comandos
```bash
cd web
npm run dev          # vite dev server
npm run build        # vue-tsc + vite build
npm run preview      # preview del build
```

---

## Pendiente

### Create/Edit flows
- Drawers y formularios para crear/editar en cada módulo
- Validación con Zod en frontend
- Confirmación de cambios y undo

### Funcionalidades
- **Búsqueda** — barra del header aún no filtra resultados
- **Paginación** — actualmente carga todo (limit 100)
- **Export** — CSV/PDF de tablas
- **Detalle de registros** — click en fila → drawer/overlay con info completa

### Mejoras técnicas
- **Tailwind utilities** — actualmente 99% CSS custom en `components.css`. Decidir si migrar a utilities o mantener enfoque actual
- **Tipado** — tipos TypeScript compartidos entre frontend y backend
- **Tests** — Vitest configurado pero sin tests escritos

---

## Bugs corregidos (sesión actual)

| Issue | Fix |
|---|---|
| `orden` no existe en `CostoProductoInsumo` | Removido `orderBy: { orden: 'asc' }` en productos.ts |
| Finanzas 404 — rutas `/transacciones` | Corregido a `/finanzas` y `/finanzas/ordenes-imprenta` |
| Ajustes 404 — rutas `/configuracion` | Corregido a `/ajustes/configuracion` y `/ajustes/distribucion` |
| Ruta `catalogo` debe ser `productos` | Renombrado en router, sidebar, App.vue |
| HMR no funciona en WSL | Agregado `usePolling: true` en vite.config.ts |
| HelloWorld.vue y TheTopbar.vue sin usar | Eliminados |
| Título header muy chico | `16px/500` → `20px/600` |
| Botón crear con texto "Nuevo" | Solo ícono + tooltip "Crear nuevo" |
| Barra de búsqueda no centrada | Grid 3 columnas: `1fr auto 1fr`, max-width 520px |

---

## Design System

Todo en `docs/MVP/design-system/project/`:
- Prototipo React interactivo → trasladar a Vue SFC
- No inventar nada visual, no copiar código React
- Reglas de copy: español, tuteo, sin emojis, sentence case
