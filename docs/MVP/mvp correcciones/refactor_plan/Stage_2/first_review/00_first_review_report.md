# First Review — Post Refactorización Stage 2

**Fecha:** 2026-07-14
**Analista:** opencode (automated)
**Herramientas:** Análisis estático de código + pruebas E2E con Playwright

---

## Contexto

Se evaluó el estado del frontend de Presumemi tras la ejecución del plan de refactorización Stage 2, cuyo objetivo era: recuperar el CRUD de categorías, unificar moneda a ARS/es-AR, migrar a Tailwind v4 puro, desacoplar `editorMode`, aplicar DIP (inversión de dependencias) y extraer subcomponentes canónicos.

---

## Resumen ejecutivo

**La refactorización Stage 2 NO es funcionalmente estable.** Se identificaron **2 bugs críticos** que impiden la operación básica del ERP (crear/editar insumos y productos), **2 bugs de alto impacto** en layout y navegación, y **3 bugs de impacto medio** en formato y encoding. La componentización y el posicionamiento base están bien resueltos, pero la deuda técnica del plan original (§1 DIP, §4A/4B/4B CSS y editorMode) sigue pendiente.

---

## Bugs encontrados

### CRITICAL

| # | Módulo | Descripción | Impacto |
|---|--------|-------------|---------|
| C-1 | Insumos | **Overlay `InsumoDetalle` no se abre** — ni con "Crear nuevo" ni con "Editar" ni con doble-click en fila. El estado `showOverlay` no activa la renderización del componente. | Bloquea toda operación de creación/edición de insumos |
| C-2 | Productos | **Overlay `ProductoDetalle` no se abre** — mismo comportamiento que C-1. El overlay se instancia pero no se visualiza. | Bloquea toda operación de creación/edición de productos |

**Diagnóstico parcial de C-1:**
- Se identificó y corrigió un import faltante de `Trash2` en `InsumoDetalle.vue:3` (solo importaba `Lock`). Esto generaba un warning de Vue: `Failed to resolve component: Trash2`.
- Tras la corrección y reload completo, el overlay **sigue sin abrirse**, lo que sugiere un problema más profundo en el mecanismo de renderizado del overlay (posiblemente relacionado con el `v-if`/`Transition` o con la integración del `editorMode` global).
- El mismo patrón se repite en ProductoDetalle, indicando un problema arquitectónico compartido.

### HIGH

| # | Módulo | Descripción | Impacto |
|---|--------|-------------|---------|
| H-1 | Layout global | **Sidebar mide 210px en vez de 240px.** Causa: `root: 14px` + Tailwind `w-60` (15rem) = 210px. Los overlays usan `left-[240px]` creando un espacio vacío de 30px entre sidebar y overlay. | Desalineación visual en todos los overlays a pantalla completa |
| H-2 | Dashboard | **Deep-links desde widgets no navegan.** Click en "Insumos a reponer" y "Presupuestos recientes" no redirige a los módulos correspondientes. | Los accesos directos del dashboard no funcionan |

### MEDIUM

| # | Módulo | Descripción | Impacto |
|---|--------|-------------|---------|
| M-1 | Insumos | **Encoding roto en `CategoriaPills.vue`** — caracteres "┬À" en vez de "·" en los badges de conteo (ej: "Cortes ┬À 3"). | Degradación visual en los pills de categorías |
| M-2 | Insumos | **Formato de moneda no centralizado en tabla** — muestra "$ 8.8" en vez de "$ 8,80". No usa `formatMoney()` de `format.ts`. | Inconsistencia con el estándar ARS definido en el plan |
| M-3 | Insumos | **`StockBar` no muestra badges de nivel en la tabla** — la columna "Nivel" se renderiza vacía. | El usuario no puede visualizar el estado de stock de un vistazo |

---

## Incumplimientos del plan Stage 2

### 1. DIP incompleto — 11 archivos aún importan `shared/api/client` directo

