# Índice y seguimiento — Refactor frontend `web/`

> Documento maestro de navegación. El plan global está en [`00_Plan_Refactor_Completo.md`](00_Plan_Refactor_Completo.md).
> Cada archivo a modificar/crear/borrar tiene su propio doc de acción. Se ejecutan **en orden bottom-up**.

## Cómo usar esta documentación

1. Seguir el orden del índice (los archivos pesados dependen de que los primitivos ya estén migrados).
2. Antes de tocar un archivo, abrir **solo su doc** (`Gx_yy_*.md`) y seguir el plan de acción paso a paso.
3. Tras terminar un archivo: correr `vue-tsc`, comparar visual con el prototipo, marcar el estado en la tabla de abajo.
4. Un archivo migrado = idealmente un commit lógico.

## Estado de cada archivo

Leyenda: ⬜ pendiente · 🟦 en curso · ✅ hecho · 🔎 verificado (typecheck + visual)

| Orden | Doc | Archivo | Tipo | Estado |
|---|---|---|---|---|
| — | `01_Indice_y_Seguimiento.md` | (este) | — | — |
| G0.1 | `G0_01_main-css.md` | `assets/css/main.css` | migrar | ⬜ |
| G0.2 | `G0_02_tokens-css.md` | `assets/css/tokens.css` | migrar→borrar | ⬜ |
| G1.1 | `G1_01_utils-format.md` | `utils/format.ts` | crear | ⬜ |
| G1.2 | `G1_02_useStockLevel.md` | `composables/useStockLevel.ts` | crear | ⬜ |
| G1.3 | `G1_03_stores-dip-del.md` | `stores/{insumos,productos,clientes,finanzas,presupuestos}.ts` | migrar | ⬜ |
| G2.1 | `G2_01_ToggleSwitch.md` | `components/ui/ToggleSwitch.vue` | migrar | ⬜ |
| G2.2 | `G2_02_PageHead.md` | `components/layout/PageHead.vue` | migrar | ⬜ |
| G2.3 | `G2_03_SegmentedControl.md` | `components/ui/SegmentedControl.vue` | migrar | ⬜ |
| G2.4 | `G2_04_FloatingField.md` | `components/ui/FloatingField.vue` | migrar | ⬜ |
| G2.5 | `G2_05_FloatingSelect.md` | `components/ui/FloatingSelect.vue` | migrar | ⬜ |
| G2.6 | `G2_06_ConfirmDialog.md` | `components/ui/ConfirmDialog.vue` | migrar | ⬜ |
| G2.7 | `G2_07_ToastContainer.md` | `components/ui/ToastContainer.vue` | migrar | ⬜ |
| G2.8 | `G2_08_DrawerShell.md` | `components/ui/DrawerShell.vue` | migrar | ⬜ |
| G3.1 | `G3_01_BaseButton.md` | `components/ui/BaseButton.vue` | crear | ⬜ |
| G3.2 | `G3_02_StatusBadge.md` | `components/ui/StatusBadge.vue` | crear | ⬜ |
| G3.3 | `G3_03_BaseCard.md` | `components/ui/BaseCard.vue` | crear | ⬜ |
| G3.4 | `G3_04_BaseKpi.md` | `components/ui/BaseKpi.vue` | crear | ⬜ |
| G3.5 | `G3_05_DataTable.md` | `components/ui/DataTable.vue` | crear | ⬜ |
| G3.6 | `G3_06_StockBar.md` | `components/ui/StockBar.vue` | crear | ⬜ |
| G3.7 | `G3_07_RowActions.md` | `components/ui/RowActions.vue` | crear | ⬜ |
| G3.8 | `G3_08_TheSidebar.md` | `components/layout/TheSidebar.vue` | migrar | ⬜ |
| G3.9 | `G3_09_AppHeader.md` | `components/layout/AppHeader.vue` | migrar | ⬜ |
| G3.10 | `G3_10_App.md` | `App.vue` | migrar | ⬜ |
| G4.1 | `G4_01_CategoriaPills.md` | `components/ui/CategoriaPills.vue` | migrar | ⬜ |
| G4.2 | `G4_02_CategoriaDeleteDialog.md` | `components/ui/CategoriaDeleteDialog.vue` | migrar | ⬜ |
| G4.3 | `G4_03_PresupuestoDoc.md` | `components/presupuestos/PresupuestoDoc.vue` | migrar | ⬜ |
| G5.1 | `G5_01_DashboardView.md` | `views/DashboardView.vue` | migrar | ⬜ |
| G5.2 | `G5_02_ClientesView.md` | `views/ClientesView.vue` | migrar | ⬜ |
| G5.3 | `G5_03_ProductosView.md` | `views/ProductosView.vue` | migrar | ⬜ |
| G5.4 | `G5_04_InsumosView.md` | `views/InsumosView.vue` | migrar (piloto) | ⬜ |
| G5.5 | `G5_05_PresupuestosView.md` | `views/PresupuestosView.vue` | migrar | ⬜ |
| G5.6 | `G5_06_FinanzasView.md` | `views/FinanzasView.vue` | migrar | ⬜ |
| G5.7 | `G5_07_LoginView.md` | `features/auth/LoginView.vue` | migrar | ⬜ |
| G5.8 | `G5_08_PublicPresupuestoView.md` | `features/public/PublicPresupuestoView.vue` | migrar | ⬜ |
| G5.9 | `G5_09_AjustesView.md` | `views/AjustesView.vue` | migrar | ⬜ |
| G6.1 | `G6_01_ClienteDrawer.md` | `components/drawers/ClienteDrawer.vue` | migrar | ⬜ |
| G6.2 | `G6_02_MovimientoDrawer.md` | `components/drawers/MovimientoDrawer.vue` | migrar | ⬜ |
| G6.3 | `G6_03_ImprentaDrawer.md` | `components/drawers/ImprentaDrawer.vue` | migrar | ⬜ |
| G6.4 | `G6_04_ProductoDetalle.md` | `components/overlays/ProductoDetalle.vue` | migrar | ⬜ |
| G6.5 | `G6_05_InsumoDetalle.md` | `components/overlays/InsumoDetalle.vue` | migrar | ⬜ |
| G6.6 | `G6_06_PresupuestoEditor.md` | `components/editors/PresupuestoEditor.vue` | migrar | ⬜ |
| G7.1 | `G7_01_Limpieza-Final.md` | `components.css`, `tokens.css`, `style.css` | borrar | ⬜ |

