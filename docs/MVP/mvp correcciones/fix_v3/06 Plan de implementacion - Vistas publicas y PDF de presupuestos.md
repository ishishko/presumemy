# Plan de Implementación — Vistas públicas y archivos PDF de presupuestos (V6)

Este plan agrega la capacidad de **compartir y descargar el documento de presupuesto**: una vista web pública (`/p/:token`, sin login) que reutiliza la misma plantilla del preview del editor, y un **PDF real generado en el servidor** con Puppeteer, almacenado en Supabase Storage y servido con signed URLs.

El registro de lo efectivamente realizado se llevará en `06 Walkthrough - Vistas publicas y PDF.md`, actualizado al cerrar cada fase.

---

## Arquitectura elegida (debatida)

- **El link para el cliente es una vista web, no un PDF**: `/p/:token` renderiza el mismo componente Vue del preview. Se ve bien en móvil, siempre muestra la versión vigente y no requiere generar nada.
- **El archivo PDF se genera en el servidor con Puppeteer**, que navega a esa misma vista pública e imprime a A4. Una sola fuente de verdad: preview del editor, link compartido y archivo descargado son el mismo HTML/CSS — nunca divergen.
- **Generación perezosa y única**: el PDF se crea cuando el presupuesto **sale de `borrador`** (y se regenera al editar). En `borrador` o `cancelado` el documento no existe (regla pedida de optimización). Se sube a un bucket privado `presupuestos-pdf` con `upsert` (un archivo por folio).
- Producción: API en **Render** (soporta Puppeteer con cache configurado), frontend en **Netlify**.

## Estado actual (hechos verificados del código)

- El preview del documento ya existe en `web/src/components/editors/PresupuestoEditor.vue` (markup `.preview-doc` ~líneas 956-1046, estilos scoped ~1427-1611) y consume un `snapshot` local.
- FSM real (`api/src/utils/fsm.ts`): `borrador → ['en_curso','cancelado']`. El estado `enviado` es legacy → **el trigger del PDF es "sale de borrador hacia algo ≠ cancelado"**, no literalmente "→enviado".
- El checkbox "Incluir en impresión / vista web" (`includeNotes`) es un ref local, **no se persiste** → nuevo campo `notasPublicas`.
- El bloque Contacto del preview está hardcodeado (`MemyDeni · hola@memydeni.mx`, líneas 1032-1033) → debe salir de `ConfiguracionNegocio` (schema.prisma:15-27, endpoint en `api/src/routes/ajustes.ts`).
- Auth se aplica por archivo de ruta (`route.use('*', authMiddleware)`); `api/src/index.ts` no tiene auth global → montar rutas públicas es trivial. CORS ya permite `localhost:5173` y `*.netlify.app`.
- `api/prisma/migrations/` no tiene migraciones → aplicar schema con `npx prisma db push`.
- La API ya tiene `@supabase/supabase-js`; no hay ninguna dependencia PDF todavía.

---

## Fase 0 — Schema y fundaciones backend

#### [MODIFY] api/prisma/schema.prisma (modelo Presupuesto)

```prisma
publicToken    String?   @unique @map("public_token")
pdfPath        String?   @map("pdf_path")
pdfGeneratedAt DateTime? @map("pdf_generated_at")
notasPublicas  Boolean   @default(true) @map("notas_publicas")
updatedAt      DateTime  @default(now()) @updatedAt @map("updated_at")
```

`updatedAt` permite detectar PDF desactualizado (`pdfGeneratedAt < updatedAt`). Aplicar con `npx prisma db push`. Crear bucket **privado** `presupuestos-pdf` en Supabase.

#### [NEW] api/src/lib/supabase.ts
Cliente admin: `createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })`.

#### Dependencias y env
- `npm i puppeteer` en api/.
- `api/.env`: `FRONTEND_URL` (local `http://localhost:5173`; prod = URL de Netlify), `SUPABASE_STORAGE_BUCKET=presupuestos-pdf`.

---

## Fase 1 — Vista pública

#### [NEW] web/src/components/presupuestos/PresupuestoDoc.vue
Extraer el bloque `.preview-doc` del editor (markup + estilos scoped se mueven tal cual; están anidados bajo `.preview-doc` y las custom properties del DS son globales). Props: `{ doc: PresupuestoDocData, config?: ConfigNegocio | null }` (shape ≈ snapshot actual). El bloque Contacto y el pie usan `config` (nombre, contactoCanal/Valor, moneda) con fallback al texto actual; logo `config?.logoUrl || '/memydeni-logo.png'`.

#### [NEW] api/src/routes/public.ts — montado en index.ts como `app.route('/api/public', publicRoutes)` SIN authMiddleware
- `GET /presupuestos/:token`: busca por `publicToken` + `activo: true`; **404 si estado ∈ {borrador, cancelado}**. Devuelve DTO acotado: folio, createdAt, estado, `cliente.nombre`, tematica, fechas, tipoEntrega, direccionEntrega, metodoPago, sena, total, `notas` solo si `notasPublicas`, detalles (descripcion, cantidad, precioUnitario, subtotal) y `config` (nombre, logoUrl, domicilio, contactoCanal, contactoValor, moneda). **Sin ids internos ni costos.**

