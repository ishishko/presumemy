# Marco de aplicación FSD — frontend `web/` de Presumemi (adaptación no canónica)

Documento de arquitectura. Compañero de `00_Plan_Refactor_Completo.md`. Define **cómo** se aplica Feature-Sliced Design en este proyecto: qué se adopta del estándar, qué se relaja y por qué, dónde va cada cosa, y cómo convive con el refactor de Tailwind/SOLID ya en curso.

---

## 1\. Propósito y postura

FSD es una metodología **agnóstica de framework** pensada originalmente con ejemplos en React. Acá se adopta su **columna vertebral** —capas con regla de dependencia unidireccional, slices por dominio, segmentos por propósito técnico— pero **no su forma canónica completa**. Presumemi es una app de **escala mediana**, con un panel administrativo de muchos submódulos interconectados, y ya tiene una estructura *package-by-layer* funcionando (`views/`, `components/`, `stores/`, `services/`, `composables/`, `utils/`). El objetivo no es "FSD por el libro", sino **adoptar la parte de FSD que abarata el próximo cambio** y dejar documentadas las desviaciones para que sean decisiones, no accidentes.

Principio rector, alineado con el plan de refactor: **pages-first \+ Regla de Tres \+ YAGNI**. No se crean capas ni abstracciones por anticipado; el código vive lo más "arriba" (cerca de su uso) posible hasta que el reuso real justifique bajarlo.

---

## 2\. Vocabulario FSD (los tres niveles)

- **Capa (layer):** primer nivel. Folder en minúscula en la raíz de `src/`. Define cuánta responsabilidad y cuántas dependencias puede tener el código que contiene.  
- **Slice:** segundo nivel. Subcarpeta dentro de una capa, partida **por dominio de negocio** (`insumo`, `cliente`, `presupuesto`…). Los nombres de slice los define el negocio, no el estándar.  
- **Segmento (segment):** tercer nivel. Subcarpeta dentro de un slice, partida **por propósito técnico**: `ui`, `model`, `api`, `lib`, `config`.

La invariante de FSD que **sí** es no-negociable: **regla de dependencia hacia abajo** \+ **no-import lateral entre slices de la misma capa** (ver §6).

---

## 3\. Capas adoptadas en Presumemi

De las 7 canónicas se adoptan **6**. Orden de mayor a menor responsabilidad/dependencia:

| Capa | ¿Se adopta? | Rol en Presumemi |
| :---- | :---- | :---- |
| `app` | Sí | Arranque, providers, router, Pinia, estilos globales (`@theme`), shell raíz. |
| ~~`processes`~~ | **No** | Deprecada en la spec. Lógica inter-página vive en `app` o, si se reusa, en `features`. |
| `pages` | Sí | Pantallas ruteadas. Reemplaza a `views/`. |
| `widgets` | Sí | Bloques grandes autocontenidos que componen un caso de uso (drawers, overlays, editor). |
| `features` | Sí, **lazy** | Acciones del usuario con valor de negocio, **reutilizadas**. Arranca casi vacía (ver §5). |
| `entities` | Sí | Conceptos del dominio: `insumo`, `producto`, `cliente`, `presupuesto`, `finanza`, `categoria`. |
| `shared` | Sí | UI kit sin negocio, helpers, cliente HTTP, tokens, config. |

No es obligatorio usar todas las capas; la spec misma recomienda agregar una capa sólo si aporta valor. Presumemi empieza fuerte en `app`, `shared`, `entities`, `pages` y `widgets`, y deja `features` para cuando aparezca el reuso.

---

## 4\. Segmentos: traducción FSD → Vue

FSD describe los segmentos con vocabulario neutro; acá se fijan a la realidad Vue 3 \+ Pinia \+ composables del proyecto:

| Segmento | Contenido canónico | Equivalente concreto en Presumemi |
| :---- | :---- | :---- |
| `ui` | Todo lo visual | SFCs presentacionales (`.vue`), estilos co-locados, formatters de presentación. |
| `model` | Modelo de datos y lógica | **Stores de Pinia**, tipos/interfaces del dominio, reglas de negocio, composables de estado del dominio (p. ej. `useStockLevel`). |
| `api` | Interacción con backend | Funciones de request **específicas de la entidad**, DTOs/mappers. |
| `lib` | Utilidades del slice | Helpers puros y composables utilitarios sin estado de dominio. |
| `config` | Constantes/configuración | Enums, constantes, umbrales, flags. |

Regla de nombres de segmento (de la spec): el nombre describe el **propósito**, no la **esencia**. Por eso `components/`, `hooks/`, `types/` son malos nombres de segmento. En Presumemi: un store NO va en un segmento `stores/`, va en `model/`; un composable de stock NO va en `composables/`, va en `model/` de su entidad.

