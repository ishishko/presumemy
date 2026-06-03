# Plan de Implementación — Presumemi microERP

## Context

Stack separado: backend Hono API + frontend Vue 3 SPA. El design system está 100% completo
en `docs/MVP/design-system/` — no se inventa nada visual, todo se traslada desde los
archivos existentes (React → Vue, HTML → Vue, CSS ya listo).

**Orden de implementación:**
1. Backend primero: DB + Prisma + seed + Hono API funcionando
2. Frontend después: conectar pantalla por pantalla usando el design system existente

---

## Stack

| Rol | Tecnología |
|---|---|
| **Backend** | Hono + @hono/node-server |
| **ORM** | Prisma |
| **DB** | Supabase PostgreSQL |
| **Auth** | Supabase Auth (JWT verificado en Hono middleware) |
| **Frontend** | Vue 3 + Vite + TypeScript |
| **Routing** | Vue Router 4 |
| **Estado** | Pinia |
| **Auth frontend** | @supabase/supabase-js (solo auth) |
| **HTTP client** | fetch nativo / ofetch |
| **CSS** | Design system existente (`tokens.css` + `styles.css`) + Tailwind v4 |
| **Iconos** | lucide-vue-next |
| **Validación** | Zod (backend + frontend) |
| **Tests** | Vitest |

---

## Estructura del repositorio

```
presumemy-open/
├── api/                    ← Hono backend
│   ├── src/
│   │   ├── index.ts        ← entry point, Hono app + Node server
│   │   ├── middleware/
│   │   │   └── auth.ts     ← verificar JWT de Supabase
│   │   ├── routes/
│   │   │   ├── insumos.ts
│   │   │   ├── productos.ts
│   │   │   ├── clientes.ts
│   │   │   ├── presupuestos.ts
│   │   │   ├── finanzas.ts
│   │   │   ├── dashboard.ts
│   │   │   └── ajustes.ts
│   │   ├── lib/
│   │   │   └── prisma.ts   ← singleton PrismaClient
│   │   └── utils/
│   │       ├── errors.ts
│   │       └── fsm.ts      ← canTransition(), TRANSITIONS
│   ├── prisma/
│   │   ├── schema.prisma   ← 16 tablas
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
└── web/                    ← Vue 3 SPA (se implementa después)
    └── ...
```

---

## FASE 1 — Backend: DB + Prisma + Seed + Hono

### 1.1 Init `api/`

```bash
mkdir api && cd api
npm init -y
npm install hono @hono/node-server @prisma/client @supabase/supabase-js zod
npm install -D prisma tsx typescript @types/node
npx prisma init
```

Archivos de config:
- `api/tsconfig.json` — target ES2022, moduleResolution bundler
- `api/.env.example`:

```env
# Transaction-mode pooler (IPv4, app queries)
DATABASE_URL="postgresql://postgres.zhegcpjdmcjqodcmhlcc:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Session-mode pooler (migrations)
DIRECT_URL="postgresql://postgres.zhegcpjdmcjqodcmhlcc:[PASSWORD]@aws-1-us-west-2.pooler.supabase.com:5432/postgres"

# Supabase (para verificar JWTs en middleware)
SUPABASE_URL="https://zhegcpjdmcjqodcmhlcc.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="..."

PORT=3000
```

**Auth:** Supabase Email/Password. El frontend usa `@supabase/supabase-js` para login/logout/session. El backend verifica el JWT de Supabase en cada request con el `service_role_key` o `JWT_SECRET`.

### 1.2 Prisma Schema (16 tablas)

