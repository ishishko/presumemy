---
name: presumemi-design
description: Use this skill to generate well-branded interfaces and assets for Presumemi (microERP for MemyDeni — artisan paper goods for parties & events), either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files. It documents:
- Brand context & content fundamentals (Spanish, tú, sentence case, no emoji in UI)
- Visual foundations (industrial-paper aesthetic, hairline borders, no gradients)
- Color tokens with strict semantic roles (violet=headings/sidebar, teal=interactive, coral=danger-only, pastels=backgrounds-only)
- Type system (Onest, headings weight 500, body 14px)
- Spacing (4pt grid), radii (8/12), elevation (very light shadows)
- Logo usage rules (MemyDeni wordmark — never alter)
- Iconography (Lucide via CDN)

Key files:
- `colors_and_type.css` — drop-in CSS variables for color/type/spacing/radii. Import this in any artifact you build.
- `assets/memydeni-logo.png` — transparent-background wordmark.
- `preview/*.html` — small spec cards showing each token group in use.
- `ui_kits/presumemi/` — full React UI kit (click-through prototype) covering sidebar/topbar/cards/tables/forms/badges/alerts/drawer/login.

If creating visual artifacts (slides, mocks, throwaway prototypes), copy `colors_and_type.css` and the logo out, then build static HTML files that link the stylesheet. For UI work, lift components from `ui_kits/presumemi/` (well-factored JSX in small files) and adapt as needed.

If working on production code, copy the CSS variables into your tokens layer and use this skill's components as visual reference.

If the user invokes this skill without other guidance, ask what they want to build (a new screen, a quote PDF template, a marketing landing, an email, etc.), ask a few clarifying questions (Spanish vs bilingual? mobile or desktop? variations or single direction?), and act as an expert designer outputting HTML artifacts or production code, depending on the need.