---

## 5\. Cómo decidir dónde va cada cosa (árbol de decisión)

Aplicar en orden; el primer "sí" gana:

1. **¿Es genérico y no sabe nada del negocio?** (un botón, un input flotante, `formatMoney`, el cliente `ofetch`) → **`shared`**.  
2. **¿Representa un concepto del dominio** (insumo, cliente, presupuesto…)? → **`entities/<concepto>`**.  
3. **¿Es un bloque grande y autocontenido que compone varias piezas para resolver un caso de uso**, y no se reusa fuera de sí mismo? → **`widgets/<x>`**. Puede tener su propio store/lógica local (FSD 2.x lo permite).  
4. **¿Es una acción del usuario que aporta valor de negocio y se reusa en ≥2 lugares?** → **`features/<x>`**. Si todavía se usa en un solo lado, **no** la creés: vive en la page/widget que la usa (pages-first).  
5. **¿Es una pantalla ruteada?** → **`pages/<x>`**.  
6. **¿Es arranque, providers o estilos globales?** → **`app`**.

### Regla de la capa `features` *lazy*

La trampa más común de FSD es inflar `features/` por anticipado. Política de Presumemi: **`features/` arranca vacía**. Un comportamiento sólo "se gana" la capa `features` cuando se cumple la **Regla de Tres** (tercer uso real) o cuando se necesita el mismo flujo en ≥2 pages/widgets. Hasta entonces vive donde se usa. Candidatos a vigilar (todavía NO promovidos): "borrar categoría con reasignación", "cambiar estado del presupuesto (FSM)", "editar contactos del cliente".

---

## 6\. Regla de dependencia (la invariante)

Una capa **sólo puede importar de las capas estrictamente por debajo**. Ningún import hacia arriba, ningún import lateral entre slices de la misma capa.

app  →  pages  →  widgets  →  features  →  entities  →  shared

(importa hacia la derecha; nunca a la izquierda ni a un hermano del mismo nivel)

Traducido a Presumemi:

- Una `page` puede importar `widgets`, `features`, `entities`, `shared`.  
- Un `widget` puede importar `features`, `entities`, `shared`.  
- Un store en `entities/insumo/model` **sólo** puede importar de `shared`.  
- Un componente de `shared/ui` **no importa nada del proyecto** (sólo Vue y libs externas).  
- **`entities/presupuesto` no puede importar `entities/cliente`** (hermanos). Si lo necesita: o se sube la lógica a una capa superior, o se usa el cross-import controlado `@x` (ver §9, diferido como deuda).

Esta regla **realiza automáticamente** el objetivo DIP del plan de refactor ("componentes/vistas no importan `services/api`"). Al mover `services/api.ts` a `shared/api` y mediar el acceso a datos por el segmento `api`/`model` de cada entidad, las pages dejan de tocar el cliente HTTP por construcción, no por disciplina.

### Public API por slice

Cada slice expone un `index.ts` (barrel) y se importa **siempre por el barrel**, nunca por path profundo:

// ✅

import { useInsumosStore, StockBar } from '@/entities/insumo'

// ❌

import { useInsumosStore } from '@/entities/insumo/model/store'

Esto permite refactorizar el interior del slice sin romper consumidores —exactamente el "abaratar el próximo cambio" del plan. **Obligatorio en `entities` y `widgets`; opcional en `pages`** (las pages no suelen ser consumidas por nadie).

---

## 7\. Estructura objetivo de `web/src/`

web/src/

├── app/

│   ├── providers/            \# setup de router \+ pinia

│   ├── styles/               \# main.css con @theme (tokens) \+ @layer base

│   ├── App.vue               \# shell raíz (grid sidebar 240px \+ main)

│   └── main.ts

│

├── pages/

│   ├── dashboard/            \# DashboardView

│   ├── clientes/             \# ClientesView

│   ├── productos/            \# ProductosView

│   ├── insumos/              \# InsumosView (orquestador delgado — piloto SOLID)

│   ├── presupuestos/         \# PresupuestosView

│   ├── finanzas/             \# FinanzasView

│   ├── ajustes/              \# AjustesView (cada bloque a su subcomponente)

│   ├── login/                \# ← hoy features/auth/LoginView (es una page, no una feature)

│   └── presupuesto-publico/  \# ← hoy features/public/PublicPresupuestoView

│

├── widgets/

│   ├── app-sidebar/          \# TheSidebar

│   ├── app-header/           \# AppHeader

│   ├── cliente-drawer/       \# ClienteDrawer (extrae ContactosEditor)

