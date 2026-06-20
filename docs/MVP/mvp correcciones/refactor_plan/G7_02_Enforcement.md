# G7.2 — Enforcement de la arquitectura modular

> Cierra el refactor garantizando que la regla de dependencia y los barrels no dependan de disciplina. Arquitectura en `00_Arquitectura_Modular.md`.

| | |
|---|---|
| **Ubicación** | `web/` (config: `eslint`, CI) |
| **Grupo / orden** | G7 (limpieza) · 2º (tras G7.1) |
| **Tipo** | configurar |
| **Dependencias** | toda la relocalización modular completa |
| **Consumidores** | CI / DX |

## Objetivo
Que un import "hacia arriba", lateral por path profundo, o un acceso a `shared/api` desde la UI de un módulo, **falle en lint/CI**, no en review.

## Plan de acción paso a paso
1. **`eslint-plugin-boundaries`** (o `import/no-restricted-paths`): definir los elementos `app`, `shared`, `modules/*` y las reglas:
   - `app` puede importar `modules` y `shared`.
   - `modules/<x>` puede importar `shared` y **otros `modules/<y>` solo por su barrel** (`@/modules/<y>` exacto; prohibir `@/modules/<y>/**`).
   - `shared` **no** importa `modules` ni `app`.
   - Prohibir importar `@/shared/api` (cliente `ofetch`) desde archivos de UI de módulo (`*.vue`, `*Page.vue`); el acceso a datos pasa por `store.ts`/`api.ts`.
2. **`no-restricted-imports`** complementario: bloquear paths profundos cross-module (`@/modules/*/store`, `@/modules/*/components/*` desde otro módulo).
3. **Barrido manual** (parte de G7): buscar imports profundos huérfanos y módulos sin `index.ts`.
   - `grep -rE "from '@/modules/[a-z]+/" web/src/modules` → revisar que ningún import cross-module use path profundo.
   - Confirmar que cada `modules/<x>/` tiene `index.ts`.
4. **CI:** correr `eslint` + `vue-tsc -b` + `npm run test` + `npm run build` en el pipeline.
5. **Nota:** **Steiger no se usa** (es específico de capas FSD; esta arquitectura es modular por dominio).

## Criterios de aceptación
- `eslint` falla ante: import lateral por path profundo, `shared`→`modules`, UI de módulo → `shared/api`.
- Barrido sin imports profundos cross-module huérfanos; todos los módulos con barrel.
- CI verde (`eslint` + `vue-tsc` + tests + build).

## Riesgos / notas
- Fijar versiones de `eslint-plugin-boundaries` en `package.json` (ecosistema cambiante).
- La regla "UI no importa `shared/api`" es la que materializa DIP; ajustarla si algún caso legítimo aparece (debería ser ninguno: todo dato pasa por `store`/`api` del módulo).
- Extiende el "barrido de clases huérfanas" de G7.1 con el de **imports profundos huérfanos**.
