# Fonts

## Active family — Onest

[Onest](https://fonts.google.com/specimen/Onest) (Google Fonts), weights **400 / 500 / 600 / 700**.

Loaded via `@import` at the top of `colors_and_type.css`:

```css
@import url("https://fonts.googleapis.com/css2?family=Onest:wght@400;500;600;700&display=swap");
```

## 🚩 Substitution flag

No specific font was named in the brief — only "clean modern sans-serif, heading weight 500." **Onest is a designer's choice**, picked because:

- It's modern and current (released 2023), not overexposed like Inter or Roboto.
- It has excellent weight differentiation at 400 vs 500 — important since our headings rely on weight 500 (not 700) to carry hierarchy.
- It has true tabular numerals (we use them for currency in tables).
- Its mild geometric warmth pairs nicely with the playful MemyDeni wordmark without competing with it.

**If MemyDeni already has a brand font**, drop the file into this folder and change one line in `colors_and_type.css`:

```css
--font-sans: "Your Font Here", ui-sans-serif, system-ui, sans-serif;
```

Heading colors / weights / spacing tokens will pick up automatically.

## Self-hosting (optional)

For offline / production use, download the variable font from Google Fonts and place it here as `Onest.woff2`, then replace the `@import` with:

```css
@font-face {
  font-family: "Onest";
  src: url("./fonts/Onest.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap;
}
```
