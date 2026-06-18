# Plan detallado — Epic A: Insumos (fix v4)

## Context
Tarea 1 (Categorías) ya está implementada y verde, pero quedaron dos gaps respecto a lo acordado: faltó el **tope de 12 por sección** y el **borrado con reasignación** (hoy bloquea). Este epic completa esos gaps **dentro del mismo flujo de Insumos** y ejecuta el rework de Insumos definido en `01 Estado Actual.md` (sección Epic A) a partir de la reunión del 2026-06-14.

Decisiones del usuario para este epic:
- Sin categoría destino disponible al borrar → **bloquear con aviso** (no crear destino inline).
- Tope 12 → botón `+` **deshabilitado con tooltip** "máximo 12 categorías".
- Columna "Estado" de la tabla → **se quita la columna pero se mantienen los chips de filtro** por estado (el semáforo de color del nivel comunica el estado).
- Detalle de insumo → **edición directa** (sin cambios; ya es así).

Los cambios se espejan en Productos donde aplica (categorías), pero el foco es Insumos.

---

## Parte 0 — Cierre de gaps de categorías

### Backend (`api/src/routes/insumos.ts` y `productos.ts`)
- **Tope 12 en `POST /categorias`:** antes de crear, `const total = await prisma.categoriaInsumo.count({ where: { activo: true } })`; si `total >= 12` → `throw conflict('Máximo 12 categorías por sección')`. Espejo en productos.
- **Reasignación en `DELETE /categorias/:id`:**
  - Agregar `categoriaDeleteSchema = z.object({ reasignarA: z.coerce.number().int().positive().optional() })` en `api/src/types/insumos.ts` y `productos.ts`; aplicar `zValidator('json', categoriaDeleteSchema)`.
  - Lógica: contar asociados activos. Si `count > 0`: exigir `reasignarA` (si falta → `badRequest('Indicá una categoría destino')`); validar que exista, sea activa, distinta y de la misma tabla (`notFound`/`badRequest`); en `$transaction`: `insumo.updateMany({ where: { categoriaId: id, activo: true }, data: { categoriaId: reasignarA } })` y luego soft delete `activo:false`. Si `count === 0`: soft delete directo.
  - Mantener el `_count` ya existente en `GET /categorias`.
- Tests: extender `api/src/test/categorias.test.ts` con 409 límite-12, 400 sin destino, 200 borrado+reasignación.

### Frontend
- **`web/src/components/ui/CategoriaPills.vue`:**
  - Deshabilitar el `+` cuando `categorias.length >= 12`: agregar `:disabled` y `title="Máximo 12 categorías"` en el botón `.add-pill` (línea 240); estilo disabled (opacidad, `pointer-events:none`). `startCreate()` hace `return` si ya hay 12.
- **`web/src/services/api.ts`:** agregar `delWithBody(url, id, body)` (DELETE con body vía ofetch) ya que el `del()` actual no manda cuerpo.
- **Stores (`web/src/stores/insumos.ts`, `productos.ts`):** cambiar firma a `removeCategoria(id, reasignarA?)` usando `delWithBody('/insumos/categorias', id, { reasignarA })` + `fetch()`.
- **Nuevo componente `web/src/components/ui/CategoriaDeleteDialog.vue`** (reemplaza el `ConfirmDialog` de borrado de categoría en `InsumosView.vue:312` y el equivalente en Productos):
  - props: `open`, `categoria` (con `_count`), `categorias` (lista completa, para derivar destinos).
  - `_count === 0`: confirmación simple ("Vas a eliminar la categoría X").
  - `_count > 0` y **hay** otras categorías: muestra "X tiene N elementos. Moverlos a:" + `FloatingSelect` con las otras activas; confirmar habilitado solo al elegir destino → emite `confirm(reasignarA)`.
  - `_count > 0` y **no hay** otras categorías: aviso "Creá otra categoría antes de poder eliminar esta"; confirmar deshabilitado.
  - emits: `confirm(reasignarA?)`, `cancel`.