│   ├── movimiento-drawer/    \# MovimientoDrawer

│   ├── imprenta-drawer/      \# ImprentaDrawer

│   ├── producto-detalle/     \# ProductoDetalle (extrae BomEditor)

│   ├── insumo-detalle/       \# InsumoDetalle (secciones: proveedores/costeo/stock)

│   └── presupuesto-editor/   \# PresupuestoEditor (LinesSpreadsheet, EditorTotals, EditorHeader)

│

├── features/                 \# LAZY — vacía al inicio; se llena por Regla de Tres

│

├── entities/

│   ├── insumo/

│   │   ├── model/            \# store insumos, tipos, useStockLevel, umbrales/nivelMeta

│   │   ├── ui/               \# StockBar { stock, minimo }

│   │   ├── api/              \# requests de insumo

│   │   └── index.ts

│   ├── producto/             \# store \+ ProductCard, BOM types

│   ├── cliente/              \# store \+ tipos contacto

│   ├── presupuesto/

│   │   ├── model/            \# store \+ FSM de estados \+ cálculos

│   │   ├── ui/               \# PresupuestoDoc (preview presentacional)

│   │   ├── lib/              \# mapa estado→tone para StatusBadge (estrategia/OCP)

│   │   └── index.ts

│   ├── finanza/              \# store finanzas/movimientos

│   └── categoria/            \# entidad transversal a insumo+producto (ver nota §8)

│

└── shared/

    ├── ui/                   \# UI kit sin negocio (ver §8)

    ├── lib/                  \# format.ts (formatMoney/formatDate), useToast, useDirty

    ├── api/                  \# cliente ofetch (hoy services/api.ts) — único que conoce ofetch

    ├── config/               \# constantes, env, tokens no-CSS

    └── (sin index único: shared se consume por segmento)

---

## 8\. Reglas de ubicación finas (los casos dudosos)

- **UI kit → `shared/ui`:** `BaseButton`, `BaseCard`, `BaseKpi`, `StatusBadge` (genérico), `DataTable`, `RowActions`, `ConfirmDialog`, `DrawerShell`, `ToggleSwitch`, `SegmentedControl`, `FloatingField`, `FloatingSelect`, `ToastContainer`, `PageHead`. **Criterio:** no saben nada del dominio; reciben props segregadas y mapas de variante.  
- **Presentacional con conocimiento de dominio → `entities/<x>/ui`:** `StockBar` (entiende `stock`/`minimo`) va en `entities/insumo`; `PresupuestoDoc` va en `entities/presupuesto`.  
- **`StatusBadge` es genérico, pero su mapeo no:** el componente vive en `shared/ui`; el `Record<EstadoPresupuesto, Tone>` vive en `entities/presupuesto/lib`. Así el badge es reusable y la regla de negocio (qué estado pinta de qué color) queda en su dominio. Esto es literalmente el "mapa de estrategia (OCP)" del plan, **ubicado correctamente**.  
- **`CategoriaPills` / `CategoriaDeleteDialog`:** "categoría" es un concepto compartido por `insumo` y `producto`. Se modela como **entidad propia `categoria`** (no como `shared`, porque tiene negocio; no dentro de `insumo`, porque la compartirían dos slices hermanos y eso violaría el no-import lateral).  
- **Composables event-bus singleton (`useEditorMode`, `useCreateTrigger`):** son estado global de aplicación → `app` o `shared/model`. Ya están anotados como deuda menor en el plan; FSD no los bendice pero tampoco obliga a refactorizarlos ahora.  
- **`useToast`, `useDirty`:** utilitarios transversales sin dominio → `shared/lib`.  
- **Corrección de naming heredado:** la carpeta actual `features/auth/` y `features/public/` **no son features de FSD**: son pantallas ruteadas. Pasan a `pages/login` y `pages/presupuesto-publico`. La *acción* de login (submit \+ manejo de credenciales) sí podría volverse `features/auth` o una entidad `session` más adelante (lazy).

---

## 9\. Desviaciones respecto del canon (declaradas a propósito)

| Regla canónica FSD | Decisión en Presumemi | Motivo |
| :---- | :---- | :---- |
| 7 capas | 6 (sin `processes`) | Capa deprecada por la propia spec. |
| `features` como capa de primera clase | `features` **lazy / opt-in** por Regla de Tres | Pages-first \+ YAGNI; evita inflar la capa. |
| Carpeta `pages` | Se adopta `pages` renombrando `views/` | Alineación canónica; costo \= un rename. |
| Public API (`index.ts`) en **todo** slice | Obligatorio en `entities` y `widgets`; opcional en `pages` | Costo/beneficio: las pages no se consumen. |
| Cross-import `@x` para dependencias entre entidades | **Diferido** (deuda explícita) | Pocos cruces al inicio; se introduce cuando aparezca el primer caso real (`presupuesto`↔`cliente`). |
| Componentes agnósticos de framework | SFCs Vue \+ Pinia \+ composables como `model` | Traducción al stack real. |
| Estilos co-locados por slice | Tokens globales en `app/styles` (`@theme`); resto Tailwind co-locado | Intersección con el refactor de CSS (ver §10). |

