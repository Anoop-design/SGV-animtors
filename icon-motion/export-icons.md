

# Export Plan (Icon Motion)

This doc captures the export approach we discussed: once a user finalizes an animation in the editor, they should be able to export a **developer-ready** icon component in a few formats, with the same behavior they previewed.

## Export goals

- **Zero-surprise handoff**: exported result should match preview.
- **Designer-first**: one click copy-paste output.
- **Dev-friendly**: clean code, minimal runtime logic, no editor-only reset hacks.
- **Scales to teams**: supports share links and saved presets later.

---

## Export formats (V1)

### 1) React + Framer Motion (primary)
- Output: a `.tsx` component that renders the SVG using `motion.*` elements.
- Includes:
  - `initial` and `animate`
  - `transition`
  - `stagger` sequencing (container `variants` + `staggerChildren`)
  - trigger mapping:
    - Auto → `initial` + `animate`
    - Hover → `whileHover`
    - Click → `whileTap` (or controlled state option later)
- Optional: props for `size`, `className`, `style`, `color`.

### 2) Plain React (no motion) + CSS (secondary)
- Output: `.tsx` + `.css` for teams that don’t use Framer Motion.
- Only for animations representable in CSS transforms + keyframes.
- Triggers:
  - Auto → CSS animation on mount
  - Hover → `:hover`
  - Click → `:active` (limited)

### 3) Vanilla HTML + CSS snippet (secondary)
- Output: HTML `<svg>` + CSS keyframes.
- Useful for quick prototypes or docs.

---

## What gets exported (data)

Exports are generated from the finalized motion model:
- `MotionRecipe` (curated preset) applied to:
  - global base motion
  - any layer overrides
- Global settings:
  - timing (duration, delay, ease/spring)
  - stagger (amount + pattern)
  - trigger type
- Layer settings:
  - per-layer overrides (only properties the user changed)
  - layer visibility

Export should not depend on editor UI state.

---

## React + Framer Motion export mapping

### Structure
- A single exported component, e.g. `export function IconName(props) { ... }`.
- A root `<motion.svg>` wrapper used for:
  - grouping
  - optional trigger props (`whileHover`, `whileTap`)
  - stagger container variants
- Each path/layer is a `motion.path` (or `motion.g` when needed).

### Stagger
- Compute layer order based on stagger pattern:
  - forward, reverse, from-center, random
- Use `variants` at the root + children.
- Prefer `staggerChildren` + `delayChildren` instead of manually applying delay to every child.

### Trigger mapping
- Auto
  - Root: `initial="initial" animate="animate"`
- Hover
  - Root: `initial="initial" whileHover="animate"`
  - Optional later: allow `whileHover` + `animate` if user wants auto+hover
- Click
  - Root: `initial="initial" whileTap="animate"`
  - Optional later: click toggle uses internal state + `animate={isOn ? "animate" : "initial"}`

### Transition mapping
- Duration / delay / ease
- Spring params when `ease === "spring"`

---

## UX in the product (Export panel)

### Export panel sections
1) **Format**
   - React + Framer Motion (recommended)
   - React + CSS
   - HTML + CSS

2) **Options**
   - Component name
   - Include `size` prop
   - Include `className` and `style` props
   - Preserve original SVG `viewBox`
   - Flatten groups (optional)

3) **Output**
   - Code editor block
   - Copy button
   - Download button (`.tsx`, `.css`)

---

## Share link (V2)

We discussed adding a share link so dev teams can open and copy code.

- Persist the finalized animation config (SVG + MotionRecipe + overrides) to backend.
- URL: `/share/[id]`
- Share page includes:
  - live preview
  - export panel with the same formats
  - version info

---

## Non-goals (for now)

- No SVG path morphing exports in V1.
- No timeline editor exports.
- No runtime dependency injection beyond Framer Motion for the primary format.

---

## QA checklist

- Exported React component matches preview visually.
- Hover/click triggers behave as in preview.
- Stagger patterns match preview ordering.
- Code is deterministic (random uses seed).
- No remount/reset hacks present in output.