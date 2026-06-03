# AGENTS.md — Presumemi (microERP para MemyDeni)

## Estado del proyecto

**Backend API funcionando.** Frontend Vue 3 SPA pendiente.
Este repo contiene: design system completo (HTML/CSS/JS), backend Hono con Prisma + Supabase, y especificaciones de modulos.

## Arquitectura confirmada

**Backend separado + Frontend SPA (Plan B):**
- **Backend**: `api/` — Hono (Node.js) con Prisma ORM corriendo en puerto 3000
- **Frontend**: `web/` — Vue 3 SPA con Vite (pendiente, puerto 5173)
- **Base de datos**: Supabase PostgreSQL (proyecto: zhegcpjdmcjqodcmhlcc)
- **Auth**: Supabase Auth (JWT verificado en Hono middleware)

## Design system — leer antes de tocar UI

Todo lo visual ya existe en `docs/MVP/design-system/project/`. No inventar nada.

| Archivo | Que contiene |
|---|---|
| `colors_and_type.css` | Tokens CSS (colores, tipografia, espaciado, radios, sombras) |
| `ui_kits/presumemi/styles.css` | Estilos de componentes (.btn-*, .card, .badge, .data-table, .drawer, etc.) |
| `ui_kits/presumemi/*.jsx` | Prototipo React interactivo — referencia visual pixel-perfect |
| `preview/*.html` | Componentes individuales aislados |
| `assets/memydeni-logo.png` | Logo con fondo transparente (usar siempre este) |

**Regla:** trasladar JSX → Vue SFC. No copiar codigo React.

## Backend (api/) — ya implementado

### Stack
- Hono + @hono/node-server
- Prisma v6 (no v7, tiene breaking changes)
- Zod validacion
- Supabase Auth middleware

### Comandos
```bash
cd api
npm run dev          # tsx watch src/index.ts
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run db:seed      # prisma db seed
npm run db:reset     # reset + seed
```

### Rutas implementadas
- `GET /health` — health check
- `/api/insumos` — CRUD completo + categorias + proveedores
- `/api/productos` — CRUD completo + categorias + BOM
- `/api/clientes` — CRUD completo + contactos
- `/api/presupuestos` — CRUD + FSM estados + congelar precios
- `/api/finanzas` — transacciones + ordenes imprenta + distribucion
- `/api/dashboard` — KPIs agregados
- `/api/ajustes` — configuracion negocio

### Convenciones de datos
- **16 tablas**: config(1), productos(7), comercial(4), finanzas(3)
- **Soft delete siempre**: `activo = false`, nunca DELETE real
- **Todo Decimal**, nunca Float
- **Campos calculados** (`costo_unitario`, `subtotal`, `total`) se computan en app antes de guardar
- **FSM presupuestos**: `borrador → enviado → en_curso → cerrado → facturado`. Cualquiera (excepto facturado) → `cancelado`

## Seed data

Fuente: `docs/MVP/design-system/project/ui_kits/presumemi/data.jsx` e `insumo_detalle.jsx`
- 9 categorias producto, 8 categorias insumo
- 18 insumos con stock, minimos y costos reales
- 3 filas distribucion: Meme 40%, Pety 30%, Gastos 30%
- 1 config inicial (nombre "MemyDeni", moneda ARS)

## Frontend (web/) — pendiente

Implementar con Vue 3 + Vite + TypeScript segun `docs/MVP/Plan de implementacion 2.md` Fase 2.

### Pantallas a implementar
| Pantalla | Ref. prototipo | Ruta |
|---|---|---|
| Dashboard | `dashboard.jsx` | `/dashboard` |
| Insumos | `screens.jsx` + `insumo_detalle.jsx` | `/insumos` |
| Catálogo | `screens.jsx` + `producto_detalle.jsx` | `/catalogo` |
| Clientes | `screens.jsx` + `cliente_detalle.jsx` | `/clientes` |
| Presupuestos | `screens.jsx` + `editor.jsx` | `/presupuestos` |
| Finanzas | `screens.jsx` + `finanzas_drawer.jsx` | `/finanzas` |
| Ajustes | `ajustes.jsx` | `/ajustes` |

## Copy y contenido

- Idioma: espanol (es-MX / neutro latinoamericano), tuteo
- Sin emojis en la UI. Nunca.
- Sentence case. Sin punto final en botones, menus, labels ni celdas de tabla.
- Moneda: `$ 1,250.00 MXN` en vistas financieras; sin `MXN` en tablas densas.

## CLAUDE.md

Leer `CLAUDE.md` para design system detallado (tokens, componentes, tipografia, iconos, reglas de estilo).
