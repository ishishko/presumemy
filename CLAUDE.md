# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Presumemi** — microERP minimalista para **MemyDeni**, negocio artesanal de artículos de papel para fiestas y eventos.

Gestiona: presupuestos (cotizaciones), catálogo de productos, insumos (inventario) y finanzas.

**Stack:** Vue 3 + Vite + TypeScript + Tailwind v4 (SPA), con backend Hono + Prisma + Supabase PostgreSQL.

## Commands

### Frontend (web/)
```bash
cd web
npm install           # instalar dependencias
npm run dev           # servidor de desarrollo (puerto 5173)
npm run build         # vue-tsc -b && vite build
npm run preview       # vite preview
```

### Backend (api/)
```bash
cd api
npm run dev           # tsx watch src/index.ts (puerto 3000)
npm run db:migrate    # prisma migrate dev
npm run db:studio     # prisma studio
npm run db:seed       # prisma db seed
npm run db:reset      # prisma migrate reset --force && prisma db seed
```

### Verificacion
```bash
cd web && npx vue-tsc -b    # typecheck sin build
```

### Dev en WSL
Ambos servidores corren simultaneamente. Vite tiene `usePolling: true` para WSL + NTFS.
El frontend hace proxy de `/api` → `http://localhost:3000`.

## Design System

El design system completo esta en `docs/MVP/design-system/project/`. **Leer antes de tocar cualquier UI.**

Archivos clave:
- `docs/MVP/design-system/project/colors_and_type.css` — todos los CSS custom properties (colores, tipografia, espaciado, radios, sombras).
- `docs/MVP/design-system/project/ui_kits/presumemi/styles.css` — estilos de componentes (sidebar, topbar, botones, cards, tablas, drawer, etc.)
- `docs/MVP/design-system/project/ui_kits/presumemi/` — prototipo React interactivo con todas las pantallas. **Usar como referencia visual pixel-perfect**, no copiar la implementacion.
- `docs/MVP/design-system/project/assets/memydeni-logo.png` — wordmark con fondo transparente. Usar siempre esta version.

El prototipo interactivo se abre en `docs/MVP/design-system/project/ui_kits/presumemi/index.html`.

## Architecture

### Pantallas / Rutas

| Ruta | Pantalla |
|---|---|
| `/` o `/dashboard` | Dashboard — KPIs, presupuestos recientes, stock bajo, grafico semanal |
| `/presupuestos` | Lista de presupuestos con filtros; abre editor |
| `/productos` | Grid/lista de productos con filtro por categoria |
| `/insumos` | Tabla de insumos con barras de stock y badges de estado |
| `/finanzas` | KPIs del mes + libro de movimientos |
| `/clientes` | Lista de clientes con avatars y tags |
| `/ajustes` | Configuracion del negocio |
| `/login` | Login con logo MemyDeni |

### Layout del shell

- **Sidebar fijo:** 240px, fondo `--violet-700` (`#8B2570`), sticky, altura 100vh.
- **Topbar fijo:** 56px, blanco semitransparente con `backdrop-filter: blur(8px)`, sticky top-0 z-10.
- **Contenido principal:** scrollable, padding `--s-8` (32px).
- El logo MemyDeni aparece en el sidebar (120px ancho) dentro de un card blanco.

### Tokens de diseño

Importar `colors_and_type.css` como capa base. Todos los valores hardcodeados son un bug — siempre usar las variables CSS:

```
--violet-700   #8B2570   headings, sidebar, bordes activos (texto siempre #fff)
--teal-500     #75CCCE   CTAs primarios, links, focus (texto siempre #fff)
--coral-500    #EA5F3C   SOLO error/destructivo (texto siempre #fff)
--ink          #1C1A1E   texto body, tablas, labels
--ink-muted    #6B6270   texto secundario
--page-bg      #F7F5F3   fondo de pagina
--surface      #FFFFFF   cards, panels
--border       rgba(28,26,30,0.10)   hairline
--lavender     #DBA8CD   solo fondos/tags (nunca color de texto)
--mint         #D0EADD   solo fondos exito
--yellow       #F8D132   solo fondos advertencia (texto: --yellow-ink #7A5D00)
--coral-50     #FCEBE6   solo fondos error suave
```

