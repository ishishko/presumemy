# Estado Actual — Presumemi microERP

**Fecha:** 2026-06-03
**Commit:** `08abcf3` — feat: backend API + frontend shell setup

---

## Resumen

Arquitectura Hono + Vue 3 SPA implementada. Backend completo con 7 módulos CRUD funcionando. Frontend con shell, auth y placeholder views listo para desarrollar pantallas reales.

---

## Backend (api/) — ✅ Completo

### Stack
- Hono + @hono/node-server (puerto 3000)
- Prisma v6 + Supabase PostgreSQL (proyecto: zhegcpjdmcjqodcmhlcc)
- Zod validation + Supabase Auth middleware

### Base de datos
- **16 tablas** migradas y con seed data
- Config (1), Productos (7), Comercial (4), Finanzas (3)
- 18 insumos, 9 categorias producto, 8 categorias insumo, 8 proveedores, 8 clientes
- Distribucion ganancias: Meme 40%, Pety 30%, Gastos 30%

### Rutas implementadas

| Modulo | Rutas | Estado |
|---|---|---|
| Health | `GET /health` | ✅ |
| Insumos | `GET/POST/PUT/DELETE /api/insumos`, proveedores, categorias | ✅ |
| Productos | `GET/POST/PUT/DELETE /api/productos`, categorias, BOM | ✅ |
| Clientes | `GET/POST/PUT/DELETE /api/clientes`, contactos | ✅ |
| Presupuestos | `GET/POST/PUT/DELETE /api/presupuestos`, `PATCH /estado` (FSM) | ✅ |
| Finanzas | `GET/POST/PUT/DELETE /api/transacciones`, ordenes-imprenta, distribucion | ✅ |
| Dashboard | `GET /api/dashboard/stats` — KPIs agregados | ✅ |
| Ajustes | `GET/PUT /api/configuracion` | ✅ |

### Logica especial
- Soft delete: `activo = false` en todos los DELETE
- Campos calculados en app: `costo_unitario`, `subtotal`, `total`
- FSM presupuestos: `borrador → enviado → en_curso → cerrado → facturado` (+ cancelado desde cualquier estado excepto facturado)
- Precios congelados en detalle_presupuesto al crear
- Validacion distribucion: suma porcentajes ≤ 100%

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

## Frontend (web/) — ✅ Shell listo

### Stack
- Vue 3 + Vite + TypeScript (puerto 5173)
- Vue Router 4 + Pinia
- Tailwind v4 + design system importado
- Supabase Auth (frontend)
- ofetch (HTTP client con proxy a api/)
- @lucide/vue (iconos)

### Componentes implementados
- `TheSidebar.vue` — nav con 2 secciones (Operacion + Datos), avatar, logout
- `TheTopbar.vue` — breadcrumbs, search, notificaciones
- `PageHead.vue` — titulo + sub + slot para acciones
- `LoginView.vue` — login con Supabase
- `App.vue` — layout condicional (auth vs shell)

### Views placeholder (pendientes de implementar)
- `DashboardView.vue` — KPIs, presupuestos recientes, stock bajo
- `InsumosView.vue` — tabla + filtros + overlay detalle
- `CatalogoView.vue` — grid/lista + BOM editor
- `ClientesView.vue` — tabla + avatars + overlay detalle
- `PresupuestosView.vue` — lista + editor fullscreen (componente mas complejo)
- `FinanzasView.vue` — KPIs + movimientos + ordenes imprenta
- `AjustesView.vue` — configuracion negocio

### Services
- `api.ts` — wrapper de ofetch con auth token automatico
- `auth.ts` — Pinia store con Supabase auth

### Design system
- `tokens.css` — copiado de `colors_and_type.css`
- `components.css` — copiado de `styles.css`
- Onest font via Google Fonts
- Logo `memydeni-logo.png` en public/

### Comandos
```bash
cd web
npm run dev          # vite dev server
npm run build        # vue-tsc + vite build
npm run preview      # preview del build
```

---

## Pendiente — Pantallas reales

Implementar **una por una**, conectadas al backend API:

1. **Dashboard** — KPIs reales desde `/api/dashboard/stats`
2. **Insumos** — tabla con filtros, barras de stock, overlay detalle
3. **Catalogo** — grid/lista toggle, filtro categorias, BOM editor
4. **Clientes** — tabla con avatars, contactos, historial
5. **Presupuestos** — lista con filtros estado, editor fullscreen (spreadsheet + preview)
6. **Finanzas** — period selector, tabs movimientos/imprenta, drawers
7. **Ajustes** — 5 bloques de configuracion

---

## Design System

Todo en `docs/MVP/design-system/project/`:
- Prototipo React interactivo → trasladar a Vue SFC
- No inventar nada visual, no copiar codigo React
- Reglas de copy: espanol, tuteo, sin emojis, sentence case
