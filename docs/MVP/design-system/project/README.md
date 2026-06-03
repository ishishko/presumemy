# Presumemi Design System

A **microERP** for **MemyDeni** — an artisan business making paper goods for parties and events.
Presumemi manages presupuestos (quotes), product catalog, supplies inventory, and finances.

The brand has two layers in tension, which is the system's defining idea:

| Layer | Character | Used for |
|---|---|---|
| **MemyDeni wordmark** | playful, hand-drawn, festive | logo placements only — never recreated, never altered |
| **Presumemi UI** | minimalist industrial, generous whitespace, calm | every screen of the app |

The logo carries all the warmth; the UI stays out of the way so a working artisan can find a quote, send an invoice, or check stock in seconds.

---

## Sources provided

| Source | Path / link | Notes |
|---|---|---|
| MemyDeni logo | `uploads/memydeni.jpg` → `assets/memydeni-logo.{jpg,png}` | Bitmap wordmark, 494×77. Background removed for `.png` version. **Do not alter colors or proportions.** |
| Brand brief | inline in chat (palette, type, spacing, voice) | Single source of truth for color roles. |

No codebase, Figma file, or existing screens were provided — the UI is built fresh against the brief, not reverse-engineered from production.

---

## Index — files in this system

```
README.md              ← you are here
SKILL.md               ← agent skill manifest (drop into Claude Code)
colors_and_type.css    ← all color / type / spacing / radius tokens

assets/
  memydeni-logo.jpg    ← original
  memydeni-logo.png    ← transparent-background version (use on light surfaces)

fonts/
  README.md            ← Onest is loaded from Google Fonts; see notes

preview/               ← Design System tab cards (registered as assets)
  colors-brand.html
  colors-neutrals.html
  colors-pastels.html
  type-scale.html
  type-headings.html
  type-body.html
  spacing.html
  radii.html
  shadows.html
  buttons.html
  inputs.html
  badges.html
  cards.html
  alerts.html
  table.html
  logo-usage.html

ui_kits/
  presumemi/           ← the microERP UI kit
    README.md
    index.html         ← interactive click-through prototype
    *.jsx              ← components (Sidebar, Topbar, Table, etc.)
```

---

## CONTENT FUNDAMENTALS

**Language.** Spanish (es-MX / neutral Latin American). All UI strings, button labels, table headers, empty states.

**Voice.** Direct, useful, no fluff. The user is a busy artisan or small-business owner — every word should help them do the next thing. Think *"clear coworker"*, not *"chirpy assistant"* and not *"corporate"*.

**Person.** Address the user as **tú** — not *usted*, not *vos*. Personal but respectful. Use **first-person plural ("guardamos tus cambios")** when the system acts on behalf of the user.

**Casing.**
- **Sentence case** for everything: buttons, menu items, page titles, table headers.
  ✅ `Nuevo presupuesto` ✅ `Agregar producto` ❌ `Nuevo Presupuesto` ❌ `NUEVO PRESUPUESTO`
- **ALL CAPS, tracked +6%** only for tiny section eyebrows (`h6` style, ≤12px) and table column headers when a label needs to feel quieter than its data.

**Punctuation.**
- No trailing periods on buttons, menu items, table cells, or labels.
- Periods inside body copy, alert messages, and tooltips that are full sentences.
- Use Spanish quotation marks «like this» for proper quotes; straight `"` is fine in code/value fields.
- Currency: `$ 1,250.00 MXN` — peso sign, thin gap, two decimals, trailing currency code on financial views; drop the `MXN` in dense tables.

**Numbers.** Tabular-numeric (`font-variant-numeric: tabular-nums`) everywhere a column of numbers appears. Decimal comma is acceptable per locale, but be consistent within a screen.

**Emoji.** **No emoji in product UI.** The logo carries all the playfulness — emoji on top would feel redundant and unprofessional in a finance context. Acceptable only in: user-generated content (notes a user types into a presupuesto), and onboarding/empty-state illustrations where used sparingly.

**Examples — tone in the wild**

| Context | ✅ Yes | ❌ No |
|---|---|---|
| Empty state, presupuestos | "Aún no tienes presupuestos. Crea el primero para empezar a cotizar." | "¡Wow, está vacío! 🎉 ¡Crea tu primer presupuesto y arrancamos esta fiesta!" |
| Delete confirmation | "Eliminar este insumo. Esta acción no se puede deshacer." | "¿Seguro que quieres borrar esto? 😢" |
| Success toast | "Presupuesto enviado a Marisol." | "¡Éxito! Tu presupuesto fue enviado correctamente al cliente." |
| Error | "No pudimos guardar. Revisa tu conexión e intenta de nuevo." | "Algo salió mal. Inténtalo más tarde." |
| Button | `Guardar cambios` · `Enviar presupuesto` · `Agregar línea` | `¡Guardar!` · `Submit` · `Click aquí` |

---

## VISUAL FOUNDATIONS

**The big idea.** *Industrial paper goods.* Lots of warm white, hairline rules, calm type, and a single saturated violet that anchors every screen. Color enters through small, deliberate moments — a teal CTA, a lavender chip, a coral alert — never through gradients or decoration.

### Color
- **Violet `#8B2570`** is the brand axis: every heading, every active border, the sidebar background. **White on violet, always.**
- **Teal `#75CCCE`** is the *interactive* signal — primary CTAs, links, focused fields. If a user can click it, it's teal. White text on teal-filled buttons.
- **Coral `#EA5F3C`** is reserved for *destructive* and *error*. Never a brand accent. Seeing coral should mean "stop and read".
- **Pastels** (lavender, mint, pink-soft, yellow) live on *backgrounds and fills only* — tag pills, success banners, warning rows. Never as text color. Yellow always pairs with the dark `#7A5D00` text override; the others use `--ink`.
- No gradients, anywhere. No multi-stop fades. Flat fills are the language.

