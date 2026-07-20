# Análisis de la Refactorización Stage 2

## Typecheck: OK (0 errores)

---

## Tareas completadas correctamente

| Paso | Estado | Detalle |
|------|--------|---------|
| 1 - Categorías | **OK** | `CategoriaPills.vue` y `CategoriaDeleteDialog.vue` restaurados en `shared/ui/`, con `allLabel` generalizado |
| 2 - Moneda ARS | **OK** | `format.ts` usa `es-AR` con sufijo `ARS` opcional |
| 6 - DIP (stores) | **Parcial** | Stores de insumos/productos/presupuestos tienen `create`/`update`/`remove`. Los overlays principales los usan para guardar |
| 8-10 - Subcomponentes | **OK** | Los 6 subcomponentes existen y están bien implementados |
| Drawers layout | **OK** | Los 3 drawers usan Tailwind v4 para layout, conservando solo transiciones en scoped (excepción explícita del plan) |
| Overlays posición | **OK** | Los 3 overlays usan `fixed top-[56px] right-0 bottom-0 left-[240px] z-30` con Tailwind |
| Footer overlays | **OK** | Sin botones guardar/cancelar duplicados; solo "Eliminar" y acciones de exportación |

---

## Problemas detectados (incumplimientos del plan)

### 1. DIP incompleto — 11 archivos aún importan `shared/api/client` directo:
- `InsumoDetalle.vue:4` — `get` para cargar categorías/proveedores
- `ProductoDetalle.vue:5` — `get` para cargar categorías/insumos
- `PresupuestoEditor.vue:4` — `get` para cargar clientes/productos/config
- `ProveedoresEditor.vue:4` — `post, del` para CRUD de proveedores (violación directa en subcomponente nuevo)
- `ClienteDrawer.vue:4`, `MovimientoDrawer.vue:4`, `ImprentaDrawer.vue:4` — sin store propio

### 2. `editorMode` NO desacoplado (Plan §4B):
- `AppHeader.vue:92-111` aún renderiza botones Save/X en modo editor
- Los 3 overlays aún emiten `update:header` con modo editor
- `editorDirty` de `@/shared/lib/editorMode` sigue activo en InsumoDetalle, ProductoDetalle y PresupuestoEditor
- `PresupuestoEditor.vue:542` aún usa `<Teleport to="#editor-header-status">`

### 3. CSS scoped masivo NO migrado a Tailwind v4:
- `InsumoDetalle.vue`: ~420 líneas de CSS scoped (líneas 532-952)
- `ProductoDetalle.vue`: ~500 líneas de CSS scoped (líneas 680-1184)
- `PresupuestoEditor.vue`: ~340 líneas de CSS scoped (líneas 801-1139)

### 4. Moneda no centralizada en algunos componentes:
- `ProductoDetalle.vue:126-128` — `money()` local con `toLocaleString` manual
- `MovimientoDrawer.vue:72` — `moneyAbs` con formato manual
- `ImprentaDrawer.vue:48-50` — `money()` local

### 5. CategoriaPills.vue tiene caracteres rotos (encoding issue en comentarios, ej. líneas 126, 185, 215).

### 6. `ProductoDetalle.vue` aún tiene lógica de drag&drop de imágenes (líneas 334-405) que no fue delegada a un subcomponente.

---

## Resumen

La **componentización** (extracción de subcomponentes) y el **posicionamiento** de overlays/drawers están bien resueltos. Sin embargo, los objetivos de **Tailwind v4 puro** (eliminación de CSS scoped), **DIP completo** (UI no conoce la API) y **desacople de editorMode** siguen pendientes. El frontend compila y debería funcionar, pero la deuda técnica identificada en el plan §4A/4B/4C y §1 no fue saldada.

---

## Pruebas funcionales con Playwright (2026-07-14)

### Configuración
- Backend: `http://localhost:3000` — 200 OK
- Frontend: `http://localhost:5173` — 200 OK
- Credenciales: `shimbo@test.com` / `shimbo123`
- Ventana: 1920x907

### Resultados por módulo

#### Login
- **Estado**: OK
- Login exitoso con redirección a `/dashboard`

#### Dashboard
- **Estado**: OK (visual)
- Sidebar visible con navegación completa
- Header con buscador global y notificaciones
- KPIs renderizados (Ingresos, Por cobrar)
- 4 widgets funcionales: Próximos a entregar, Presupuestos recientes, Capacidad de fabricación, Insumos a reponer
- **Bug**: Deep-links desde widgets no navegan (click en insumo/presupuesto no redirige)

#### Espaciados y layout
- **Header**: height=56px (correcto)
- **Sidebar**: width=**210px** (INCORRECTO — debería ser 240px)
  - Causa: `root: 14px` + `w-60` (15rem) = 210px en vez de 240px
  - Los overlays usan `left-[240px]` creando desalineación de 30px
- **Main content**: left=210px, top=56px

#### Módulo Insumos
- **Estado**: CRITICAL BUG
- Listado renderiza correctamente (19 insumos, filtros de stock, CategoriaPills)
- **Bug crítico**: Overlay `InsumoDetalle` NO se abre ni con "Crear nuevo" ni con "Editar"
  - Causa inicial: import faltante de `Trash2` en `InsumoDetalle.vue:3` (corregido durante pruebas)
  - Tras corrección y reload: overlay sigue sin abrirse
  - No hay errores de Vue en consola tras la corrección
- **Encoding roto**: CategoriaPills muestra "┬À" en vez de "·" (ej: "Cortes ┬À 3")
- **Moneda**: Costos en tabla usan formato incorrecto ("$ 8.8" en vez de "$ 8,80")
- **Columna Nivel**: StockBar no renderiza badges de nivel

#### Módulo Productos
- **Estado**: CRITICAL BUG
- Grid de productos renderiza correctamente
- **Bug crítico**: Overlay `ProductoDetalle` NO se abre (mismo comportamiento que Insumos)
- Formato de moneda en tarjetas usa `formatMoney()` correctamente

#### Módulos no probados en profundidad
- Clientes, Presupuestos, Finanzas, Ajustes: no se probaron por los bugs críticos anteriores

### Bugs críticos encontrados

| # | Severidad | Módulo | Descripción |
|---|-----------|--------|-------------|
| 1 | **CRITICAL** | Insumos | Overlay InsumoDetalle no se abre (ni crear ni editar) |
| 2 | **CRITICAL** | Productos | Overlay ProductoDetalle no se abre (ni crear ni editar) |
| 3 | **HIGH** | Layout | Sidebar 210px vs 240px esperado — desalineación con overlays |
| 4 | **HIGH** | Dashboard | Deep-links desde widgets no navegan |
| 5 | **MEDIUM** | Insumos | Encoding roto en CategoriaPills ("┬À" en vez de "·") |
| 6 | **MEDIUM** | Insumos | Formato de moneda no usa `formatMoney()` en tabla |
| 7 | **MEDIUM** | Insumos | StockBar no muestra badges de nivel en tabla |
| 8 | **LOW** | InsumoDetalle | Import faltante de `Trash2` (corregido durante pruebas) |

### Conclusión de pruebas

**La refactorización Stage 2 NO es funcionalmente estable.** Los bugs críticos #1 y #2 impiden la operación básica del ERP (crear/editar insumos y productos). Se requiere intervención inmediata antes de continuar con Stage 3.