---

## 10\. Convivencia con el refactor Tailwind/SOLID (Grupos 0–7)

El refactor de estilado/componentización del plan y la **relocalización FSD** son **ortogonales**: uno cambia *cómo se ve y se compone* cada SFC; el otro cambia *dónde vive*. Hay dos estrategias para no duplicar trabajo:

**Opción A — "relocalizar al tocar" (recomendada).** Cada vez que un Grupo del plan toca un archivo, ese archivo se escribe **directamente en su destino FSD**, no en su ruta actual. Una sola pasada. El mapeo Grupo→capa es casi 1:1:

| Grupo del plan | Destino FSD |
| :---- | :---- |
| Grupo 0 (tokens `@theme`, base) | `app/styles` |
| Grupo 1 (utils, composables, stores, api) | `shared/lib`, `shared/api`, y `model`/`api` de cada `entity` |
| Grupo 2–3 (primitivos hoja, base nuevos) | `shared/ui` |
| Grupo 3 (shell: sidebar, header, App) | `widgets/*` (sidebar, header) \+ `app` (App.vue) |
| Grupo 4 (CategoriaPills, PresupuestoDoc…) | `entities/categoria`, `entities/presupuesto/ui` |
| Grupo 5 (vistas) | `pages/*` |
| Grupo 6 (drawers/overlays/editor) | `widgets/*` |
| Grupo 7 (limpieza) | \+ barrido de imports profundos y barrels |

Riesgo: mover archivos a la vez que se reescriben agrega churn en los diffs. Mitigación: hacerlo **grupo por grupo**, con typecheck (`vue-tsc`) tras cada grupo, igual que ya define el plan.

**Opción B — "dos fases".** Terminar todo el refactor de Tailwind/SOLID en la estructura actual y recién después una pasada estructural dedicada (**"Grupo 8 — relocalización FSD"**). Diffs más limpios por fase, pero se tocan los archivos dos veces. Conviene sólo si el equipo prefiere separar revisión de estilo de revisión de arquitectura.

Recomendación: **Opción A**, salvo que el flujo de PRs/revisión exija separar las dos preocupaciones.

---

## 11\. Enforcement (que la regla no dependa de la disciplina)

- **Steiger** — linter oficial de FSD; detecta violaciones de capa, slices sin public API, imports laterales. Correr en CI junto a `vue-tsc`.  
- **Alias de import** en `vite.config` / `tsconfig`: `@/app`, `@/pages`, `@/widgets`, `@/features`, `@/entities`, `@/shared`. Hace que un import "hacia arriba" o "profundo" sea visualmente evidente en review.  
- **ESLint** con una regla de `no-restricted-imports` (o `eslint-plugin-boundaries`) que prohíba: (a) importar `@/shared/api`/`ofetch` desde `pages`/`widgets`; (b) imports entre slices hermanos.  
- **Verificación heredada del plan:** `vue-tsc -b` sin errores tras cada grupo, `npm run build`, `npm run test`, y comparación visual pixel-perfect contra el prototipo. El barrido de clases huérfanas del Grupo 7 se extiende a **imports profundos huérfanos** (que no respeten los barrels).

Verificar las versiones/nombres exactos de Steiger y del plugin de ESLint al instalarlos; el ecosistema de tooling FSD se mueve y conviene fijar versiones en `package.json`.

---

## 12\. Resumen ejecutable

1. Adoptar 6 capas: `app · pages · widgets · features(lazy) · entities · shared`.  
2. Slices por dominio: `insumo · producto · cliente · presupuesto · finanza · categoria`.  
3. Segmentos `ui/model/api/lib/config`, con `model` \= Pinia \+ composables de dominio.  
4. Regla de dependencia hacia abajo \+ sin imports laterales \+ public API por barrel.  
5. `services/api.ts` → `shared/api`; las pages/widgets nunca tocan el cliente HTTP (DIP por construcción).  
6. `features/` arranca vacía; se llena por Regla de Tres.  
7. Relocalizar al tocar, grupo por grupo, validando typecheck \+ visual.  
8. Enforcar con Steiger \+ ESLint boundaries \+ alias, en CI.