### Type
- **Onest** — single family, weights 400 / 500 / 600 / 700. (Substitution flag: see `fonts/README.md` — pick a different family by swapping the `--font-sans` variable.)
- Headings always **500, violet, -0.01em tracking.** Body always **400, `--ink`, 1.5 line-height**.
- Minimum size **12px** anywhere on screen. Body default **14px**.
- WCAG AA contrast minimum, verified for every color pairing in `preview/colors-*.html`.

### Spacing & layout
- **4pt grid.** All spacing tokens are multiples of 4. Use `--s-*` vars — never raw pixels.
- **Generous whitespace.** Standard card padding is `--s-6` (24px). Standard page gutter is `--s-8` (32px).
- **Fixed sidebar** (240px) on desktop ERP screens. Topbar fixed at 56px. Main content scrolls.
- Tables breathe: `--s-3` vertical row padding minimum, `--s-4` horizontal cell padding.

### Borders, surfaces, elevation
- **Hairline borders.** `1px solid var(--border)` — the variable is a `rgba(28,26,30,0.10)` so it reads as a true 0.5px-feel hairline on retina.
- **Cards:** white surface, `--r-lg` (12px) radius, `--shadow-1` (almost imperceptible), hairline border. Highlighted cards swap background to `--lavender` and drop the border.
- **No heavy shadows.** Maximum is `--shadow-pop` for floating menus and modals.
- Buttons and inputs use `--r-md` (8px). Pills/tags use `--r-pill`.

### Backgrounds
- No images, no patterns, no textures in chrome. The page is `--page-bg` (`#F7F5F3`, a warm off-white) and that's it.
- The MemyDeni wordmark is the **only** decorative imagery the system ships — used in: login screen, marketing landing hero, sidebar header (small, ~120px wide). Always on a white or off-white surface so its hand-crafted colors stay legible. Never on violet, never tinted, never recolored.

### Hover, focus, press
- **Hover** on solid buttons: darken fill by ~6% (we use a `filter: brightness(0.94)`).
- **Hover** on ghost/text buttons: fill with a tinted `--violet-50` / `--teal-50`.
- **Hover** on table rows: `--page-bg` fill.
- **Focus**: 3px teal ring (`--focus-ring`), no outline shift. Coral ring on destructive controls.
- **Press**: `transform: translateY(1px)` or `filter: brightness(0.9)`. Never a different color.
- **Disabled**: 50% opacity, no pointer events. Never grey-fill.

### Animation
- Short, mechanical. **120ms** for hovers (`ease`). **180ms** for menu/popover enter (`cubic-bezier(0.2, 0.8, 0.2, 1)`). **No bounces, no spring physics, no scale-in flourishes.** This is a working tool, not a party (the logo is the party).
- Page transitions: none. Route changes are instant.

### Iconography
- See `ICONOGRAPHY` section below.

### Imagery rules
- The brand only ships one image asset (the MemyDeni wordmark). When other imagery is needed (product photos in the catalog, user avatars), it should be:
  - Square or 4:3, no rounded corners larger than `--r-md`.
  - Warm-leaning color (the brand bias). Avoid blue-cast photography.
  - No filters, no overlays, no duotones. Just the photo.

### Transparency & blur
- Used sparingly. Modal backdrop is `rgba(28,26,30,0.40)` with no blur. Sticky table headers get a `backdrop-filter: blur(8px)` over a `rgba(255,255,255,0.85)` fill — that's the only place blur appears.

### What we explicitly avoid
- Bluish-purple gradients · emoji-heavy UI · cards with colored-left-border-only · drop shadows you can see from across the room · neumorphism · glass cards · skeuomorphic anything · auto-generated illustrations · stock photos of "happy office workers".

---

## ICONOGRAPHY

**System chosen:** **Lucide** (CDN: `https://unpkg.com/lucide@latest`). 1.5px stroke, rounded line caps, currentColor.

**Why.** No icons were provided in the brief. Lucide is the cleanest free open-source set, stroke-based (matches our hairline-border aesthetic), and consistent — there is one icon for each concept and they all look like siblings. The 1.5px stroke complements Onest's medium weights without overpowering them.

**🚩 Flag — substitution made.** No icon set was specified or provided. Lucide is a reasonable default; if MemyDeni has a preferred set (e.g. a custom hand-drawn set that matches the logo), please share it and we will swap.

**Usage rules**
- Icons inherit `currentColor`. Never set a hard color on an `<svg>`; set it on the parent.
- Sizes: **16px** in dense UI (buttons, table actions, menu items), **20px** in headers, **24px** for sidebar nav. Never larger than 32px in chrome.
- Always paired with a label or `aria-label`. Icon-only buttons must have a tooltip.
- Stroke icons only. **No emoji** as icons. **No filled icon variants** — mixing fill + stroke breaks the visual rhythm.

**Logo asset**
- `assets/memydeni-logo.png` — transparent background, use on light surfaces.
- `assets/memydeni-logo.jpg` — original with white background.
- Minimum width on screen: 96px. Recommended in app sidebar: 120px. Recommended in login hero: 320px.
- Clear space around the logo: equal to the height of one letter (~25% of logo height) on all sides.

---

See `ui_kits/presumemi/README.md` for the high-fidelity UI kit and click-through prototype.
