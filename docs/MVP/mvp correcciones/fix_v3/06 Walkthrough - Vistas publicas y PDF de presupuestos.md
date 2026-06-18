# Walkthrough — Vistas públicas y archivos PDF de presupuestos (V6)

Este documento registra el trabajo efectivamente realizado al implementar la capacidad de **compartir y descargar el documento de presupuesto** (vista web pública por link + PDF real generado en servidor), según el plan `06 Plan de implementacion - Vistas publicas y PDF de presupuestos`.

Implementado y verificado en local en una sola pasada (commit `763856e`). Pendiente únicamente el deploy en Render (ver sección final).

---

## Decisión de arquitectura (debatida antes de implementar)

- **El link para el cliente es una vista web, no un PDF**: `/p/:token` renderiza el mismo componente Vue del preview del editor. Se ve bien en móvil, siempre muestra la versión vigente y no requiere generar nada.
- **El archivo PDF se genera en el servidor con Puppeteer**, que navega a esa misma vista pública e imprime a A4 → una sola fuente de verdad: preview, link compartido y archivo son el mismo HTML/CSS.
- **Regla de optimización pedida**: el documento solo existe cuando el presupuesto avanzó más allá de `borrador` y no está `cancelado`. El PDF se genera al salir de borrador (trigger sobre la FSM real `borrador → en_curso`; `enviado` es legacy) y se regenera al editar; se almacena en un bucket privado de Supabase Storage (`presupuestos-pdf`, un archivo por folio con upsert) y se sirve con signed URLs.

---

## Fase 0 — Schema y fundaciones backend

### Cambios de schema (`api/prisma/schema.prisma`, modelo Presupuesto)
- `publicToken String? @unique` — token aleatorio URL-safe (`crypto.randomBytes(16).toString('base64url')`), asignado al crear.
- `pdfPath String?` y `pdfGeneratedAt DateTime?` — ubicación en Storage y fecha de generación.
- `notasPublicas Boolean @default(true)` — persiste el checkbox "Incluir en impresión / vista web" (antes era un ref local que no se guardaba).
- `updatedAt DateTime @updatedAt` — permite detectar PDF desactualizado (`pdfGeneratedAt < updatedAt`).
- Aplicado con `npx prisma db push` (el warning del unique sobre `public_token` es inocuo: las filas existentes quedan en `NULL` y los `NULL` no cuentan como duplicados en Postgres).

### Librerías nuevas
- **[NEW] `api/src/lib/supabase.ts`**: cliente admin de Supabase (service role, sin sesión persistente) + constante `STORAGE_BUCKET`.
- **[NEW] `api/src/lib/pdf.ts`**:
  - Browser singleton lazy (se relanza si se desconecta) con `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage`.
  - **Cola secuencial**: nunca corren dos Chrome a la vez (clave para los 512 MB del plan free de Render).
  - `generarPdfPresupuesto(id)`: aborta en borrador/cancelado o sin token; navega a `FRONTEND_URL/p/:token?pdf=1` (`networkidle0` + `[data-doc-ready]` + `document.fonts.ready` para la fuente Onest); `page.pdf({ format: 'A4', printBackground: true })`; sube a `presupuestos/{folio}.pdf` con upsert; el bucket se crea solo si no existe.
  - Gotcha resuelto: `pdfGeneratedAt` y `updatedAt` se guardan con el **mismo timestamp explícito** — si no, `@updatedAt` quedaría unos ms después y el PDF se consideraría siempre desactualizado.
  - `signedPdfUrl(path)`: firma URLs de descarga (1 h).
- `npm i puppeteer` en api/; env nuevas en `api/.env`: `FRONTEND_URL`, `SUPABASE_STORAGE_BUCKET`.

---

## Fase 1 — Vista pública

### [NEW] `web/src/components/presupuestos/PresupuestoDoc.vue`
- Plantilla del documento extraída del preview del editor, con props tipadas `{ doc: PresupuestoDocData, config }`.
- El bloque Contacto y el pie dejan de estar hardcodeados ("MemyDeni · hola@memydeni.mx") y usan `ConfiguracionNegocio` (nombre, canal/valor de contacto, logo, moneda), con fallback al texto anterior.
- **Sin estilos scoped**: los estilos `.preview-doc` ya existían globales en `components.css`; se eliminó la copia scoped duplicada que tenía el editor.

### [NEW] `api/src/routes/public.ts` — montado como `/api/public` SIN authMiddleware
- `GET /presupuestos/:token`: busca por `publicToken` + `activo`; **404 si estado ∈ {borrador, cancelado}** (la regla de visibilidad vive acá, el token es estable toda la vida del presupuesto).
- Devuelve un **DTO acotado**: folio, fechas, nombre del cliente (solo nombre), detalles (descripción/cantidad/precio/subtotal), totales, `notas` solo si `notasPublicas`, y la config del negocio para el membrete. Sin ids internos ni costos.

### [NEW] `web/src/features/public/PublicPresupuestoView.vue` + router
- Ruta `/p/:token` con `meta: { requiresAuth: false, public: true }`; el guard saltea `authStore.init()` en rutas públicas (acelera la carga para clientes y Puppeteer).
- `App.vue`: `isAuthRoute` → `isBareRoute` (login + públicas) para renderizar sin sidebar/topbar.
- Estados loading / 404 ("Este presupuesto no está disponible"), botón **Imprimir** (`window.print()`), atributo `data-doc-ready="true"` al cargar (señal de Puppeteer).
- Modo `?pdf=1`: sin toolbar, sin animación de entrada, sin borde/sombra de card.
- CSS print: `@page { size: A4; margin: 14mm }` + `@media print` que limpia la decoración.