**Archivo:** `api/prisma/schema.prisma`

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
generator client {
  provider = "prisma-client-js"
}
```

**Tablas:**

*Config (1):*
- `configuracion_negocio` — id(1), nombre, logo_url, domicilio Json, contacto_canal, contacto_valor, moneda, cancelacion_auto Boolean, dias_espera Int

*Productos (7):*
- `categorias_producto` — id, nombre, activo
- `categorias_insumo` — id, nombre, activo
- `proveedores` — id, nombre, contacto, activo
- `insumos` — id, nombre, codigo, categoria_id, unidad, stock Decimal, stock_minimo Decimal, costo_paquete Decimal, cantidad_pack Decimal, costo_unitario Decimal, activo
- `insumo_proveedor` — id, insumo_id, proveedor_id, es_principal Boolean (max 3 por insumo)
- `productos` — id, nombre, codigo, categoria_id, descripcion, imagen_url, tiene_bom Boolean, tipo_ganancia Enum(porcentaje/fijo), ganancia Decimal, precio Decimal, activo
- `costo_producto_insumo` — id, producto_id, tipo_linea Enum(insumo/cameo/embalaje/extra), insumo_id?, descripcion, cantidad Decimal, costo_unitario Decimal, subtotal Decimal

*Comercial (4):*
- `clientes` — id, nombre, codigo(C-{id}), domicilio Json, notas, activo
- `cliente_contactos` — id, cliente_id, canal Enum(instagram/whatsapp/mail/otros), valor, es_principal Boolean
- `presupuestos` — id, folio(P-{id}), cliente_id, tematica, estado Enum(borrador/enviado/en_curso/cerrado/facturado/cancelado), tipo_entrega Enum(retira/envio), direccion_entrega, fecha_entrega DateTime?, seña Decimal, total Decimal, notas, activo, created_at
- `detalle_presupuesto` — id, presupuesto_id, producto_id, descripcion, cantidad Decimal, precio_unitario Decimal (congelado), subtotal Decimal, orden Int

*Finanzas (3):*
- `distribucion_ganancias` — id, nombre, porcentaje Decimal, activo
- `transacciones` — id, tipo Enum(12 tipos), cuenta Enum, monto Decimal, fecha DateTime, referencia, detalle, nro_factura, presupuesto_id?, activo, created_at (inmutable)
- `ordenes_imprenta` — id, fecha DateTime, presupuesto_id?, tematica, hojas Int, tipo_hoja, valor_unitario Decimal, valor_total Decimal, metodo_pago, pagado Boolean, diferencia Decimal, activo

**Reglas:**
- Todo `Decimal`, nunca `Float`
- Soft delete: `activo Boolean @default(true)`
- Campos calculados (`costo_unitario`, `subtotal`, `total`) se calculan en la app antes de guardar, no GENERATED de PG

### 1.3 Seed

**Archivo:** `api/prisma/seed.ts`

Datos de `docs/MVP/design-system/project/ui_kits/presumemi/data.jsx` e `insumo_detalle.jsx`:
- 9 categorías producto
- 8 categorías insumo
- Proveedores (los del prototipo)
- 18 insumos con stock, mínimos y costos reales
- 3 filas distribución ganancias: Meme 40%, Pety 30%, Gastos 30%
- 1 configuración inicial (nombre "MemyDeni", moneda ARS)

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 1.4 Hono Server base

**`api/src/lib/prisma.ts`** — singleton PrismaClient

**`api/src/middleware/auth.ts`** — verifica JWT de Supabase:
```ts
// Extrae Bearer token, verifica con SUPABASE_JWT_SECRET
// Agrega user al context de Hono
```

**`api/src/index.ts`**:
```ts
import { Hono } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

const app = new Hono()
app.use('*', cors({ origin: 'http://localhost:5173' }))
app.use('*', logger())
app.get('/health', (c) => c.json({ ok: true }))

// rutas (cada una va protegida con authMiddleware)
app.route('/api/insumos', insumosRoutes)
// ... resto