Grid de espaciado: multiplos de 4px (`--s-1` a `--s-16`). **Nunca pixeles crudos.**

### Tipografía

- Fuente: **Onest** (Google Fonts, pesos 400/500/600/700).
- Headings: peso 500, color `--violet-700`, `letter-spacing: -0.01em`.
- Body: 14px, peso 400, color `--ink`, `line-height: 1.5`.
- Minimo: 12px en cualquier lugar de la UI.
- Numeros en tablas/totales: `font-variant-numeric: tabular-nums`.

### Iconografía

**Lucide** — stroke 1.5px, `currentColor`, nunca color hardcodeado en el SVG.

Tamanos: 16px en UI densa, 20px en headers, 24px en nav del sidebar.

### Reglas de componentes

**Botones**
- `.btn-primary` — fondo `--teal-500`, texto blanco. Hover: `filter: brightness(0.94)`.
- `.btn-secondary` — fondo `--surface`, borde `--border-strong`.
- `.btn-ghost` — transparente, texto `--violet-700`. Hover: fondo `--violet-50`.
- `.btn-danger` — fondo `--coral-500`. Solo para acciones destructivas.
- Press: `transform: translateY(1px)`.
- Disabled: 50% opacidad, nunca fondo gris.

**Cards:** fondo `--surface`, borde `1px solid var(--border)`, radio `--r-lg` (12px), sombra `--shadow-1`.

**Badges/pills:** radio `--r-pill` (999px). Pasteles solo para fondos; el texto usa `--ink` o el override del color (ej. `--yellow-ink` sobre amarillo).

**Tablas:** headers en uppercase 11px `--ink-muted` con `letter-spacing: 0.06em`. Celdas 13px. Hover de fila: `--page-bg`.

**Focus:** ring de 3px teal (`--focus-ring`). Ring coral en controles destructivos.

**Animaciones:** 120ms hover (`ease`), 180ms entrada de menus/drawers (`cubic-bezier(0.2, 0.8, 0.2, 1)`). Sin bounces ni spring physics. Transiciones de pagina: instantaneas.

### Contenido / Copy

- **Idioma:** espanol (es-MX / neutro latinoamericano).
- **Persona:** tuteo (`tu`). Primera persona plural cuando el sistema actua (`"guardamos tus cambios"`).
- **Casing:** sentence case en todo. MAYUSCULAS solo en eyebrows (`h6`, <=12px) y headers de tabla que necesiten diferenciarse.
- **Sin emojis** en la UI del producto. Nunca.
- **Puntuacion:** sin punto final en botones, items de menu, celdas de tabla ni labels.
- **Moneda:** `$ 1,250.00 MXN` en vistas financieras; omitir `MXN` en tablas densas.

### Logo MemyDeni

- Usar siempre `memydeni-logo.png` (fondo transparente) sobre superficies claras.
- **No alterar** colores ni proporciones.
- Ancho minimo: 96px. En sidebar: 120px. En login hero: 320px.
- Espacio libre alrededor: ~25% de la altura del logo en todos los lados.
- Solo aparece en: sidebar, login, hero de landing. Nunca sobre fondo violeta.

## Git & Commit Rules

- **Validación del Usuario:** Antes de realizar cualquier commit, el usuario debe probar los cambios él mismo. Los agentes no deben realizar commits de forma autónoma sin confirmación explícita después de que el usuario haya verificado la funcionalidad. Siempre se realiza el comando `git add .` para preparar el commit; cualquier archivo que no quiera ser seguido por el motivo que sea tiene que agregarse al `.gitignore`.
- **Sin coautor:** Nunca agregar el trailer `Co-Authored-By` ni mencionar a Claude/agentes en los mensajes de commit. Los commits no llevan coautoría de IA.
