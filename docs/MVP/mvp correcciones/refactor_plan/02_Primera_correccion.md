# Análisis del plan de refactor — SOLID + Vue.js

## Veredicto general

El plan es **sólido y bien estructurado**. La estrategia bottom-up, el enfoque de piloto con InsumosView, y la documentación archivo por archivo son decisiones correctas. Hay algunos puntos donde los principios SOLID se aplican excelentemente, y otros donde hay lagunas o decisiones que necesitan refinarse antes de implementar.

---

## SOLID — Principio por principio

### S — Single Responsibility (SRP): Bien aplicado, con una inconsistencia

El plan identifica correctamente los "God components" y propone extracción consistente:

- Vistas → orquestadores delgados (G5)
- Reglas de negocio → composables/utils puros (`useStockLevel`, `usePresupuestoCalc`, `useProductoPricing`, `useInsumoCosteo`)
- Subcomponentes pesados → archivos propios (`ProveedoresEditor`, `BomEditor`, `LinesSpreadsheet`, `ContactosEditor`)

**Inconsistencia:** `useStockLevel` está clasificado como `composables/` pero el doc G1.2 reconoce explícitamente que es un **util puro** sin reactividad. Debería vivir en `utils/stock.ts` para no confundir el contrato (un composable implica reactividad en Vue). La excepción es si se planea exponer `computed` a futuro, pero el plan dice que no.

**Recomendación:** Mover `useStockLevel` → `utils/stock.ts`. El nombre `use*` en Vue implica reactividad; si no la hay, genera expectativa incorrecta.

### O — Open-Closed (OCP): Excelente — el mapa de estrategia es la decisión arquitectónica más fuerte del plan

El patrón `Record<Variant, string>` para variantes (C3 del índice) se aplica consistentemente en:
- `BaseButton` (G3.1) — variantes de botón
- `StatusBadge` (G3.2) — tonos de estado
- `ToastContainer` (G2.7) — iconos por tipo
- `SegmentedControl` (G2.3) — activo/inactivo
- `StockBar` (G3.6) — color por nivel

Agregar variante = nueva entrada en el mapa, cero cambios en el render. Esto es OCP puro y está bien documentado.

**Punto a mejorar:** `DataTable` (G3.5) menciona dos enfoques (A: slots con columns, B: headless) sin decidir. La opción A es correcta, pero el doc debería comprometerse en vez de dejar la decisión abierta, porque G5.4 (piloto) depende de ella.

### L — Liskov Substitution: No aplica directamente

No hay herencia de componentes en Vue 3 con Composition API. El plan mantiene consistencia de API entre variantes (todas las variantes de `BaseButton` aceptan las mismas props), lo cual es el equivalente práctico de LSP en este contexto. Sin observaciones.

### I — Interface Segregation (ISP): Muy bien aplicado

Cada componente recibe lo mínimo:
- `StockBar` recibe `{ stock, minimo }`, no el `Insumo` entero
- `StatusBadge` recibe `{ label, tone }`, no un objeto de dominio
- `BaseKpi` recibe strings formateados, no objetos crudos (el plan lo explicita: "la vista formatea y pasa strings")
- `DataTable` es genérico — no sabe qué es un `Insumo`

Esto es ISP bien entendido: los componentes presentacionales no conocen el dominio.

### D — Dependency Inversion (DIP): El cambio más importante del plan, bien resuelto

La regla "vistas no importan `services/api`" se aplica sistemáticamente:
- Stores absorben `del()` (G1.3)
- Cada doc de G5/G6 lista explícitamente qué imports quitar y a qué store delegar
- `api.ts` queda como único adapter de `ofetch`

**Lagunas:**
1. **PublicPresupuestoView** (G5.8): el `ofetch` directo se marca como "opcional extraer a `services/public.ts`". Debería ser **obligatorio** — la regla DIP no debería tener excepciones ad-hoc. Si el argumento es performance para Puppeteer, el service puede ser igual de ligero.
2. **Error handling en stores**: G1.3 dice "re-lanzar para que la vista muestre el toast" pero no define un patrón uniforme. ¿Qué pasa si dos vistas manejan el error distinto? ¿Se necesita un composable `useAsyncAction`? El plan debería definir la convención.
3. **Store de ajustes** (G5.9): el plan dice "reconciliar con el store de ajustes mencionado en memoria" — esto es una dependencia no resuelta que bloquea G5.9.

---

## Vue.js Best Practices

### Composition API + `<script setup>`: Correcto
- `defineModel()` donde aplica (ToggleSwitch, SegmentedControl)
- Props tipadas con `defineProps<>()`
- `defineEmits<>()` explícito

