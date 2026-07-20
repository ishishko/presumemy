# Walkthrough — Fix Refactorización Stage 2 (First Review)

> Registro del trabajo realizado sobre el plan [`01_Plan_Fix_Refactor.md`](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/refactor_plan/Stage_2/01_Plan_Fix_Refactor.md), que corrige los hallazgos del review [`first_review/00_first_review_report.md`](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/refactor_plan/Stage_2/first_review/00_first_review_report.md).
> Fecha: 2026-07-20 · Verificación: Playwright (headless + perfil persistente) + `vue-tsc -b` + `npm run build`.

---

## 1. Objetivo

Resolver los bugs reportados tras Stage 2 —con foco en el breakage visual de los overlays de edición/creación— y avanzar los ítems del plan (encoding, sidebar, moneda), verificando cada cambio contra el diseño de referencia.

---

## 2. Fase de triage (verificar el review antes de arreglar)

Antes de tocar código se reprodujo en navegador (sesión limpia autenticada) cada hallazgo del review. **Resultado: el review estaba parcialmente equivocado.** Clasificación real:

| Hallazgo del review | Veredicto tras triage |
|---|---|
| **C-1/C-2** "los overlays no abren" | **Falso como estaba descrito.** Los overlays **sí montan**; el problema es de **CSS** (se veían transparentes). El síntoma "no abre" del review vino de una corrida E2E automatizada contra un estado stale. |
| **M-2** "la tabla no usa `formatMoney`" | **Mal diagnosticado.** La tabla **sí** usa `formatMoney`; el bug real era otro (ver §4). |
| **M-3** "StockBar vacío" | **No era bug.** Renderiza barras coloreadas por nivel. |
| **H-2** deep-links dashboard | Navegación OK; caían en el overlay roto (= C-1/C-2). |
| **H-1** sidebar 210px · **M-1** encoding | **Confirmados reales.** |

**Decisión:** no escribir fixes especulativos sobre hallazgos que no reproducían; invertir en encontrar la causa raíz real del breakage visual.

---

## 3. Causa raíz del breakage visual (el hallazgo central)

La migración a `@theme` (Tailwind v4) de Stage 1/2 **renombró todos los design tokens**: `--surface → --color-surface`, `--border → --color-border`, `--r-lg → --radius-lg`, `--ink → --color-ink`, `--fs-12 → --text-12`, `--focus-ring → --shadow-focus-ring`, etc.

Pero quedaron dos deudas que juntas rompían la UI:
1. **`components.css`** (66 KB, aún importado en `main.css`) tenía **130 referencias** a los nombres **viejos**.
2. El `<style scoped>` de los 3 overlays + subcomponentes también usaba nombres viejos.
3. **`tokens.css`** (que definía los nombres viejos) **ya no se importa** → esos tokens quedaron **indefinidos** → todo lo que los usaba renderizaba **transparente / sin borde** ("se ve el fondo").

Verificado en navegador: `getPropertyValue('--surface')` = vacío, mientras `--color-surface` = `#FFFFFF`.

**Segunda capa:** los 6 subcomponentes que Stage 2 extrajo (`ProveedoresEditor`, `InsumoStockForm`, `BomEditor`, `ProductoMedidasForm`, `LinesSpreadsheet`, `EditorTotals`) **no tenían `<style>` propio**; su CSS quedó en el scoped del overlay padre. Como los estilos scoped de Vue solo alcanzan el *root* del hijo (no sus elementos internos), sus grids internos no se aplicaban (campos apilados en vez de en columnas).

---

## 4. Cambios aplicados

### 4.1 Restauración de tokens (fix de mayor impacto)
Rename mecánico y seguro (anclado por `)`, semánticamente idéntico) `var(--viejo)` → `var(--color-*/--radius-*/--text-*/--shadow-*)`:
- En los **6 archivos** de overlays/subcomponentes.
- En **`components.css`** (130 refs) — esto des-rompió de golpe `.field`, `.tgl` (toggle), `.segmented`, etc. usados en los overlays.

**Decisión clave:** se hizo el rename manteniendo `@theme` como **fuente única de verdad** (en vez de re-importar `tokens.css`, que habría resucitado la duplicación de valores que Stage 1 eliminó).

### 4.2 Migración a Tailwind del layout interno de subcomponentes
- **`InsumoStockForm.vue`**: grids de costo (`grid grid-cols-3`), stock (`grid-cols-[1fr_1fr_2fr]`), fila de costo unitario, badge de nivel y barra → utilidades Tailwind. Toggle y `FloatingField` se conservan.
- **`ProductoMedidasForm.vue`**: fila base/altura (`flex gap-2` + `flex-1 min-w-0`) y errores → Tailwind.

### 4.3 Bug extra: labels de `FloatingField`
Los labels colapsaban espacios ("Costo pack" → "Costopack") porque la animación "wave" envuelve cada carácter en un `<span>` y el espacio inline se colapsa. Fix: `white-space: pre` en `.ff-char` (aplica a **toda la app**).

