# G4.3 — `components/presupuestos/PresupuestoDoc.vue`

| | |
|---|---|
| **Ruta** | `web/src/components/presupuestos/PresupuestoDoc.vue` |
| **Grupo / orden** | G4 (medianos) · 3º |
| **LOC actuales** | 158 |
| **Tipo** | migrar |
| **Dependencias** | G0; G1.1 (`formatMoney`/`formatDate`) |
| **Consumidores** | `PresupuestoEditor` (preview, G6.6), `PublicPresupuestoView` (G5.8) |

## Estado actual
Documento de presupuesto presentacional (folio, cliente, fechas, tabla de líneas, totales, seña/resto, entrega, contacto, notas, footer). Tipos exportados `PresupuestoDocData`/`PresupuestoDocLine`. **Smell:** define `money()` y `niceDate()` locales (duplican `formatMoney`/`formatDate`). Clases globales `.preview-doc`, `.doc-head`, `.doc-meta`, `.doc-customer`, `.doc-table`, `.doc-totals`, `.doc-grid`, `.doc-block`, `.doc-notes`, `.doc-foot` (`components.css` ~1760-2007) + helpers `.text-hint`/`.num`.

## Objetivo
Documento 100% Tailwind, sin `money()`/`niceDate()` locales (usar utils de G1.1). Presentacional puro (sin fetch, ya recibe `doc`+`config`). **Importante:** también lo renderiza Puppeteer (PDF) → el resultado visual debe ser fiel.

## Plan de acción paso a paso
1. **(DRY/DIP)** Reemplazar `money()` → `formatMoney` (G1.1) y `niceDate()`/`docDate` → `formatDate` (consolidar formatos de fecha; cuidar que `niceDate` usa `weekday/day/month` cortos y `docDate` usa `day/long-month/year` — pueden ser dos helpers o `formatDate(value, style)`).
2. **(Tailwind)** Migrar todas las `.doc-*` a utilidades. Tabla del doc con headers `num` tabular. Totales con `.big`/`.small` → tamaños Tailwind. `.text-hint`/`.num` → `text-12 text-ink-muted`/`num` (definir `num` como utilidad `tabular-nums` o `font-variant-numeric`).
3. **(Vue)** Mantener computeds `negocio`/`contactoLinea`/`docDate`, props `doc`/`config`, y los tipos exportados (otros archivos los importan).

## Mapeo Tailwind (parcial)
| Antes | Después |
|---|---|
| `.preview-doc` | contenedor `bg-surface ... p-... text-ink` (ver prototipo) |
| `.doc-head` | `flex items-start justify-between` |
| `.doc-table th.num` | `text-right num` |
| `.doc-totals .r.big` | `flex justify-between text-18 font-medium` |
| `.text-hint` | `text-12 text-ink-muted` |

## Criterios de aceptación
- `vue-tsc` ok; tipos exportados intactos (`PresupuestoDocData`/`PresupuestoDocLine`).
- Documento idéntico en pantalla **y en el PDF de Puppeteer** (revisar `PublicPresupuestoView`).
- Sin `money()`/`niceDate()` locales.

## Riesgos / notas
- **PDF/Puppeteer:** el HTML público debe verse igual; verificar que las utilidades Tailwind se incluyan en el bundle que sirve la ruta pública. Probar la generación de PDF tras migrar.
- Consolidar fechas con cuidado: hay dos formatos distintos en uso.
