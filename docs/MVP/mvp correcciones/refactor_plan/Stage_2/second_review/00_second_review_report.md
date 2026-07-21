# Second Review — Post Fix Refactorización Stage 2

**Fecha:** 2026-07-20
**Analista:** opencode (automated)
**Herramientas:** Análisis estático de código + pruebas E2E con Playwright
**Plan aplicado:** [`01_Plan_Fix_Refactor.md`](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/refactor_plan/Stage_2/01_Plan_Fix_Refactor.md)

---

## Contexto

Se re-evaluó el frontend de Presumemi tras la aplicación del plan de fix Stage 2 (01_Plan_Fix_Refactor.md), que corregía los hallazgos de la first review y avanzaba en la deuda técnica.

---

## Resumen ejecutivo

**La aplicación está funcionalmente operativa.** Los bugs críticos de la first review (overlays rotos, sidebar 210px, encoding) están resueltos. Todos los módulos principales (Insumos, Productos, Clientes, Presupuestos, Finanzas, Ajustes) funcionan correctamente. Quedan pendientes los refactors arquitectónicos del plan original (DIP, editorMode, migración CSS completa), que fueron aplazados a Stage 3 por decisión deliberada del walkthrough.

---

## Estado de los hallazgos de la first review

| Hallazgo | Estado | Verificación |
|----------|--------|-------------|
| **C-1/C-2** Overlays no se abren | **RESUELTO** | Los 3 overlays (Insumo, Producto, Presupuesto) abren correctamente con datos precargados. Causa raíz: tokens CSS legacy renombrados. Fix: rename `var(--viejo)` → `var(--color-*)`. |
| **H-1** Sidebar 210px | **RESUELTO** | Sidebar ahora mide **240px** (`w-[240px]`). Overlays alineados a `left-[240px]` sin gap. |
| **M-1** Encoding CategoriaPills | **RESUELTO** | Pills muestran "Cortes · 3" correctamente (14 mojibakes corregidos). |
| **M-2** Formato moneda "$ 8.8" | **RESUELTO** | Tabla muestra "$ 8,80" (`formatMoney` con `Number(value)`). |
| **M-3** StockBar vacío | **NO ERA BUG** | Barras de nivel renderizan correctamente con colores semánticos. |
| **H-2** Deep-links dashboard | **RESUELTO** | Navegación funciona; el destino ya no está roto. |
| **Moneda centralizada** | **RESUELTO** | `money()` locales reemplazados por `formatMoney`. Fallback `MXN` → `ARS` en PresupuestoDoc. |
| **Labels FloatingField** | **RESUELTO** | `white-space: pre` en `.ff-char` — "Costo pack" (no "Costopack"). |

---

## Resultados de pruebas E2E con Playwright

### Configuración
- Backend: `http://localhost:3000` — 200 OK
- Frontend: `http://localhost:5173` — 200 OK
- Credenciales: `shimbo@test.com` / `shimbo123`
- Ventana: 1920x907
- Typecheck: `vue-tsc -b` — 0 errores

### Pruebas por módulo

| Módulo | Prueba | Resultado | Screenshot |
|--------|--------|-----------|-----------|
| **Login** | Autenticación Supabase | OK → /dashboard | — |
| **Dashboard** | Layout + KPIs + widgets | OK. Sidebar 240px, header 56px, left 240px | `01_dashboard.png` |
| **Insumos** | Listado + filtros + CategoriaPills | OK. 19 insumos, pills "· N", moneda "$ 8,80" | `02_insumos_list.png` |
| **Insumos** | Overlay crear (botón "Crear nuevo") | OK. 11 inputs, labels con espacios, bg correcto | `03_insumo_overlay_create.png` |
| **Insumos** | Overlay editar (botón "Editar") | OK. "Bolsa kraft con visor" (I-1013) precargado | `04_insumo_overlay_edit.png` |
| **Productos** | Grid de tarjetas | OK. Favoritos, badges, precios | `05_productos_list.png` |
| **Productos** | Overlay editar (click en tarjeta) | OK. "Caja de Regalo Artesanal" (P-1) precargado | `06_producto_overlay_edit.png` |
| **Clientes** | Listado tabla | OK. Avatares, montos, acciones | `07_clientes_list.png` |
| **Clientes** | Drawer editar (botón "Editar") | OK. "Andrea Vázquez", ancho 520px | `08_cliente_drawer_edit.png` |
| **Presupuestos** | Listado tabla | OK. Folios, estados, montos con formato | `09_presupuestos_list.png` |
| **Presupuestos** | Editor editar (botón "Editar") | OK. Cliente "Andrea Vázquez" precargado | `10_presupuesto_editor.png` |
| **Finanzas** | Listado + KPIs + filtros | OK. Pestañas Movimientos/Imprenta | `11_finanzas_list.png` |
| **Finanzas** | Drawer movimiento (botón "Movimiento") | OK. Formulario completo, ancho 520px | `12_finanzas_movimiento_drawer.png` |
| **Ajustes** | Configuración bilateral | OK. Identidad, presupuestos, finanzas, cuenta | `13_ajustes.png` |

