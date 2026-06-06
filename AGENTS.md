# AGENTS.md — Presumemi (microERP para MemyDeni)

## Estado del proyecto

**MVP completo implementado.** Backend API + Frontend Vue 3 SPA funcionando.

## Arquitectura

**Backend separado + Frontend SPA:**
- **Backend**: `api/` — Hono (Node.js) + Prisma v6 + Supabase PostgreSQL, puerto 3000
- **Frontend**: `web/` — Vue 3 + Vite + TypeScript + Tailwind v4, puerto 5173
- **Base de datos**: Supabase PostgreSQL (proyecto: zhegcpjdmcjqodcmhlcc)
- **Auth**: Supabase Auth (JWT verificado en frontend y backend)

## Comandos para desarrolladores

### Backend (api/)
```bash
cd api
npm run dev          # tsx watch src/index.ts
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
npm run db:seed      # prisma db seed
npm run db:reset     # prisma migrate reset --force && prisma db seed
```

### Frontend (web/)
```bash
cd web
npm run dev          # vite con HMR (usePolling para WSL)
npm run build        # vue-tsc -b && vite build
npm run preview      # vite preview
```

### Verificacion
```bash
cd web && npx vue-tsc -b    # typecheck sin build
```

### Dev en WSL
Ambos servidores deben correr simultaneamente. Vite tiene `usePolling: true` para WSL + NTFS.
El frontend hace proxy de `/api` → `http://localhost:3000`.

## Frontend (web/) — estructura

| Directorio | Contenido |
|---|---|
| `src/views/` | 7 vistas: Dashboard, Insumos, Catalogo, Clientes, Presupuestos, Finanzas, Ajustes |
| `src/components/drawers/` | ClienteDrawer, PresupuestoDrawer, MovimientoDrawer, ImprentaDrawer |
| `src/components/overlays/` | InsumoDetalle, ProductoDetalle (fullscreen) |
| `src/components/ui/` | DrawerShell, ConfirmDialog, ToastContainer |
| `src/components/layout/` | AppHeader, PageHead, TheSidebar |
| `src/composables/` | useCreateTrigger, useDirty, useToast |
| `src/schemas/` | Zod v4 schemas: insumos, productos, clientes, presupuestos, finanzas |
| `src/services/` | api.ts (ofetch con JWT), dashboard.ts |
| `src/stores/` | auth.ts (Pinia + Supabase) |
| `src/types/` | TypeScript types centralizados |

### Auth
- `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` requeridos en `.env`
- Token se guarda en `localStorage` como `sb-token`
- Router guard: redirige a `/login` si no autenticado
- API client inyecta `Authorization: Bearer <token>` automaticamente

### Alias
`@` apunta a `web/src` (configurado en vite.config.ts)

## Backend (api/) — estructura

| Directorio | Contenido |
|---|---|
| `src/routes/` | 7 modulos: insumos, productos, clientes, presupuestos, finanzas, dashboard, ajustes |
| `src/middleware/` | Supabase Auth middleware |
| `src/lib/` | Prisma client, utilidades |
| `src/types/` | Zod schemas de validacion |

### Rutas API
- `GET /health` — health check
- `/api/insumos` — CRUD + categorias + proveedores
- `/api/productos` — CRUD + categorias + BOM
- `/api/clientes` — CRUD + contactos
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

## Design system — leer antes de tocar UI

Todo lo visual esta en `docs/MVP/design-system/project/`. No inventar nada.

| Archivo | Que contiene |
|---|---|
| `colors_and_type.css` | Tokens CSS (colores, tipografia, espaciado, radios, sombras) |
| `ui_kits/presumemi/styles.css` | Estilos de componentes (.btn-*, .card, .badge, .data-table, .drawer, etc.) |
| `ui_kits/presumemi/*.jsx` | Prototipo React interactivo — referencia visual pixel-perfect |
| `preview/*.html` | Componentes individuales aislados |
| `assets/memydeni-logo.png` | Logo con fondo transparente (usar siempre este) |

**Regla:** trasladar JSX → Vue SFC. No copiar codigo React.

**Leer `CLAUDE.md`** para design system detallado (tokens, componentes, tipografia, iconos, reglas de estilo).

## Seed data

Fuente: `docs/MVP/design-system/project/ui_kits/presumemi/data.jsx` e `insumo_detalle.jsx`
- 9 categorias producto, 8 categorias insumo
- 18 insumos con stock, minimos y costos reales
- 3 filas distribucion: Meme 40%, Pety 30%, Gastos 30%
- 1 config inicial (nombre "MemyDeni", moneda ARS)

## Copy y contenido

- Idioma: espanol (es-MX / neutro latinoamericano), tuteo
- Sin emojis en la UI. Nunca.
- Sentence case. Sin punto final en botones, menus, labels ni celdas de tabla.
- Moneda: `$ 1,250.00 MXN` en vistas financieras; sin `MXN` en tablas densas.

## Git & Commits

- **Pruebas previas:** Antes de realizar cualquier commit, el usuario debe probar las cosas él mismo. Los agentes no deben realizar commits de forma autónoma sin previa confirmación o autorización explícita tras las pruebas del usuario. Siempre se realiza el comando `git add .` para preparar el commit; cualquier archivo que no quiera ser seguido por el motivo que sea tiene que agregarse al `.gitignore`.