- **`InsumosView.vue` / `ProductosView.vue`:** reemplazar el segundo `ConfirmDialog` por `CategoriaDeleteDialog`; `handleDeleteCatConfirm(reasignarA)` llama `store.removeCategoria(cat.id, reasignarA)`. Mantener el reseteo de `catFilter` a `'todas'` si se borró la categoría activa (ya existe en `InsumosView.vue:146`).

---

## Parte 1 — Tabla de Insumos (A1)
Archivo: `web/src/views/InsumosView.vue`.
- **Quitar columna "Estado":** eliminar el `<th>Estado</th>` (línea 234) y la celda `insumos-state-badge` (líneas 264-271). Actualizar `colspan` de la fila vacía de `9` → `8` (línea 284).
- **Semáforo en la barra "Nivel":** la barra (col "Nivel", líneas 259-263) pasa a colorear por vacío/bajo, no por los 3 niveles del filtro:
  - `stock === 0` → **rojo**, `stock < stockMinimo` (>0) → **naranja**, `stock >= stockMinimo` → ok.
  - Agregar un helper `barTone(i)` separado de `getNivel(i)` (que se mantiene **intacto** para los chips de filtro y los counts). Aplicar el color resultante a la barra.
  - **Micro-decisión de tokens:** el design system no tiene par naranja/rojo dedicado. Propuesta: rojo = `--coral-500`; naranja = introducir un token (`--orange`/tint) en `colors_and_type.css` o reusar un ámbar más cálido que `--yellow`. Confirmar el hex con el design system antes de hardcodear (regla DS: nada de valores crudos).
- **Mantener** los chips de filtro por estado (`insumos-filter-row`, líneas 201-212) — decisión del usuario.
- **Alineación numérica:** verificar que `.data-table th.num` / `td.num` alineen a la derecha en `components.css`; si no, ajustar (Stock, Mínimo, Costo unitario).

## Parte 2 — Detalle (A2)
Sin cambios: la apertura en edición directa se mantiene.

## Parte 3 — Formulario del insumo (A3/A4)
Archivo: `web/src/components/overlays/InsumoDetalle.vue`. Reorganizar a **3 secciones** según las palabras literales de Deni ("todo es el inicio… stock es otra parte… y el proveedor"). Hoy son 2 cards ("Identidad & stock" + "Compra & costos") en un grid 2-up (`.id-top`) + Proveedores + Notas full width. Mantener ese esqueleto 2-up regrupando el contenido:

**Layout:** fila superior 2-up → **Inicio** (columna izquierda, alta) | **columna derecha** con **Control de stock** arriba y **Proveedores** apilado debajo. Luego **Notas** full width al final. (El "Inicio" queda denso, así que se balancea contra las dos cards apiladas a la derecha.)

1. **Inicio** (sin título de card, "porque ya sé qué es" — Meme). Contiene identidad + presentación + costo:
   - **Nombre:** conservar el tamaño grande, pero **armonizar la estética con el resto del formulario** (mismos estados de foco/borde/label que los `FloatingField`, en vez del input "inline" suelto actual `.id-inline-name`). Que se lea como parte del sistema, no como un caso aparte.
   - grid-2: Categoría | Unidad de medida.
   - grid-2: **"Costo de la presentación"** (era "Costo del paquete") | **"Cantidad de unidades por presentación"** (era "Cantidad por pack").
   - **Costo unitario unificado:** una sola fila read-only con el `costoUnitario` calculado. **Eliminar** la fila duplicada "Costo de referencia / unidad" (líneas 416-421).
   - Toggle **"Insumo activo"** acá (decisión: va en Identificación), como fila compacta — no un recuadro grande (queja de Deni).
   - **Solo cambian labels de UI**; los campos backend (`costoPaquete`, `cantidadPack`) y el cálculo `costoUnitario` no se tocan (sin migración). Quitar toda la terminología "paquete/pack" de template y placeholders.
