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
npx tsx src/index.ts # RECOMENDADO PARA AGENTES (evita colisiones y bloqueos de TTY de watch)
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

## Frontend (web/) — estructura modular por dominio

La organizacion es **modular por dominio**, no por tipo de artefacto. Todo lo
de un dominio vive en su carpeta.

| Directorio | Contenido |
|---|---|
| `src/app/` | Arranque de la SPA: `main.ts`, `App.vue`, `router.ts`, `pinia.ts`, `styles/main.css` y el shell (`shell/AppHeader.vue`, `shell/AppSidebar.vue`) |
| `src/modules/<dominio>/` | Un modulo por dominio: auth, dashboard, insumos, productos, clientes, presupuestos, finanzas, ajustes, search |
| `src/shared/api/` | `client.ts` — adapter HTTP (ofetch + JWT). **Unico** que conoce ofetch |
| `src/shared/lib/` | Utilidades sin dominio: `format`, `useToast`, `useDirty`, `usePagination`, `useFormSnapshot`, `editorSlot`, `createTrigger` |
| `src/shared/ui/` | Primitivos sin dominio: BaseButton, BaseCard, BaseKpi, DataTable, DrawerShell, ConfirmDialog, FloatingField/Select, StatusBadge, OverlayShell, etc. |
| `src/shared/types.ts` | Solo lo transversal de verdad (`PaginationResult`) |
| `src/assets/css/components.css` | CSS legacy que queda por migrar. **No agregar nada aca** |

### Anatomia de un modulo

```
modules/<dominio>/
  <Dominio>Page.vue    # pagina de la ruta (la importa el router con import() lazy)
  api.ts               # unico punto del modulo que habla HTTP
  store.ts             # estado Pinia; el unico que consume api.ts
  types.ts             # tipos del dominio
  schema.ts            # schemas Zod del dominio
  stock.ts             # reglas de negocio puras (ejemplo de insumos)
  components/          # componentes internos del modulo
  index.ts             # API publica del modulo (barrel)
```

### Reglas que hay que respetar

- **DIP:** ningun `.vue` importa `shared/api/client`. La UI usa acciones del
  store; el store usa `api.ts`. Verificable:
  `grep -rn "shared/api/client" web/src --include=*.vue` debe dar vacio.
- **Regla de dependencia:** `app → modules → shared`. `shared` no conoce
  ningun dominio y `modules` no importa de `app`.
- **Cruce entre modulos:** por el barrel (`@/modules/<otro>`), y para datos
  siempre a traves del **store** del otro modulo, nunca con HTTP propio.
  Los tipos se importan con `import type`, que TypeScript borra en
  compilacion y por eso no genera ciclos entre barrels.
- **Los barrels no exportan las paginas:** el router las importa por ruta
  directa con `import()` para no romper el code splitting.
- **Cambios sin guardar:** se detectan con `useFormSnapshot`, que fotografia
  el formulario al cargarlo y lo compara contra si mismo. No comparar campo
  por campo contra el registro de la API: se rompe por orden de claves de un
  JSON, Decimals serializados como string o valores derivados. Al snapshot
  entra solo lo que edita el usuario.
- **Editores fullscreen:** son duenos de sus controles y los teletransportan
  al header con `EDITOR_SLOT_ID` (`shared/lib/editorSlot`). El shell solo
  sabe si hay un editor abierto, para ocultar "Crear nuevo".
- **Salir con cambios:** todo editor registra `onBeforeRouteLeave` y expone
  `requestClose()` para que la pagina pueda cerrarlo cuando el aside pide
  volver a la lista.

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
- **Modo de calculo del BOM** (`costo_producto_insumo.modo_calculo`): cada linea
  de receta declara como participa en el precio del producto.
  - `normal` — entra al costo BOM y recibe el margen.
  - `fijo` — no entra al costo BOM; se suma al precio **despues** del margen.
  - `extra` — no suma ni al costo ni al precio (informativo).

  La API es la fuente de verdad de `costoBOM` y `precioSugerido`: el front
  previsualiza con la misma regla, pero el backend recalcula al guardar.
- **Nivel de stock de un insumo** (`modules/insumos/stock.ts`, en el front):
  con stock y minimo en 0 el insumo no esta bajo control de inventario y se
  reporta como `sin_control`, no como faltante. Sin minimo cargado la barra
  va llena.

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
