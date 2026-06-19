# G1.3 — Stores: absorber `del()` (DIP) — doc de patrón

| | |
|---|---|
| **Rutas** | `web/src/stores/{insumos,productos,clientes,finanzas,presupuestos}.ts` |
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
El store es el **único** que conoce `services/api`. La vista llama `await store.remove(id)` y nada más. Mismo criterio para cualquier otra operación CRUD que hoy llame al API desde una vista (auditar al migrar cada vista de G5).

## Plan de acción (aplicar a cada store)
1. **(DIP)** Importar `del`/`delWithBody` en el store (ya importan `get/post/put`).
2. **(DIP)** Convertir `remove` en `async`: `await del('<endpoint>', id)` y luego filtrar el array local. Manejo de error: re-lanzar para que la vista muestre el toast (la vista decide UX, el store hace la operación).
3. **(consumo)** En la vista (fase G5): quitar `import … from '@/services/api'`, reemplazar `await del(...); store.remove(id)` por `await store.remove(id)`.

## Antes → Después
```ts
// Después (store):
import { get, post, put, del, delWithBody } from '@/services/api'
async function remove(id: number) {
  await del('/insumos', id)
  data.value = data.value.filter(i => i.id !== id)
}
```

## Subsecciones por store
| Store | Endpoint `del` | Notas |
|---|---|---|
| `insumos.ts` | `/insumos` | ya tiene `delWithBody` para categorías; agregar `del` para el insumo |
| `productos.ts` | `/productos` | idéntico a insumos |
| `clientes.ts` | `/clientes` | revisar firma actual de `remove` (39 LOC) |
| `presupuestos.ts` | `/presupuestos` | además existe `patch` para FSM de estado — no tocar |
| `finanzas.ts` | `/transacciones`, `/ordenes-imprenta` | tiene 2 entidades; absorber el `del` de cada una |

## Criterios de aceptación
- `vue-tsc` ok.
- Ninguna **vista** importa `del`/`delWithBody` tras migrar G5 (barrido `grep "services/api" web/src/views`).
- Borrado sigue funcionando end-to-end (probar en `npm run dev`).

## Riesgos / notas
- `finanzas.ts` maneja dos entidades; revisar que el `remove` distinga cuál.
- Mantener `upsert`/`fetch` como están. El error de red debe propagarse a la vista (no tragarlo en el store) para conservar los toasts actuales.
