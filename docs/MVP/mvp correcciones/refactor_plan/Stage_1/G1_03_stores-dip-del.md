# G1.3 — Stores: absorber `del()` (DIP) — doc de patrón

> **Ubicación (modular, rev.2):** cada store → `modules/<dominio>/store.ts`; `services/api.ts` → `shared/api/client.ts` (único que conoce `ofetch`). La UI del módulo no importa `shared/api`: pasa por `store.ts`/`api.ts` (C15).

| | |
|---|---|
| **Rutas destino** | `web/src/modules/{insumos,productos,clientes,finanzas,presupuestos}/store.ts` |
| **Grupo / orden** | G1 (datos/utils) · 3º |
| **LOC actuales** | insumos 71 · productos 71 · clientes 39 · presupuestos 39 · finanzas 86 |
| **Tipo** | migrar (cambio idéntico en los 5) |
| **Dependencias** | ninguna |
| **Consumidores** | las vistas correspondientes (G5) y overlays/drawers (G6) |

> **Por qué un solo doc:** el cambio es literalmente el mismo en los 5 stores (3 líneas). Documentarlo 5 veces sería ruido (DRY también en la doc). Se lista la subsección por store con su endpoint.

## Estado actual (smell DIP)
Hoy `remove(id)` en el store **solo filtra el array local**, y la llamada HTTP real la hace la **vista** importando `del` de `services/api`. Ej. `stores/insumos.ts` (líneas 30-32):
```ts
function remove(id: number) {
  data.value = data.value.filter(i => i.id !== id)
}
```
Y `InsumosView.vue` (líneas 104-116):
```ts
import { del } from '@/services/api'
...
await del('/insumos', i.id)   // ← la VISTA habla con el API
store.remove(i.id)
```
Esto acopla la capa de presentación a la infraestructura (viola **DIP**: la vista no debería conocer `services/api`).

## Objetivo (DIP)
El store es el **único** que conoce `shared/api`. La vista llama `await store.remove(id)` y nada más. Mismo criterio para cualquier otra operación CRUD que hoy llame al API desde una vista (auditar al migrar cada vista de G5).

## Plan de acción (aplicar a cada store)
1. **(DIP)** Importar `del`/`delWithBody` en el store (ya importan `get/post/put`).
2. **(DIP)** Convertir `remove` en `async`: `await del('<endpoint>', id)` y luego filtrar el array local. **(C10, rev.1 — convención de errores)** El store **re-lanza** el error (no lo traga); la **vista** hace `try/catch` + `toast` (decide la UX). Este patrón ya es uniforme de facto en las 6 vistas. **No** se introduce `useAsyncAction` todavía (YAGNI / Regla de Tres); reconsiderar solo si tras el piloto la repetición molesta.
3. **(consumo)** En la vista (fase G5): quitar `import … from '@/shared/api'`, reemplazar `await del(...); store.remove(id)` por `await store.remove(id)`.

## Antes → Después
```ts
// Después (store en modules/<dominio>/store.ts):
import { get, post, put, del, delWithBody } from '@/shared/api'
async function remove(id: number) {
  await del('/insumos', id)
  data.value = data.value.filter(i => i.id !== id)
}
```

## Subsecciones por store
| Store destino | Endpoint `del` | Notas |
|---|---|---|
| `modules/insumos/store.ts` | `/insumos` | ya tiene `delWithBody` para categorías; agregar `del` para el insumo |
| `modules/productos/store.ts` | `/productos` | idéntico a insumos |
| `modules/clientes/store.ts` | `/clientes` | revisar firma actual de `remove` (39 LOC) |
| `modules/presupuestos/store.ts` | `/presupuestos` | además existe `patch` para FSM de estado — no tocar |
| `modules/finanzas/store.ts` | `/transacciones`, `/ordenes-imprenta` | tiene 2 entidades; absorber el `del` de cada una |

## Criterios de aceptación
- `vue-tsc` ok.
- Ninguna **vista** importa `del`/`delWithBody` tras migrar G5 (barrido `grep "shared/api" web/src/modules`).
- Borrado sigue funcionando end-to-end (probar en `npm run dev`).

## Riesgos / notas
- `modules/finanzas/store.ts` maneja dos entidades; revisar que el `remove` distinga cuál.
- Mantener `upsert`/`fetch` como están. El error de red debe propagarse a la vista (no tragarlo en el store) para conservar los toasts actuales.