2. **Control de stock** — con título: grid-2 Stock actual | Stock mínimo + bloque de Nivel (`id-level-block`). Recolorear el nivel con la misma lógica vacío→rojo / bajo→naranja de la tabla, para consistencia (`nivelMeta`/`fillPct`, líneas 47-67).
3. **Proveedores** — apilado bajo Control de stock; tabla existente sin cambios funcionales (hasta 3, principal obligatorio).

(**Notas** se mantiene como sección final full width, sin cambios.)

### Accesibilidad (aplicar en toda la reconstrucción — A11y)
La reconstrucción del formulario debe subir el estándar de accesibilidad, no solo reordenar:
- **Estructura semántica:** cada sección como `<fieldset>` con `<legend>` (o `role="group"` + `aria-labelledby`) para que el lector de pantalla anuncie "Control de stock", "Proveedores", etc. El "Inicio" sin título visible igual necesita un `aria-label` ("Datos del insumo").
- **Labels reales:** todo input asociado a su `<label for>` (los `FloatingField`/`FloatingSelect` ya lo hacen; el nuevo campo Nombre debe mantener esa asociación, no un label decorativo).
- **Campo calculado:** el Costo unitario read-only con `aria-readonly="true"` y `aria-label` claro; que no sea foco de tabulación si no aporta (`tabindex="-1"` ya está).
- **Unidad asociada:** el `id-unit-pill` (la unidad junto a stock/cantidad) debe vincularse al input vía `aria-describedby` para que "500" se anuncie como "500 centímetros".
- **Errores:** usar `aria-invalid` + `aria-describedby` apuntando al mensaje de error (hoy `errors` existe pero no se renderiza ni anuncia); el foco debe ir al primer campo inválido al guardar.
- **Orden de tabulación y foco:** tab order lógico siguiendo el orden visual; al abrir el overlay, foco inicial en Nombre; trap de foco dentro del overlay (ya hay patrón en `ConfirmDialog`).
- **Controles:** el toggle "Insumo activo" (ya accesible vía `ToggleSwitch`) y el radio "principal" de proveedores con `role="radio"`/`aria-checked` y navegación por teclado.
- **Contraste:** validar los nuevos colores del semáforo (naranja/rojo) contra texto/fondo según WCAG AA.
- Verificación con la skill `accessibility` (auditoría WCAG 2.2) al cerrar el epic.

---

## Verificación
- **Backend:** `npm test` en `api/` (recordar instalar con `--legacy-peer-deps`); deben pasar los tests nuevos de límite-12, sin-destino y borrado+reasignación. Pruebas manuales con la app: crear hasta 12 (la 13 → 409), borrar categoría con insumos eligiendo destino (los insumos se mueven), borrar categoría única con insumos → bloqueada.
- **Frontend:** `npx vue-tsc -b` en `web/` sin errores. Manual en Insumos: la columna "Estado" no aparece pero los chips de filtro funcionan; la barra de nivel se ve roja con stock 0 y naranja bajo el mínimo; el `+` se deshabilita con tooltip al llegar a 12; el formulario muestra las 4 secciones con la terminología "presentación". Repetir el chequeo de categorías en Productos.

## Archivos a tocar
- `api/src/routes/insumos.ts`, `api/src/routes/productos.ts` — tope 12 + DELETE con reasignación.
- `api/src/types/insumos.ts`, `api/src/types/productos.ts` — `categoriaDeleteSchema`.
- `api/src/test/categorias.test.ts` — tests nuevos.
- `web/src/services/api.ts` — `delWithBody`.
- `web/src/stores/insumos.ts`, `web/src/stores/productos.ts` — `removeCategoria(id, reasignarA?)`.
- `web/src/components/ui/CategoriaPills.vue` — `+` deshabilitado a los 12.
- `web/src/components/ui/CategoriaDeleteDialog.vue` — **nuevo**.
- `web/src/views/InsumosView.vue`, `web/src/views/ProductosView.vue` — diálogo de borrado + (Insumos) tabla sin columna Estado + semáforo.
- `web/src/components/overlays/InsumoDetalle.vue` — formulario en 4 secciones + terminología.
- `web/src/assets/css/colors_and_type.css` (o `components.css`) — token de color naranja del semáforo (a confirmar).
```