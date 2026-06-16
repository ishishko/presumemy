# Plan detallado — Tarea 1: Consolidación de Categorías (fix v4)

## Context

Única queja real del cliente tras usar el MVP: **"no puedo editar las categorías"**. Hoy las categorías de insumos y productos viven en tablas relacionales (`categorias_insumo`, `categorias_producto`) pero el backend solo expone `GET /categorias` — no hay forma de crear, renombrar ni eliminar. El requerimiento (06 Estado Actual + reuniones) es **editar las pills/tags directamente en cada sección, de forma independiente**.

Objetivo: CRUD completo de categorías, con UI de pills editables inline reutilizable en Insumos y Productos. Soft delete consistente con el resto del sistema, y guarda contra borrar categorías con elementos asociados (mostrando el conteo, como pidió Deni).

### Gotcha que condiciona el diseño
Los filtros de categoría comparan por **`nombre` (string)**, no por `id`:
- `web/src/views/InsumosView.vue:49` → `i.categoria?.nombre !== catFilter.value`
- `web/src/views/ProductosView.vue:29` → `p.categoria?.nombre === catFilter.value`

Al renombrar una categoría, (a) el filtro activo (un string) deja de matchear y (b) el `categoria.nombre` embebido en los insumos/productos ya cargados queda viejo. **Solución:** migrar el filtro a comparar por `categoriaId`, y tras cualquier mutación de categoría hacer `store.fetch()` para refrescar los nombres embebidos.

---

## Backend (api/)

Patrón espejo en `api/src/routes/insumos.ts` (modelo `categoriaInsumo`, relación `insumos`) y `api/src/routes/productos.ts` (modelo `categoriaProducto`, relación `productos`). Montados en `/api/insumos` y `/api/productos` (`api/src/index.ts`). Todo ya está bajo `authMiddleware`.

### 1. Schema de validación
Agregar en `api/src/types/insumos.ts` y `api/src/types/productos.ts`:
```ts
export const categoriaSchema = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido').max(40),
})
```

### 2. Enriquecer `GET /categorias` con conteo
Modificar el handler existente para devolver el conteo de elementos **activos** asociados (para mostrar "(3)" en la pill y decidir el borrado). Prisma 6.19 soporta `_count` con filtro:
```ts
const categorias = await prisma.categoriaInsumo.findMany({
  where: { activo: true },
  orderBy: { nombre: 'asc' },
  select: { id: true, nombre: true, activo: true,
    _count: { select: { insumos: { where: { activo: true } } } } },
})
```
(En productos: `productos: { where: { activo: true } }`.)

### 3. Endpoints nuevos (agrupar junto al `GET /categorias`, antes de `GET /:id`)
- **`POST /categorias`** (`zValidator('json', categoriaSchema)`): rechazar duplicado case-insensitive entre activas (`conflict('Ya existe una categoría con ese nombre')`); crear y devolver `{ data }`, 201.
- **`PUT /categorias/:id`**: validar existencia (`notFound`), rechazar duplicado contra otras, actualizar `nombre`, devolver `{ data }`.
- **`DELETE /categorias/:id`**: validar existencia; **contar asociados activos**; si `> 0` → `conflict('No se puede eliminar: tiene N elementos asociados')` (incluir el número en el mensaje); si `0` → soft delete `activo:false`, devolver `{ message }`.

Reusar helpers de `api/src/utils/errors.ts`: `notFound`, `conflict`, `badRequest`. **Nota:** `productos.ts` hoy solo importa `notFound` — agregar `conflict` (e `badRequest` si hace falta) al import.

**Hono routing:** `/categorias/:id` (2 segmentos) no colisiona con `PUT/DELETE /:id` (1 segmento), pero igual definir el bloque de categorías inmediatamente después del `GET /categorias` para que sea legible y robusto.

---

## Frontend (web/)

### 4. Tipos (`web/src/types/index.ts`)
Agregar conteo opcional a `CategoriaInsumo` y `CategoriaProducto`:
```ts
_count?: { insumos: number }   // productos: { productos: number }
```

### 5. Servicio API
Ya sirve sin cambios (`web/src/services/api.ts`): `post(url, body)`, `put(url, id, body)` → `${url}/${id}`, `del(url, id)`. Las URLs serán `/insumos/categorias` y `/productos/categorias`.

### 6. Acciones en stores (`web/src/stores/insumos.ts` y `productos.ts`)
Agregar (espejo en ambos, ajustando ruta):
```ts
async function createCategoria(nombre: string) {
  await post<CategoriaInsumo>('/insumos/categorias', { nombre })
  await fetch()   // refresca categorias + nombres embebidos
}
async function updateCategoria(id: number, nombre: string) {
  await put<CategoriaInsumo>('/insumos/categorias', id, { nombre })
  await fetch()
}
async function removeCategoria(id: number) {
  await del('/insumos/categorias', id)
  await fetch()
}
```
Exponerlas en el `return` del store. `fetch()` ya trae ambas listas en paralelo, así que el refetch mantiene todo en sync (resuelve el gotcha de nombres embebidos).