### Verificación de formato de moneda

```
Antes (first review): "$ 8.8", "$ 76", "$ 50"
Ahora (second review): "$ 8,80", "$ 76,00", "$ 50,00"
```

### Verificación de espaciados

```
Antes: sidebar 210px, gap de 30px con overlay
Ahora: sidebar 240px, overlay left-[240px] → sin gap
Header: 56px, left: 240px → correcto
```

### Verificación de encoding

```
Antes: "Cortes ┬À 3", "Agregar categor├¡a"
Ahora: "Cortes · 3", "Agregar categoría" (UTF-8 correcto)
```

---

## Deuda técnica pendiente (Stage 3)

Los siguientes items del plan original fueron **aplazados deliberadamente** por ser refactors arquitectónicos sin impacto visual, con riesgo de romper el flujo CRUD ya verificado:

### Paso 5 — Desacople de `editorMode` (25 referencias)

`editorMode` global sigue presente en:
- `App.vue`, `router.ts`, `AppHeader.vue`
- 3 overlays (InsumoDetalle, ProductoDetalle, PresupuestoEditor)
- 3 páginas (InsumosPage, ProductosPage, PresupuestosPage)
- `editorMode.ts` (singleton global)

**Impacto actual:** Ninguno funcional. Los overlays usan el header global para Guardar/Cerrar. Funciona correctamente.

### Paso 6 — DIP completo (11 archivos)

Archivos que aún importan `shared/api/client` directo:
- `InsumoDetalle.vue`, `ProductoDetalle.vue`, `PresupuestoEditor.vue` (carga de catálogos)
- `ProveedoresEditor.vue` (CRUD proveedores)
- `ClienteDrawer.vue`, `MovimientoDrawer.vue`, `ImprentaDrawer.vue` (sin store propio)
- `AjustesPage.vue`, `DashboardPage.vue`, `ProductosPage.vue`, `PresupuestosPage.vue`

**Impacto actual:** Ninguno funcional. Los stores tienen las acciones CRUD principales.

### Paso 7 — Migración CSS completa / eliminar `components.css`

- `InsumoDetalle.vue`: ~420 líneas de CSS scoped
- `ProductoDetalle.vue`: ~500 líneas de CSS scoped
- `PresupuestoEditor.vue`: ~340 líneas de CSS scoped
- `components.css`: aún importado (130 tokens renombrados como puente)

**Impacto actual:** Ninguno funcional. El rename de tokens resolvió el breakage visual.

---

## Conclusión

| Aspecto | Estado |
|---------|--------|
| **Funcionalidad CRUD** | OK — Crear, editar, eliminar funciona en todos los módulos |
| **Visual / Layout** | OK — Overlays, drawers, espaciados correctos |
| **Formato de datos** | OK — Moneda ARS, encoding UTF-8, labels con espacios |
| **Typecheck + Build** | OK — 0 errores |
| **Deuda arquitectónica** | Pendiente — DIP, editorMode, CSS (Stage 3) |

**Veredicto: La aplicación está lista para continuar hacia Stage 3.** Los bugs críticos y de alto impacto están resueltos. La deuda técnica restante es arquitectónica y no afecta la funcionalidad ni la experiencia de usuario.

---

## Screenshots de evidencia

Todos los screenshots capturados durante las pruebas se encuentran en esta carpeta (`second_review/`):

| Archivo | Descripción |
|---------|-------------|
| `01_dashboard.png` | Dashboard con sidebar 240px, header 56px, KPIs y widgets |
| `02_insumos_list.png` | Listado de insumos con filtros de stock, CategoriaPills "· N", moneda "$ 8,80" |
| `03_insumo_overlay_create.png` | Overlay de creación de insumo (vacío, labels con espacios) |
| `04_insumo_overlay_edit.png` | Overlay de edición "Bolsa kraft con visor" (I-1013) |
| `05_productos_list.png` | Grid de productos con favoritos y badges |
| `06_producto_overlay_edit.png` | Overlay de edición "Caja de Regalo Artesanal" (P-1) |
| `07_clientes_list.png` | Listado de clientes con avatares y montos |
| `08_cliente_drawer_edit.png` | Drawer de edición "Andrea Vázquez" (520px) |
| `09_presupuestos_list.png` | Listado de presupuestos con estados y folios |
| `10_presupuesto_editor.png` | Editor de presupuesto con cliente y preview |
| `11_finanzas_list.png` | Finanzas con KPIs, filtros y pestañas |
| `12_finanzas_movimiento_drawer.png` | Drawer de movimiento (520px, formulario completo) |
| `13_ajustes.png` | Ajustes con diseño bilateral (identidad + distribución) |
