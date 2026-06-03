# Presumemi — microERP UI Kit

Click-through prototype of the Presumemi microERP for MemyDeni. Built strictly against the brand brief (no production code was provided).

## Run
Open `index.html`. It's a single-page React prototype (Babel-transpiled in-browser, no build step).

## Architecture

```
index.html         ← loads colors/type tokens + this kit's styles, then the scripts in order
styles.css         ← app-shell + component styles, on top of ../../colors_and_type.css
icons.jsx          ← inline Lucide-style icon set (one default export object `I`)
data.jsx           ← demo data: clients, products, presupuestos, insumos
shell.jsx          ← Sidebar, Topbar, PageHead, Card, Badge, Toast
dashboard.jsx      ← DashboardScreen + BarChart
screens.jsx        ← Presupuestos / Catálogo / Insumos / Finanzas / Clientes screens
drawer.jsx         ← PresupuestoDrawer (editor) + LoginScreen
app.jsx            ← App router + mount
```

Each `.jsx` file `Object.assign(window, …)`s its exports so the next script sees them — load order matters and is fixed in `index.html`.

## Screens covered (all interactive)
- **Inicio (Dashboard)** — KPIs, recent presupuestos, low-stock insumos, weekly bar chart.
- **Presupuestos** — filterable list, click a row to open the editor drawer.
- **Catálogo** — product grid with category filter.
- **Insumos** — stock table with severity bars + badges.
- **Finanzas** — month KPIs + movements ledger.
- **Clientes** — customer list with avatars + tags.
- **Drawer: Presupuesto editor** — add/remove line items, live totals (subtotal + IVA 16%), draft / send actions.
- **Login** — minimal email + password, MemyDeni logo, `Presumemi` wordmark.

## Click-through happy path
1. App opens on the dashboard.
2. Click **Nuevo presupuesto** (top right) → drawer opens with one empty line.
3. Add a couple of products, type a client name, click **Enviar** → toast confirms, drawer closes.
4. Jump to **Finanzas** to see the same money formatting + IVA model.
5. Top-right of the sidebar foot: log-out icon → returns to the login screen.

## What's intentionally fake
- All data is hard-coded in `data.jsx` — no persistence between reloads.
- Filter chips on the presupuestos list filter the demo set; search input is decorative.
- The "Ajustes" route is a placeholder.

## Visual rules applied
- Sidebar: violet `#8B2570`, white text only.
- All headings: Onest 500, violet.
- Primary CTA: teal `#75CCCE` filled, white text.
- Destructive: coral `#EA5F3C` filled (delete icon in line items is muted to avoid over-coloring rows).
- No gradients. No shadows beyond `--shadow-1/2/pop`. Hairline borders everywhere.
- Pastels only as fills: lavender for highlighted KPI + tags, mint for paid/success, yellow for pending/warning (+ dark text override), coral-50 for vencido, pink-soft for "enviado".