### 7. Componente nuevo reutilizable: `web/src/components/ui/CategoriaPills.vue`
Reemplaza el markup de pills duplicado en ambas vistas. API:
- **props:** `categorias: Categoria[]`, `modelValue: number | 'todas'` (filtro activo por **id**), `variant?: 'insumos' | 'productos'` (mapea a las clases existentes `.insumos-cat-pill` / `.pill` para no romper la identidad visual de cada sección).
- **emits:** `update:modelValue` (cambia el filtro), `create(nombre)`, `rename({ id, nombre })`, `remove(categoria)`.
- **Comportamiento:**
  - Pill "Todas/Todos" (no editable) + una pill por categoría + pill final **`+`** para crear.
  - Click normal en pill = filtra (emite `update:modelValue` con el `id`).
  - Hover sobre una pill revela acciones sutiles: lápiz (renombrar) y `×` (eliminar). Stroke 1.5 Lucide, `currentColor`.
  - Renombrar: el lápiz convierte la pill en un `<input>` inline (autofocus); Enter/blur → emite `rename`; Escape cancela.
  - Crear: el `+` abre un input inline al final; Enter → emite `create`.
  - Mostrar el conteo `_count` junto al nombre cuando exista (ej. tenue "· 3").
- Sin emojis (regla del design system); colores siempre por variables CSS.

### 8. Integración en las vistas
En `InsumosView.vue` y `ProductosView.vue`:
- Reemplazar el bloque de pills nativo por `<CategoriaPills :variant="..." :categorias="store.categorias" v-model="catFilter" @create=... @rename=... @remove=... />`.
- **Migrar `catFilter` de nombre→id:** inicial `'todas'`; el computed de filtrado pasa a comparar `i.categoriaId === catFilter` (en vez de `i.categoria?.nombre`). Esto sobrevive a renames.
- Handlers en la vista llaman a las acciones del store, con `useToast()` para feedback (`'Categoría creada'`, `'Categoría actualizada'`, etc.) y manejo de error (el 409 de duplicado/borrado bloqueado se muestra como toast `'error'`).
- **Borrado:** el `@remove` abre `ConfirmDialog` (ya existente) con mensaje que incluye `_count` ("Tiene 3 insumos asociados; no se puede eliminar" si >0, o confirmación normal si 0). Reusar el patrón de `ConfirmDialog` ya presente en `InsumosView.vue:264`.

### 9. CSS
Reusar `.insumos-cat-pill` / `.pill` existentes (`web/src/assets/css/components.css`). Agregar solo estilos para: botones de acción on-hover (pencil/×), la pill `+`, y el input inline de edición — siguiendo tokens (`--violet-700`, `--border`, `--coral-500` para el ×, radios `--r-pill`).

---

## Verificación

**Backend (manual + tests):**
- Levantar `api` (`npm run dev` en `api/`). Probar con la app o curl: `POST/PUT/DELETE /api/insumos/categorias` y `/api/productos/categorias`. Verificar: duplicado → 409; borrar categoría con insumos activos → 409 con el conteo; borrar categoría vacía → ok.
- Opcional pero alineado con el setup de testing recién arreglado: agregar tests en `api/src/test/categorias.test.ts` espejando `ajustes.test.ts` (mock de Prisma vía Proxy; cubrir 201 create, 409 duplicado, 409 borrado bloqueado, 200 borrado ok). Correr `npm test` (recordar `--legacy-peer-deps` al instalar en api/).

**Frontend (manual):**
- `npm run dev` en `web/`. En Insumos y Productos: crear categoría con `+`, renombrar inline, eliminar. Confirmar que:
  - El filtro por categoría sigue funcionando tras un rename (gracias a la migración a `id`).
  - Al renombrar, los insumos/productos muestran el nombre nuevo (refetch).
  - No se puede borrar una categoría con elementos asociados (toast/diálogo con conteo).
- `npx vue-tsc -b` en `web/` sin errores de tipos.

## Archivos a tocar (resumen)
- `api/src/routes/insumos.ts`, `api/src/routes/productos.ts` — endpoints + `_count` en GET.
- `api/src/types/insumos.ts`, `api/src/types/productos.ts` — `categoriaSchema`.
- `web/src/stores/insumos.ts`, `web/src/stores/productos.ts` — acciones createCategoria/updateCategoria/removeCategoria.
- `web/src/components/ui/CategoriaPills.vue` — **nuevo** componente compartido.
- `web/src/views/InsumosView.vue`, `web/src/views/ProductosView.vue` — integración + filtro por id.
- `web/src/types/index.ts` — `_count` en tipos de categoría.
- `web/src/assets/css/components.css` — estilos de acciones/input inline.
- (Opcional) `api/src/test/categorias.test.ts` — tests.