---

## Fase 2 — Generación y descarga de PDF

### [MODIFY] `api/src/routes/presupuestos.ts`
- `POST /`: `publicToken` en ambas ramas de creación (normal y facturado directo); si nace más allá de borrador, dispara generación.
- `PUT /:id`: persiste `notasPublicas`; si el estado persistido no es borrador, regenera el PDF **fire-and-forget** (la generación de varios segundos nunca bloquea ni rompe el guardado).
- `PATCH /:id/estado`: al salir de borrador hacia algo ≠ cancelado, genera en segundo plano. Backfill perezoso del token si falta.
- `GET /:id` (detalle): **backfill perezoso del token** — los presupuestos previos a la feature reciben su token al abrirlos (resolvió el "No se pudo obtener el link" en presupuestos que ya estaban en curso antes del cambio).
- **[NEW] `GET /:id/pdf`** (auth): 403 en borrador/cancelado; si el PDF falta o está desactualizado lo genera sincrónicamente (red de seguridad on-demand); responde `{ url, generatedAt }` con signed URL. JSON en vez de stream/redirect: no consume RAM del servicio.
- Fix de bug preexistente: `Prisma.Decimal` se usaba sin importar `Prisma` (rompía `tsc`).
- `api/src/types/presupuestos.ts`: `notasPublicas` agregado al schema zod.

---

## Fase 3 — UI del editor

### [MODIFY] `web/src/components/editors/PresupuestoEditor.vue`
- El preview del panel derecho usa `<PresupuestoDoc :doc="snapshot" :config="config" />`; la config del negocio se carga junto con clientes/productos en el `onMounted`.
- **El documento aparece al abrir** un presupuesto ya guardado (antes el panel quedaba en placeholder hasta guardar: `loadPresupuesto` ahora captura el snapshot).
- El checkbox "Incluir en impresión / vista web" se persiste (`notasPublicas`) y se restaura al abrir.
- Botones **Copiar link** (clipboard + toast) y **Descargar PDF** (signed URL en pestaña nueva, con estado "Generando..." porque la primera vez puede tardar) en `editor-foot-right`, visibles solo si el **estado persistido** pasó de borrador y no está cancelado.
- `web/src/types/index.ts`: `Presupuesto` ampliado con `notasPublicas`, `publicToken`, `pdfPath`, `pdfGeneratedAt`, `updatedAt`.

---

## Problemas encontrados durante la verificación local

1. **404 en `/:id/pdf` tras implementar**: `tsx watch` no detecta cambios de archivos en WSL+NTFS (Vite sí, porque tiene `usePolling`) → el server de la API corría código viejo. Solución: reinicio manual de la API tras cada cambio de backend.
2. **500 en toda la lista de presupuestos**: el Prisma Client ya conocía las columnas nuevas pero faltaba el `db push` en la base. Resuelto al aplicarlo.
3. **"Could not find Chrome"**: `npm i puppeteer` se corrió desde Windows (Chrome win64); la API corre en WSL. Se instaló el Chrome de Linux dentro de WSL — con la trampa de que en shells no interactivas el `npx` resuelve al de Windows por el PATH interop, hubo que cargar nvm a mano. Además faltaban libs del sistema (`libnspr4`, `libnss3`, etc.), instaladas con apt.
4. **"No se pudo obtener el link"** en presupuestos que ya estaban en curso antes de la feature → resuelto con el backfill del token en el GET de detalle (punto Fase 2).

## Verificación
- `npx vue-tsc -b` (web) → cero errores. `npx tsc --noEmit` (api) → cero errores (antes fallaba; ahora el build de la API pasa).
- Flujo completo verificado por el usuario en local: lista, preview al abrir, transición de estado, Copiar link (vista pública en incógnito), Descargar PDF.

## Pendiente — Deploy en Render
- Build command: `npm install && npx puppeteer browsers install chrome && npm run build`.
- Env vars: `PUPPETEER_CACHE_DIR=/opt/render/project/.puppeteer` (clave: sin ella Chrome se instala en `~/.cache` durante el build y no persiste al runtime), `FRONTEND_URL` (URL de Netlify, sin barra final), `SUPABASE_STORAGE_BUCKET=presupuestos-pdf`.
- Netlify no requiere cambios (el redirect SPA de `netlify.toml` ya cubre `/p/:token`); el bucket se crea solo desde la API.
- Plan free: cola secuencial ya mitiga la RAM (512 MB); el primer PDF tras el spin-down puede tardar 30-60 s.

## Archivos
- [NEW] `api/src/lib/pdf.ts`, `api/src/lib/supabase.ts`, `api/src/routes/public.ts`
- [NEW] `web/src/components/presupuestos/PresupuestoDoc.vue`, `web/src/features/public/PublicPresupuestoView.vue`
- [MODIFY] `api/prisma/schema.prisma`, `api/src/index.ts`, `api/src/routes/presupuestos.ts`, `api/src/types/presupuestos.ts`
- [MODIFY] `web/src/App.vue`, `web/src/router/index.ts`, `web/src/types/index.ts`, `web/src/components/editors/PresupuestoEditor.vue`