---

## Convenciones compartidas (referenciadas por todos los docs)

### C1 — Tokens en `@theme` (Tailwind v4)
Los tokens de `tokens.css` se definen en `@theme` dentro de `main.css`. Tailwind genera utilidades a partir del prefijo del token:

| Token actual (`var(--x)`) | Definición `@theme` | Utilidades generadas |
|---|---|---|
| `--violet-700` | `--color-violet-700` | `bg-violet-700`, `text-violet-700`, `border-violet-700` |
| `--teal-500` | `--color-teal-500` | `bg-teal-500`, `text-teal-500`, … |
| `--coral-500` | `--color-coral-500` | idem |
| `--ink`, `--ink-muted` | `--color-ink`, `--color-ink-muted` | `text-ink`, `text-ink-muted` |
| `--page-bg`, `--surface` | `--color-page-bg`, `--color-surface` | `bg-page-bg`, `bg-surface` |
| `--border`, `--border-strong` | `--color-border`, `--color-border-strong` | `border-border` |
| pasteles (`--lavender`, `--mint`, `--yellow`…) | `--color-*` | `bg-lavender`, etc. |
| `--r-sm/md/lg/xl/pill` | `--radius-sm/md/lg/xl/pill` | `rounded-md`, `rounded-lg`, `rounded-pill` |
| `--shadow-1/2/pop` | `--shadow-1/2/pop` | `shadow-1`, `shadow-2`, `shadow-pop` |
| `--font-sans` (Onest) | `--font-sans` | `font-sans` (default del body) |
| escala `--fs-12…48` | `--text-12…48` | `text-12`, `text-14`, … |

### C2 — Espaciado (grid 4px = escala default Tailwind)
No se crea escala custom. Equivalencias:
`--s-1`=4px→`1` · `--s-2`=8px→`2` · `--s-3`=12px→`3` · `--s-4`=16px→`4` · `--s-5`=20px→`5` · `--s-6`=24px→`6` · `--s-8`=32px→`8` · `--s-10`=40px→`10` · `--s-12`=48px→`12` · `--s-16`=64px→`16`.
Ej.: `padding: var(--s-6)` → `p-6`; `gap: var(--s-2)` → `gap-2`.

### C3 — Variantes con mapa de estrategia (OCP)
Nunca `if/else` ni concatenación de strings para variantes. Patrón:
```ts
const VARIANTS: Record<Variant, string> = {
  primary: 'bg-teal-500 text-white hover:brightness-94',
  secondary: 'bg-surface border border-border-strong text-ink',
  ghost: 'bg-transparent text-violet-700 hover:bg-violet-50',
  danger: 'bg-coral-500 text-white',
}
// uso: :class="VARIANTS[variant]"
```
Agregar variante = nueva entrada, sin tocar el render.

### C4 — DIP (acceso a datos)
Componentes y vistas **no importan `services/api`**. El store es el único que conoce el API. Las vistas llaman `store.fetch()/create()/update()/remove()`.

### C5 — Vue idiomático
`<script setup lang="ts">`, props tipadas con `defineProps<…>()`, `defineModel()` para v-model, `defineEmits<…>()`. Componentes presentacionales sin fetch propio. A11y existente (roles, aria, teclado) se conserva.

### C6 — Excepción de `<style scoped>`
Solo se conservan animaciones irreductibles: el "wave" del label flotante (`FloatingField`/`FloatingSelect`) y las transiciones `drawer`/`toast`/`confirm`. Todo lo demás pasa a utilidades.

### C7 — Verificación por archivo
- `cd web && npx vue-tsc -b` sin errores.
- `npm run dev` → comparar contra `docs/MVP/design-system/project/ui_kits/presumemi/index.html` (pixel-perfect).
- Si el archivo tiene test (`ConfirmDialog`), mantener API y que el test siga verde.
