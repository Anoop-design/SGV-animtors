# Animation Customization Design Document

This document outlines the design for animation customization in Icon Motion, covering both global preset customization and per-layer overrides.

---

## Current State vs Proposed State

### Current Problems

1. **Generic controls** - Duration, easing, stagger apply to all presets regardless of relevance
2. **Disconnected feeling** - Controls don't feel tied to the selected preset
3. **Overwhelming** - Too many options that don't make sense together
4. **No per-layer control** - All layers animate identically

### Proposed Solution

**Two-tier customization:**

1. **Tier 1: Opinionated Presets** - Each preset has its own specific tweaks
2. **Tier 2: Per-Layer Overrides** - Advanced users can customize individual layers

---

## Tier 1: Opinionated Preset System

### Core Principles

1. **Presets are opinionated** - They come with sensible defaults
2. **Preset-specific controls** - Only show controls relevant to the preset
3. **Simplified vocabulary** - Use "Speed" and "Intensity" instead of raw values
4. **Trigger always available** - Auto, Hover, Click work for all presets

### Preset Definitions

#### Draw Preset

| Property | Label | Range | Default | Description |
|----------|-------|-------|---------|-------------|
| speed | Speed | 0.3x - 2x | 1x | How fast the stroke draws |
| stagger | Stagger | 0 - 0.5s | 0.1s | Delay between layers |

**Internal defaults (not exposed):**
- Easing: `linear` (always)
- Direction: forward

```typescript
const drawPreset = {
  name: 'Draw',
  icon: 'pencil',
  description: 'Stroke draws on progressively',
  
  defaults: {
    baseDuration: 0.8,
    easing: 'linear',
  },
  
  tweakable: {
    speed: { label: 'Speed', type: 'slider', min: 0.3, max: 2, default: 1, step: 0.1 },
    stagger: { label: 'Stagger', type: 'slider', min: 0, max: 0.5, default: 0.1, step: 0.05, unit: 's' },
  },
};
```

---

#### Pop Preset

| Property | Label | Range | Default | Description |
|----------|-------|-------|---------|-------------|
| speed | Speed | 0.3x - 2x | 1x | How fast the pop animation |
| intensity | Bounce | 0.5 - 1.5 | 1 | How bouncy (spring overshoot) |
| stagger | Stagger | 0 - 0.5s | 0.1s | Delay between layers |

**Internal defaults (not exposed):**
- Easing: `spring` with stiffness 300, damping based on intensity
- Scale: 0 → 1

```typescript
const popPreset = {
  name: 'Pop',
  icon: 'circle',
  description: 'Scales up with a spring bounce',
  
  defaults: {
    baseDuration: 0.5,
    easing: 'spring',
    springStiffness: 300,
    springDamping: 10,  // Modified by intensity
  },
  
  tweakable: {
    speed: { label: 'Speed', type: 'slider', min: 0.3, max: 2, default: 1, step: 0.1 },
    intensity: { label: 'Bounce', type: 'slider', min: 0.5, max: 1.5, default: 1, step: 0.1 },
    stagger: { label: 'Stagger', type: 'slider', min: 0, max: 0.5, default: 0.1, step: 0.05, unit: 's' },
  },
};
```

---

#### Wiggle Preset

| Property | Label | Range | Default | Description |
|----------|-------|-------|---------|-------------|
| speed | Speed | 0.3x - 2x | 1x | How fast the wiggle |
| intensity | Intensity | 0.3 - 2 | 1 | How much it rotates (angle) |
| stagger | Stagger | 0 - 0.5s | 0.05s | Delay between layers |

**Internal defaults (not exposed):**
- Easing: `easeInOut`
- Base angle: 10° (multiplied by intensity)
- Pattern: `[0, -angle, angle, -angle, 0]`

