# G5.9 — `modules/ajustes/AjustesPage.vue`

> **Ubicación (modular, rev.2):** destino `modules/ajustes/AjustesPage.vue` · `SettingsBlock` → `modules/ajustes/components` · store nuevo → `modules/ajustes/store.ts`.

| | |
|---|---|
| **Ruta destino** | `web/src/modules/ajustes/AjustesPage.vue` |
| **Grupo / orden** | G5 (vistas) · 9º (la más grande del grupo) |
| **LOC actuales** | 702 (≈390 de `<style scoped>`) |
| **Tipo** | migrar (+ extracción de subcomponentes) |
| **Dependencias** | G0; G2.1 (`ToggleSwitch`), G2.4/2.5 (`FloatingField`/`FloatingSelect`), G3.1 (`BaseButton`), nuevo `SettingsBlock`, **`modules/ajustes/store.ts` (crear — verificado: no existe)** |
| **Consumidores** | ruta `/ajustes` |

## Estado actual
4 bloques (Inicio, Presupuestos, Finanzas/socios, Cuenta) en 2 columnas, con dirty-tracking por bloque. Smells:
- `import { get, put }` directo (**DIP**) — la vista hace fetch/save al API en vez de usar un store. (La memoria del proyecto menciona un store de ajustes; aquí **no se usa** — reconciliar.)
- Dirty manual (`configDirty`/`sociosDirty` refs) en vez de `useDirty` (que ya existe).
- `:style` inline en los 3 botones guardar (opacidad/pointer-events según dirty) — mismo smell que `AppHeader`.
- **Segundo switch reinventado** `.aj-switch` (≈30 líneas scoped) que **duplica `ToggleSwitch`** (G2.1) — usado en la tabla de socios.
- Shell de bloque `.aj-block`/`head`/`body`/`foot`/`dirty-chip` repetido 4× → candidato a componente.
- Tabla de socios con inputs editables (`.prov-input`); colores `#1f5a3e` crudos.
- `<style scoped>` enorme (~390 líneas) con varias animaciones (`aj-grow`).

## Objetivo
Vista compuesta por bloques reutilizables, datos vía store (DIP), dirty con `useDirty`, switches con `ToggleSwitch`, sin `:style` inline, scoped reducido a animaciones.

## Plan de acción paso a paso
1. **(DIP — rev.1: CREAR)** Crear `modules/ajustes/store.ts` (**no existe ninguno**; la memoria que lo mencionaba está desactualizada): `fetch` config+distribución, `saveConfig`, `saveSocios`, con la convención de errores C10. La vista deja de importar `get/put`.
2. **(SRP)** Extraer `modules/ajustes/components/SettingsBlock.vue` (slots: header con título/hint + `dirty` chip, body, foot con acciones). Los 4 bloques lo usan. Opcional: cada bloque como subcomponente propio (`InicioBlock`, `PresupuestosBlock`, `SociosBlock`, `CuentaBlock`) para SRP fuerte si el archivo sigue grande.
3. **(DRY)** Reemplazar `.aj-switch` (socios) por `ToggleSwitch` (G2.1). Elimina ~30 líneas scoped + duplicación de a11y.
4. **(dirty)** Usar `useDirty` por bloque en vez de refs manuales (snapshot/compare ya implementado en el composable).
5. **(Tailwind)** Migrar todo el `<style scoped>` salvo `@keyframes aj-grow` (excepción C6). Botones → `BaseButton :disabled="!dirty"` (sin `:style` inline). `dirty-chip` → `bg-yellow text-yellow-ink`. `sum-indicator` ok/err → mapa de tono (`mint`/`coral-50`), sin `#1f5a3e` crudo.
6. **(reuso)** Inputs ya usan `FloatingField`/`FloatingSelect`; el input numérico de "días" y los `.prov-input` de socios → `FloatingField type=number` o input Tailwind.

## Componentes que crea/consume
Crea `modules/ajustes/components/SettingsBlock.vue` (+ opcionalmente bloques). Consume `ToggleSwitch`, `FloatingField`, `FloatingSelect`, `BaseButton`, store de ajustes, `useDirty`.

## Criterios de aceptación
- `vue-tsc` ok; los 4 bloques, dirty por bloque, validación de socios (suma=100%), guardado funcionan igual.
- Sin `services/api` directo; sin `:style` inline; switch de socios = `ToggleSwitch`.

## Riesgos / notas
- **(rev.1, resuelto)** Verificado en `web/src/stores/`: **no existe** store de ajustes (hay 7: auth, dashboard, clientes, finanzas, insumos, presupuestos, productos). Se **crea** uno nuevo; la nota de memoria estaba desactualizada.
- Validación `sociosValid` (suma activa = 100%) debe seguir gobernando el botón guardar de Finanzas.
- Archivo grande: la extracción de `SettingsBlock` es la que más reduce ruido.