### 4.4 Quick wins del plan
- **M-1** encoding `CategoriaPills.vue`: **14 secuencias mojibake** (`├│`, `├¡`, `├í`, `┬À`) corregidas a nivel de bytes con un script Node → pills muestran "Cortes · 3", tooltips "Máximo 12 categorías".
- **H-1** `AppSidebar.vue`: `w-60` (15rem × root 14px = 210px) → `w-[240px]` (medido 240px, sin gap contra los overlays).
- **M-2** `format.ts`: `formatMoney` ahora hace `Number(value)` antes de `toLocaleString` (los Decimal llegan como **string** y `String.prototype.toLocaleString` ignora las opciones → mostraba "$ 8.8"). Ahora "$ 8,80".

### 4.5 Paso 8 — centralización de moneda
- `money()`/`moneyAbs` locales de `ProductoDetalle`, `MovimientoDrawer`, `ImprentaDrawer` → delegan en `formatMoney`.
- `PresupuestoDoc.vue`: fallback `config?.moneda || 'MXN'` → `|| 'ARS'`.

---

## 5. Verificación

Se montó un loop de verificación visual con **Playwright headless + perfil persistente** (login manual una sola vez; la sesión queda guardada para las capturas siguientes). Con eso se comparó cada overlay contra la captura de referencia [`Stage_1/media/screenshot_insumo_detalle.png`](file:///d:/Desarrollando/presumemy/docs/MVP/mvp%20correcciones/refactor_plan/Stage_1/media/screenshot_insumo_detalle.png).

- **InsumoDetalle**: 3 columnas de costo, barra de stock teal, card de proveedores blanca, labels con espacios → **igual a la referencia**.
- **ProductoDetalle**: panel de precios, Receta·BOM, medidas base/altura lado a lado → **correcto**.
- **PresupuestoEditor**: form + preview (documento ARS) → **correcto**.
- **Listado insumos**: sidebar 240px, pills "· N", moneda "$ 8,80" → **correcto**.
- `vue-tsc -b` = 0 errores · `npm run build` = OK.

> Nota de herramientas: las capturas del panel embebido fallaban por timeout; se resolvió usando `resize_window` primero (y finalmente Playwright, a pedido del usuario, en ventana/proceso aparte).

---

## 6. Decisiones sobre alcance (qué NO se ejecutó y por qué)

Quedaron **sin ejecutar a propósito** dos refactors del plan, por ser **puramente arquitectónicos** (sin impacto visible), grandes, y con riesgo real de romper el flujo CRUD/guardado que quedó funcionando y verificado:

- **Paso 5 — desacople de `editorMode`** (6 archivos; toca el flujo de guardado del header).
- **Paso 6 — DIP** (sacar `shared/api` de la UI a los stores; 11 archivos + acciones nuevas de store; `ProveedoresEditor` está entrelazado con un `defineModel` del padre, lo que lo hace delicado).
- **Paso 7 — borrar `components.css`**: ya estaba marcado como **Stage 3** en el propio plan (§ Exclusiones).

**Recomendación registrada:** ejecutar Paso 5 y 6 **módulo por módulo, verificando el guardado real en el navegador después de cada uno**, en una sesión dedicada — no en batch.

---

## 7. Archivos tocados

| Archivo | Cambio |
|---|---|
| `web/src/assets/css/components.css` | Rename de 130 tokens muertos + `white-space: pre` en `.ff-char` |
| `web/src/modules/insumos/components/InsumoDetalle.vue` | Rename de tokens (scoped/inline) |
| `web/src/modules/insumos/components/InsumoStockForm.vue` | Migración a Tailwind del layout interno |
| `web/src/modules/insumos/components/ProveedoresEditor.vue` | Rename de tokens |
| `web/src/modules/productos/components/ProductoDetalle.vue` | Rename de tokens + `money()` → `formatMoney` |
| `web/src/modules/productos/components/ProductoMedidasForm.vue` | Migración a Tailwind del layout interno |
| `web/src/modules/productos/components/BomEditor.vue` | Rename de tokens |
| `web/src/modules/presupuestos/components/PresupuestoEditor.vue` | Rename de tokens |
| `web/src/modules/presupuestos/components/PresupuestoDoc.vue` | `money()` → `formatMoney` · fallback `MXN` → `ARS` |
| `web/src/modules/finanzas/components/MovimientoDrawer.vue` | `moneyAbs` → `formatMoney` |
| `web/src/modules/finanzas/components/ImprentaDrawer.vue` | `money()` → `formatMoney` |
| `web/src/shared/ui/CategoriaPills.vue` | Fix de encoding (14 mojibakes) |
| `web/src/shared/ui/FloatingField.vue` | (revisado; fix real quedó en `.ff-char` de components.css) |
| `web/src/shared/lib/format.ts` | `formatMoney` robusto ante strings (`Number(value)`) |
| `web/src/app/shell/AppSidebar.vue` | `w-60` → `w-[240px]` |