```typescript
const wigglePreset = {
  name: 'Wiggle',
  icon: 'activity',
  description: 'Shakes back and forth',
  
  defaults: {
    baseDuration: 0.4,
    easing: 'easeInOut',
    baseAngle: 10,  // Multiplied by intensity
  },
  
  tweakable: {
    speed: { label: 'Speed', type: 'slider', min: 0.3, max: 2, default: 1, step: 0.1 },
    intensity: { label: 'Intensity', type: 'slider', min: 0.3, max: 2, default: 1, step: 0.1 },
    stagger: { label: 'Stagger', type: 'slider', min: 0, max: 0.5, default: 0.05, step: 0.05, unit: 's' },
  },
};
```

---

#### Bounce Preset

| Property | Label | Range | Default | Description |
|----------|-------|-------|---------|-------------|
| speed | Speed | 0.3x - 2x | 1x | How fast the bounce |
| height | Height | 5 - 30px | 10px | How far it bounces from |
| intensity | Bounce | 0.5 - 1.5 | 1 | Spring bounciness |
| stagger | Stagger | 0 - 0.5s | 0.1s | Delay between layers |

**Internal defaults (not exposed):**
- Easing: `spring` with stiffness 400
- Scale: 0.8 → 1
- Y offset: based on height

```typescript
const bouncePreset = {
  name: 'Bounce',
  icon: 'chevrons-up',
  description: 'Springs up from below',
  
  defaults: {
    baseDuration: 0.6,
    easing: 'spring',
    springStiffness: 400,
    baseYOffset: 10,
    baseScale: 0.8,
  },
  
  tweakable: {
    speed: { label: 'Speed', type: 'slider', min: 0.3, max: 2, default: 1, step: 0.1 },
    height: { label: 'Height', type: 'slider', min: 5, max: 30, default: 10, step: 1, unit: 'px' },
    intensity: { label: 'Bounce', type: 'slider', min: 0.5, max: 1.5, default: 1, step: 0.1 },
    stagger: { label: 'Stagger', type: 'slider', min: 0, max: 0.5, default: 0.1, step: 0.05, unit: 's' },
  },
};
```

---

### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ANIMATION                                                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Presets:                                                       │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐                   │
│  │ Draw │ │ Pop  │ │Wiggle│ │Bounce│ │ None │                   │
│  │  ●   │ │      │ │      │ │      │ │      │                   │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘                   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Speed ──────────── [ ──●────────── ] 1.0x                      │
│  Stagger ─────────── [ ──●────────── ] 0.1s                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Trigger ────────── [ Auto (on load) ▼ ]                        │
│  Order ──────────── [ Forward ▼ ]                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

When "Pop" is selected, the controls change to show "Bounce" slider:

```
│  Speed ──────────── [ ──●────────── ] 1.0x                      │
│  Bounce ─────────── [ ────●──────── ] 1.0                       │
│  Stagger ─────────── [ ──●────────── ] 0.1s                     │
```

---

### Stagger Order Options

| Option | Description | Use Case |
|--------|-------------|----------|
| Forward | 1 → 2 → 3 → 4 | Natural left-to-right |
| Reverse | 4 → 3 → 2 → 1 | Dramatic reveal |
| Center Out | Middle → edges | Explosion effect |
| Random | Shuffled order | Playful/organic |
| All at Once | No stagger | Synchronized |

---

## Tier 2: Per-Layer Overrides

### When to Use

Per-layer overrides are for advanced users who want:
- One layer to stand out (more bounce, faster animation)
- Fine control over specific paths
- Creative effects not possible with global settings

### Data Structure

```typescript
// Layer override interface
interface LayerOverride {
  // Override from global preset values
  speed?: number;        // Override speed multiplier
  intensity?: number;    // Override intensity
  stagger?: number;      // Override stagger delay
  
  // Preset-specific overrides
  yOffset?: number;      // For bounce: custom y offset
  angle?: number;        // For wiggle: custom rotation angle
  springDamping?: number; // For pop/bounce: spring damping
  
  // Meta
  enabled: boolean;      // Whether override is active
}

// Extended ParsedPath
interface ParsedPath {
  id: string;
  d: string;
  // ... existing fields
  override?: LayerOverride;
}
```

### UI: Two Approaches