| Archivo | Import | Uso |
|---------|--------|-----|
| `InsumoDetalle.vue:4` | `get` | Cargar categorías/proveedores |
| `ProductoDetalle.vue:5` | `get` | Cargar categorías/insumos |
| `PresupuestoEditor.vue:4` | `get` | Cargar clientes/productos/config |
| `ProveedoresEditor.vue:4` | `post, del` | CRUD de proveedores (subcomponente nuevo) |
| `ClienteDrawer.vue:4` | `post, put` | CRUD de clientes |
| `MovimientoDrawer.vue:4` | `post, put, get` | CRUD de transacciones |
| `ImprentaDrawer.vue:4` | `post, put, get` | CRUD de órdenes de imprenta |
| `ProductosPage.vue:7` | `patch` | Toggle favorito |
| `PresupuestosPage.vue:4` | `patch` | Cambio de estado |
| `AjustesPage.vue:3` | `get, put` | Configuración |
| `DashboardPage.vue:16` | `get` | KPIs |

### 2. `editorMode` NO desacoplado (Plan §4B)

- `AppHeader.vue:92-111` aún renderiza botones Save/X en modo editor
- Los 3 overlays aún emiten `update:header` con modo editor
- `editorDirty` de `@/shared/lib/editorMode` sigue activo en InsumoDetalle, ProductoDetalle y PresupuestoEditor
- `PresupuestoEditor.vue:542` aún usa `<Teleport to="#editor-header-status">`

### 3. CSS scoped masivo NO migrado a Tailwind v4 (Plan §4A)

| Componente | Líneas de CSS scoped |
|------------|---------------------|
| `InsumoDetalle.vue` | ~420 líneas (532-952) |
| `ProductoDetalle.vue` | ~500 líneas (680-1184) |
| `PresupuestoEditor.vue` | ~340 líneas (801-1139) |

### 4. Moneda no centralizada

- `ProductoDetalle.vue:126-128` — `money()` local con `toLocaleString` manual
- `MovimientoDrawer.vue:72` — `moneyAbs` con formato manual
- `ImprentaDrawer.vue:48-50` — `money()` local

---

## Lo que funciona correctamente

| Área | Estado | Detalle |
|------|--------|---------|
| Typecheck | OK | `vue-tsc -b` pasa sin errores |
| Build | OK | `npm run build` completa exitosamente |
| Login | OK | Autenticación via Supabase funciona |
| Dashboard visual | OK | KPIs, widgets y layout de 2 columnas |
| Sidebar | OK | Navegación entre módulos |
| Listado Insumos | OK | 19 insumos, filtros de stock, tabla |
| Listado Productos | OK | Grid de tarjetas con favoritos |
| CategoriaPills | OK (visual) | Pills renderizan, CRUD inline funcional |
| Stores | OK | Acciones `create`/`update`/`remove` implementadas |
| Subcomponentes | OK | ProveedoresEditor, InsumoStockForm, BomEditor, ProductoMedidasForm, LinesSpreadsheet, EditorTotals |
| Drawers layout | OK | Tailwind v4 puro + transiciones scoped (excepción del plan) |
| format.ts | OK | `es-AR` con sufijo ARS opcional |

---

## Screenshots de evidencia

Todos los screenshots capturados durante las pruebas se encuentran en esta carpeta (`first_review/`):

| Archivo | Descripción |
|---------|-------------|
| `stage2_dashboard.png` | Dashboard post-refactor con widgets y KPIs |
| `stage2_insumos_list.png` | Listado de insumos con filtros y CategoriaPills |
| `stage2_productos_list.png` | Grid de productos con tarjetas |
| `dashboard.png` | Dashboard referencia |
| `insumos.png` | Insumos referencia |
| `productos.png` | Productos referencia |
| `*-fixed.png` | Capturas de sesiones anteriores |

---

## Recomendación

**Detener avance hacia Stage 3** hasta resolver los bugs críticos C-1 y C-2. El orden de prioridad sugerido es:

1. **Depurar mecanismo de apertura de overlays** (C-1, C-2) — problema arquitectónico compartido
2. **Corregir ancho del sidebar** (H-1) — ajustar `root` a `16px` o usar `w-[240px]` en vez de `w-60`
3. **Reparar deep-links del Dashboard** (H-2)
4. **Corregir encoding en CategoriaPills** (M-1)
5. **Centralizar formato de moneda** (M-2, M-3)
6. **Completar DIP, editorMode y migración CSS** — deuda técnica del plan original