#### [NEW] web/src/features/public/PublicPresupuestoView.vue + router
- Ruta `{ path: '/p/:token', meta: { requiresAuth: false } }` en `web/src/router/index.ts`; saltear `authStore.init()` para esta ruta (acelera la carga para Puppeteer y clientes).
- `App.vue`: generalizar `isAuthRoute` → `isBareRoute` (login + public-presupuesto) para renderizar sin sidebar/topbar.
- Fetch a `/api/public/presupuestos/:token`, mapea al shape de `PresupuestoDoc`, setea `data-doc-ready="true"` al terminar de cargar (señal para Puppeteer), botón "Imprimir" (`window.print()`, oculto con query `?pdf=1`), estados loading y 404.
- CSS print (no-scoped en esta vista): `@page { size: A4; margin: 14mm }`; `@media print` oculta `.no-print` y quita borde/sombra/max-width del documento.

#### [MODIFY] api/src/routes/presupuestos.ts — token
- `POST /`: `publicToken: crypto.randomBytes(16).toString('base64url')` en ambas ramas de create (normal y facturado). Token al crear = link estable toda la vida del presupuesto; la **visibilidad** la controla el endpoint público por estado.
- Backfill lazy para presupuestos existentes: si falta token al pedir PDF/link, generarlo.

---

## Fase 2 — Generación de PDF en servidor

#### [NEW] api/src/lib/pdf.ts
- Browser singleton lazy (relanzar si `!browser.connected`), args `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage`. Mutex simple para no correr dos Chrome a la vez (Render free = 512 MB RAM).
- `generarPdfPresupuesto(id)`:
  1. Carga el presupuesto; aborta si estado es `borrador`/`cancelado` o falta token.
  2. `page.goto(\`${FRONTEND_URL}/p/${token}?pdf=1\`, { waitUntil: 'networkidle0', timeout: 30000 })` + `page.waitForSelector('[data-doc-ready="true"]')` + `document.fonts.ready` (fuente Onest de Google Fonts).
  3. `page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true })`.
  4. Sube a Storage path `presupuestos/${folio}.pdf` con `upsert: true`; actualiza `pdfPath` y `pdfGeneratedAt`. `page.close()` en finally.

#### [MODIFY] api/src/routes/presupuestos.ts — hooks y descarga
- `PATCH /:id/estado`: si `existing.estado === 'borrador' && nuevoEstado !== 'cancelado'` → `void generarPdfPresupuesto(id).catch(console.error)` (**fire-and-forget**: la generación de 3-8 s nunca bloquea ni rompe el cambio de estado).
- `PUT /:id`: si `estado !== 'borrador'` → mismo fire-and-forget tras responder (regeneración al editar).
- **[NEW] `GET /:id/pdf` (auth)**: red de seguridad on-demand — si `pdfPath == null` o `pdfGeneratedAt < updatedAt`, genera sincrónicamente en ese request; responde `{ data: { url, generatedAt } }` con `createSignedUrl(pdfPath, 3600)`. JSON en vez de stream/redirect: no consume RAM/ancho de banda del servicio y evita problemas de headers con ofetch.

---

## Fase 3 — UI del editor

#### [MODIFY] web/src/components/editors/PresupuestoEditor.vue
- Reemplazar el markup del preview por `<PresupuestoDoc :doc="snapshot" :config="config" />`; cargar config desde `/ajustes/configuracion` en el onMounted existente; borrar los estilos migrados.
- Persistir `notasPublicas: includeNotes.value` en el save y cargarlo al abrir un presupuesto. Agregar `notasPublicas: z.boolean().optional()` al schema zod en `api/src/types/presupuestos.ts`.
- Botones **"Descargar PDF"** y **"Copiar link"** en `editor-foot-right` (hoy vacío, ~línea 1071), visibles solo si `!isNew && estado !== 'borrador' && estado !== 'cancelado'`:
  - Descargar: `GET /presupuestos/:id/pdf` → `window.open(url)`, con loading (la primera vez puede tardar ~5-10 s si genera on-demand).
  - Copiar link: `navigator.clipboard.writeText(\`${location.origin}/p/${publicToken}\`)` + toast. Agregar `publicToken` al tipo `Presupuesto` en `web/src/types`.

---

## Fase 4 — Deploy (Render)

- Build command del servicio API: `npm ci && npx puppeteer browsers install chrome && npm run build`, con `PUPPETEER_CACHE_DIR=/opt/render/project/.puppeteer` **en build y runtime** (sin esto el Chrome instalado en build no se encuentra en runtime).
- Env de runtime en Render: `FRONTEND_URL` (URL de Netlify), `SUPABASE_STORAGE_BUCKET`.
- Local Windows: `npm i puppeteer` descarga Chrome automáticamente. En WSL puede requerir libs del sistema (`libnss3`, `libatk-bridge2.0-0`, `libgbm1`…) o `PUPPETEER_EXECUTABLE_PATH` a un Chrome existente.

---

## Verificación end-to-end (local)

1. `npx prisma db push`; crear bucket `presupuestos-pdf` (privado) en Supabase; setear `FRONTEND_URL` en `api/.env`.
2. Levantar api (3000) y web (5173). `npx vue-tsc -b` en web/ sin errores.
3. Crear presupuesto → `publicToken` poblado en DB; `/p/{token}` da 404 (borrador).
4. Pasar a `en_curso` → log de generación, archivo en el bucket, `pdfPath`/`pdfGeneratedAt` poblados; `/p/{token}` renderiza el documento; Ctrl+P muestra layout limpio A4.
5. "Descargar PDF" abre el archivo; editar el presupuesto en `en_curso` → se regenera; borrar `pdfPath` a mano y descargar → genera on-demand.
6. Cancelar → `/p/{token}` vuelve a 404 y los botones desaparecen del editor.