#### Approach A: Inline in Layer List

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYERS                                                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ▸ Layer 1: Path                     [●] Global                 │
│  ▸ Layer 2: Circle                   [●] Global                 │
│  ▾ Layer 3: Star                     [ ] Global ← Has override  │
│    ├── Speed ────── [ ────●── ] 0.5x                            │
│    ├── Bounce ───── [ ──────●] 1.5                              │
│    └── [Reset to Global]                                        │
│  ▸ Layer 4: Rectangle                [●] Global                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

#### Approach B: Separate Panel (on layer selection)

```
┌──────────────────────────────────┐ ┌────────────────────────────┐
│ LAYERS                           │ │ LAYER SETTINGS             │
├──────────────────────────────────┤ ├────────────────────────────┤
│                                  │ │                            │
│  Layer 1: Path                   │ │ Selected: Layer 3 (Star)   │
│  Layer 2: Circle                 │ │                            │
│  Layer 3: Star      ← selected   │ │ [●] Use Global Settings    │
│  Layer 4: Rectangle              │ │ [ ] Custom for this layer  │
│                                  │ │                            │
│                                  │ │ ─────────────────────────  │
│                                  │ │                            │
│                                  │ │ Speed ──── [ ●─── ] 0.5x   │
│                                  │ │ Bounce ─── [ ──●─ ] 1.5    │
│                                  │ │                            │
│                                  │ │ [Reset to Global]          │
│                                  │ │                            │
└──────────────────────────────────┘ └────────────────────────────┘
```

### How Overrides Are Applied

```typescript
function getPathVariants(
  recipe: AnimationRecipe,
  pathIndex: number,
  override?: LayerOverride
): Variants {
  // 1. Start with preset defaults
  const preset = PRESET_DEFINITIONS[recipe.preset];
  
  // 2. Apply global tweaks
  let speed = recipe.speed ?? 1;
  let intensity = recipe.intensity ?? 1;
  let stagger = recipe.stagger ?? 0.1;
  
  // 3. Apply layer override if exists
  if (override?.enabled) {
    speed = override.speed ?? speed;
    intensity = override.intensity ?? intensity;
    stagger = override.stagger ?? stagger;
  }
  
  // 4. Calculate final values
  const duration = preset.defaults.baseDuration / speed;
  const delay = pathIndex * stagger;
  
  // 5. Build and return variants
  return buildVariants(recipe.preset, { duration, delay, intensity, ...override });
}
```

### Visual Indicator for Overridden Layers

In the preview, layers with overrides could have a subtle visual hint:
- Different colored outline when hovered
- Small badge/dot indicator in layer list
- Different animation timing visible in preview

---

## Implementation Complexity

### Tier 1: Opinionated Presets

| Task | Complexity | Effort |
|------|------------|--------|
| Define preset configurations | Low | 2h |
| Update AnimationRecipe type | Low | 1h |
| Update getPathVariants | Medium | 3h |
| Create preset-specific UI controls | Medium | 4h |
| Add stagger order options | Low | 2h |
| Testing | Medium | 2h |
| **Total** | | **~14h** |

### Tier 2: Per-Layer Overrides

| Task | Complexity | Effort |
|------|------------|--------|
| Define LayerOverride type | Low | 1h |
| Add override to ParsedPath | Low | 1h |
| Layer selection state | Low | 1h |
| Override merge logic | Medium | 2h |
| Override UI (either approach) | High | 5h |
| Persistence/storage | Medium | 2h |
| Export code generation | Medium | 3h |
| Testing | Medium | 2h |
| **Total** | | **~17h** |

---

## Recommendations

### Phase 1: Opinionated Presets (Priority: High)
- Implement Tier 1 fully
- Clean up existing UI to be preset-driven
- Add stagger order options
- Remove generic controls that don't make sense

### Phase 2: Per-Layer Overrides (Priority: Medium)
- Add as "Advanced" feature
- Use Approach B (separate panel)
- Only expose most useful overrides per preset

### Future Considerations
- Preset library/sharing
- Custom preset creation
- Animation curves editor (for power users)

---

*Document Version: 1.0*
*Created: December 21, 2024*