serve({ fetch: app.fetch, port: 3000 })
```

### 1.5 Rutas CRUD por módulo

Patrón que se repite para cada módulo (insumos, productos, clientes, presupuestos, finanzas, ajustes):

```
GET    /api/insumos          → lista con filtros, activo=true
POST   /api/insumos          → crear, calcular campos derivados, validar Zod
GET    /api/insumos/:id      → detalle con relaciones
PUT    /api/insumos/:id      → actualizar, recalcular
DELETE /api/insumos/:id      → soft delete (update activo=false)
```

**Lógica especial por módulo:**
- `insumos`: calcular `costo_unitario = costo_paquete / cantidad_pack` en POST/PUT
- `productos`: replace BOM completo en PUT (delete + insert líneas)
- `presupuestos`: congelar precios en POST, calcular `total`, validar FSM en PATCH `/estado`
- `costo_producto_insumo`: calcular `subtotal = cantidad * costo_unitario`
- `distribucion`: validar que suma de porcentajes ≤ 100%
- `dashboard`: endpoint agregado que consulta KPIs de todas las tablas

**FSM presupuestos** (`api/src/utils/fsm.ts`):
`borrador → enviado → en_curso → cerrado → facturado`. Cualquiera (excepto `facturado`) → `cancelado`.

### Verificación Fase 1
- `npx prisma studio` muestra 16 tablas con seed data
- `GET /health` responde `{ ok: true }`
- `GET /api/insumos` devuelve los 18 insumos
- Auth middleware bloquea requests sin token válido
- Soft delete funciona (activo=false, no aparece en GET)

---

## FASE 2 — Frontend: Setup + Design System + Shell

> El design system está completo en `docs/MVP/design-system/project/`:
> - `colors_and_type.css` → tokens CSS (colores, tipo, espaciado, radios, sombras)
> - `ui_kits/presumemi/styles.css` → estilos de todos los componentes
> - `ui_kits/presumemi/*.jsx` → referencia pixel-perfect de cada pantalla (trasladar a Vue)
> - `preview/*.html` → HTML limpio de componentes individuales
> - `screenshots/` → imágenes de referencia

**No se crea nada visual desde cero.** Todo se traslada/adapta desde los archivos existentes.

### 2.1 Init `web/`

```bash
npm create vite@latest web -- --template vue-ts
cd web
npm install vue-router@4 pinia @supabase/supabase-js ofetch zod lucide-vue-next
npm install -D tailwindcss @tailwindcss/vite vitest
```

Config:
- `vite.config.ts` — alias `@` → `src/`, proxy `/api` → `http://localhost:3000`
- `src/assets/css/tokens.css` — copiar `colors_and_type.css` directamente
- `src/assets/css/components.css` — copiar `styles.css` directamente
- `src/assets/css/main.css` — `@import "tailwindcss"` + imports de tokens y components
- `index.html` — Onest font via Google Fonts

### 2.2 Shell + Auth

Trasladar desde `shell.jsx` y `app.jsx`:
- `src/components/layout/TheSidebar.vue`
- `src/components/layout/TheTopbar.vue`
- `src/components/layout/PageHead.vue`
- `src/App.vue` — layout condicional (con/sin sidebar según ruta)
- `src/router/index.ts` — 8 rutas + navigation guard
- `src/stores/useAuthStore.ts` — session global
- `src/features/auth/LoginView.vue` — trasladar desde `app.jsx` (pantalla login)

### 2.3 Pantallas (una por una, conectadas al backend)

Orden de implementación:

| Pantalla | Ref. prototipo | Ruta |
|---|---|---|
| Dashboard | `dashboard.jsx` | `/dashboard` |
| Insumos | `screens.jsx` (InsumosScreen) + `insumo_detalle.jsx` | `/insumos` |
| Catálogo | `screens.jsx` (CatalogoScreen) + `producto_detalle.jsx` | `/catalogo` |
| Clientes | `screens.jsx` (ClientesScreen) + `cliente_detalle.jsx` | `/clientes` |
| Presupuestos | `screens.jsx` (PresupuestosScreen) + `editor.jsx` | `/presupuestos` |
| Finanzas | `screens.jsx` (FinanzasScreen) + `finanzas_drawer.jsx` | `/finanzas` |
| Ajustes | `ajustes.jsx` | `/ajustes` |

Para cada pantalla: trasladar JSX → Vue SFC, conectar a `/api/*`, manejar loading/error.

---

## Reglas de implementación

1. **Backend primero** — no tocar `web/` hasta que `api/` tenga DB + seed + rutas funcionando
2. **Soft delete siempre** — `update({ activo: false })`, los GET filtran `where: { activo: true }`
3. **Campos calculados en app** — `costo_unitario`, `subtotal`, `total` se calculan antes de `prisma.*.create/update`
4. **Todo `Decimal`** — nunca `Float` en Prisma ni en la DB
5. **Design system existente** — nada visual desde cero; siempre trasladar desde `docs/MVP/design-system/`
6. **Pantallas una por una** — no pasar a la siguiente hasta que la actual esté conectada y funcional
