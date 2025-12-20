# Transform Panel Plan

This document defines the UI and behavior plan for the **Transform** panel (Milestone 2: Transform Choreography).

Goals
- Make curated motion the default path for users (designer friendly).
- Support triggers (auto, hover, click) with predictable playback.
- Keep a clean override model: **Global base** + **Layer overrides**.
- Ensure everything maps cleanly to `MotionRecipe` and exports.

---

## Information Architecture

### A. Preview Controls
- Play / Pause
- Restart
- Loop toggle
- Optional later: scrubber

### B. Curated Motion Presets (Transform-only)
Replace current **Effect** section with:
- **Curated preset** dropdown
  - Pop
  - Reveal
  - Bounce In
  - Slide In
  - Float Loop
- Short description line (1 sentence) for the selected preset
- Apply buttons
  - **Apply to all paths**
  - **Apply to selected paths**
- Apply mode (optional, but recommended)
  - Replace (overwrites selected properties)
  - Layer (adds on top of current settings)

Notes
- Curated presets should set defaults for: initial/animate transform values, easing, duration, stagger (where relevant), loop, and trigger.
- Users can tweak after applying.

### C. Layers
- List of layers (paths/groups)
- Add indicators (new)
  - **Modified** badge for layers that differ from global
  - Eye toggle (existing) remains
  - Optional later: multi-select (shift/cmd)

### D. Stagger (new, global)
Controls
- Stagger amount (seconds)
- Pattern
  - Forward
  - Reverse
  - From center
  - Random
- Random seed (only when Random)

Behavior
- Applies to sequencing across visible paths.
- Per-layer delay is still allowed, but stagger should be the primary “choreography” control.

### E. Timing
Existing controls
- Duration
- Delay
- Easing

Additions
- If easing is **Spring**:
  - Stiffness
  - Damping
  - Mass (optional)

Note: Transition fields should map 1:1 to Framer Motion `transition` where possible (duration, delay, ease, spring params).

### F. Animation
Existing
- Direction: In | Out

Add
- Trigger dropdown (global)
  - Auto (plays immediately)
  - Hover
  - Click

Trigger options (new)
- Hover
  - Play once vs replay on every hover
  - Optional later: Out on hover leave
- Click
  - Toggle In/Out vs play once
- Auto
  - Optional: start delay (separate from layer delay)

### G. Global Motion (Base)
Rename section to explicitly indicate base behavior:
- **Global Motion (Base)**
  - Applies to all paths as base initial → final

Controls (keep)
- Scale (from → to)
- Rotate (from → to)
- Move X (from → to)
- Move Y (from → to)
- Opacity (from → to)
- Rotate X (from → to)
- Rotate Y (from → to)
- Scale X (from → to)
- Scale Y (from → to)

Advanced (keep + clarify)
- Transform Origin (X/Y) with visual presets (Center, Top, Bottom, Left, Right)
- Transform Perspective (optional)
- Skew X / Skew Y
- Origin X (preset)
- Origin Y (preset)

Suggested UX improvements
- Link toggles
  - Link Scale X/Y
  - Optional: link Move X/Y
- Disable unsupported fields for the selected layer type (for example, some SVG elements may not support all properties).

### H. Layer Editor (per layer)
When opening a layer:
- Show layer name + thumbnail preview (existing)
- Same blocks as global (Timing, Animation, Transform)

Add override helpers (new)
- **Reset to global** (for each section and/or all)
- **Reset to default**
- Show small “Overriding global” hint when values differ

---

## Behavior Rules

### 1) Override model
- Global settings define the base `initial` and `animate` states.
- A layer override only changes the properties the user edits.
- Merging rule: `finalLayer = merge(global, layerOverride)` with layer taking precedence.

### 2) Triggers
Implementation should avoid remounting to reset animation.
- Use Framer Motion animation controls to `.start()` and manage state.
- Export code should remain minimal:
  - Hover → `whileHover`
  - Click → `whileTap` (or controlled state for toggle)
  - Auto → `animate` / `initial`

### 3) Direction
- In = Initial → Final
- Out = Final → Initial
- For toggle triggers, Direction maps to the currently selected “target state”.

---

## Curated Preset Expectations

Each curated preset should define:
- category: draw | transform | loop
- initial + animate states
- transition (duration/ease or spring)
- stagger defaults (when multi-path)
- loop (when applicable)
- trigger default = Auto

Recommended curated defaults
- Pop: opacity 0 → 1, scale 0.9 → 1, spring
- Reveal: opacity 0 → 1, y 6 → 0, easeOut
- Bounce In: opacity 0 → 1, scale 0.8 → 1, stronger spring
- Slide In: opacity 0 → 1, x -20 → 0, easeOut
- Float Loop: y 0 → -4, easeInOut, ping-pong

---

## QA Checklist

- Curated presets apply correctly to all paths and selected paths.
- Stagger patterns behave as expected (especially From center and Random).
- Trigger behaviors work in preview (hover, click, auto).
- Layer overrides do not break global changes.
- Exports reproduce trigger behavior and transforms.

---

## Implementation Map (files)

- `types.ts`
  - Add/confirm `MotionRecipe`, `StaggerConfig`, `MotionTrigger`, motion state + transition structures.
- `ControlsPanel.tsx`
  - Add Curated Animations section
  - Add Stagger block
  - Add Trigger options block
  - Add preview controls
  - Add modified indicators in Layers list
- `LayerEditor.tsx` (or current per-layer editor component)
  - Add Reset to global / default
  - Add override hints
- `Preview.tsx`
  - Trigger handling using animation controls
  - Respect stagger sequencing
- `generate-export.ts`
  - Map trigger types to export patterns
  - Include transform + timing + stagger values