### Accesibilidad: Excelente — se conserva como requisito no negociable

El plan protege explícitamente:
- `role="switch"` + teclado en ToggleSwitch (G2.1)
- Roving tabindex + flechas en SegmentedControl (G2.3)
- `aria-invalid`/`aria-describedby` en FloatingField (G2.4)
- Focus-trap en PresupuestoEditor (G6.6)

Esto es madurez arquitectónica: no sacrificar a11y por conveniencia de migración.

### Testing: Bien pensado pero incompleto

Se proponen tests para `formatMoney`, `useStockLevel`, `usePresupuestoCalc`, `useProductoPricing`, `useInsumoCosteo`. Se protege el test existente de `ConfirmDialog`.

**Faltante:** No se mencionan tests para las utilidades de FSM (`presupuestoEstado.ts` — `getAvailableTransitions` es lógica de negocio crítica con 6 estados y transiciones complejas). Debería agregarse.

### Teleport coupling: Deuda arquitectónica no resuelta

El Teleport del badge de `PresupuestoEditor` a `#editor-header-status` en `AppHeader` crea un acoplamiento oculto entre G6.6 y G3.9. Si alguien cambia el id o lo quita, se rompe el editor silenciosamente. El plan debería documentar este contrato explícitamente (quizás como una constante compartida o un provide/inject).

---

## Problemas transversales detectados

| # | Problema | Grupos afectados | Severidad |
|---|---|---|---|
| 1 | **`FilterChips` sin dueño claro** — G5.3 dice "se crea aquí", G5.4 lo necesita, G5.6 lo consume. No hay doc propio. | G5.3, G5.4, G5.6 | Media |
| 2 | **`OverlayShell` como "posible"** — G6.4 y G6.5 dicen "evaluar". Con 2 overlays fullscreen, la extracción debería ser decidida. | G6.4, G6.5 | Media |
| 3 | **`useFieldState` compartido** — G2.4 dice "solo si reduce duplicación", G2.5 depende de él. La decisión debería tomarse en G2.4, no dejarse abierta. | G2.4, G2.5 | Baja |
| 4 | **Tipos exportados desde SFCs** — `PresupuestoDocData`/`PresupuestoDocLine` se exportan desde `PresupuestoDoc.vue`. Deberían vivir en `types/`. | G4.3 | Baja |
| 5 | **Dark mode sin resolución** — G5.7 lo menciona pero no decide. Si LoginView es la única pantalla dark, es deuda visible. | G5.7 | Baja |
| 6 | **Catálogos duplicados no auditados** — Se identifican `statusTones` y `tipoMovs`, pero no hay barrido general de catálogos duplicados en todo el proyecto. | G5, G6 | Media |
| 7 | **PDF/Puppeteer checkpoint** — Varios docs mencionan el riesgo. Falta un checkpoint explícito entre G4.3 y G5.8 antes de avanzar. | G4.3, G5.8 | Alta |

---

## Fortalezas destacables del plan

1. **Orden bottom-up con justificación** — cada grupo depende del anterior, los primitivos existen antes de tocar vistas.
2. **Piloto end-to-end** (InsumosView) — valida el enfoque antes de propagar.
3. **Coexistencia temporal de `components.css`** — la app nunca se rompe durante la migración.
4. **Checklist universal** (5 puntos) — repetido en cada archivo, no se olvida ningún criterio.
5. **YAGNI/Regla de Tres explícitos** — "no se fuerzan patrones ni abstracciones prematuras".
6. **Riesgos documentados por archivo** — cada doc termina con riesgos específicos.
7. **Excepción C6 honesta** — reconoce que las animaciones irreductibles merecen `<style scoped>`, sin dogmatismo.
8. **Verificación multi-capa** — typecheck + build + tests + visual + PDF.

---

## Recomendaciones concretas antes de implementar

1. **Crear doc propio para `FilterChips`** (entre G3 y G4, o como G3.11). Es un primitivo reutilizable, no debería nacer dentro de una vista.
2. **Decidir `OverlayShell` como creación** (G3.12 o similar), no como "posible". Dos overlays lo justifican.
3. **Mover `useStockLevel` → `utils/stock.ts`** y renombrar a `getNivel`/`NIVEL_META` sin el prefijo `use`.
4. **Agregar test para `presupuestoEstado.ts`** — la FSM tiene 6 estados y transiciones no triviales.
5. **Hacer obligatorio el service público** en G5.8 (`services/public.ts`).
6. **Definir patrón de error handling** en stores (G1.3) — al menos documentar la convención.
7. **Resolver el store de ajustes** antes de planificar G5.9.
8. **Agregar checkpoint PDF** explícito entre G4.3 y G5.8.
