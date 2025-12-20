# New Preview Component - Design Specification

> A simplified, designer-friendly preview system for Icon Motion.

---

## Overview

The new preview system replaces the complex timeline-based approach with a simpler, more intuitive design optimized for icon animations (typically 0.3s - 1s).

### Design Philosophy

| Old Approach | New Approach |
|--------------|--------------|
| Timeline with scrubbing | Interactive trigger-based |
| Timecode display | Simple replay button |
| Multiple timeline tracks | Single large preview |
| Keyframe markers | Instant slider feedback |

**Core Principle:** Icon animations are micro-interactions. The preview should feel like using the actual icon, not editing a video.

---

## Layout Structure

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │  SIZE STRIP              16  24  32  [48]  64  96            │  │
│  │  Background                                   [● ○ ○ ○]      │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                                                               │  │
│  │                                                               │  │
│  │                     PRIMARY PREVIEW                           │  │
│  │                    (Large, Interactive)                       │  │
│  │                                                               │  │
│  │                         ┌─────┐                               │  │
│  │                         │     │                               │  │
│  │                         │ 48  │  ← Selected size              │  │
│  │                         │     │                               │  │
│  │                         └─────┘                               │  │
│  │                                                               │  │
│  │                    Hover to animate                           │  │
│  │                                                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │                   PLAYBACK CONTROLS                           │  │
│  │          ↻ Replay              🐌 Speed [1x ▼]               │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Layout Order (Top to Bottom):**
1. **Top Bar** - Size strip + Background switcher (side by side)
2. **Preview Canvas** - Large, clean, main focus
3. **Playback Controls** - Replay button, Speed selector

This keeps preview settings (size, background) at the top where designers set them once, and playback controls (replay, speed) at the bottom for interaction during testing.

---

## Component Breakdown

### 1. Primary Preview Area

The main preview canvas where designers interact with the animated icon.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│                               ×                      Fullscreen ⛶   │
│                                                                     │
│                                                                     │
│                          ┌─────────┐                                │
│                          │         │                                │
│                          │  ICON   │                                │
│                          │         │                                │
│                          └─────────┘                                │
│                                                                     │
│                                                                     │
│                     ↑ Hover to animate                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Min Height | 200px |
| Max Height | 400px |
| Aspect Ratio | Flexible (fills container) |
| Default Icon Size | 64px (configurable) |
| Border Radius | 12px |

**Behaviors:**

| Trigger Mode | Preview Behavior |
|--------------|------------------|
| `hover` | Animate on mouse enter, reset on leave |
| `click` | Animate on click anywhere in canvas |
| `auto` | Loop continuously |
| `inView` | Same as auto (for preview purposes) |
| `manual` | Use replay button only |

**Hint Text:**

| Trigger | Hint |
|---------|------|
| hover | "Hover to animate" |
| click | "Click to animate" |
| auto | "Looping..." |
| manual | "Click ↻ to replay" |

---

### 2. Preview Controls Bar

Minimal controls for adjusting preview behavior.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│   ↻ Replay     🐌 Speed [1x ▼]     Background  ● ○ ○ ○             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 2.1 Replay Button

```tsx
<button onClick={handleReplay}>
  <RotateCcw size={16} />
  Replay
</button>
```

**Behavior:**
- Resets animation to initial state
- Plays animation once
- Works regardless of trigger mode

#### 2.2 Speed Control

Dropdown or segmented control for playback speed.

```
┌──────────────────┐
│  Speed: 1x  ▼    │
├──────────────────┤
│  ○ 0.25x         │
│  ○ 0.5x          │
│  ● 1x            │
│  ○ 2x            │
└──────────────────┘
```

**Options:**
| Speed | Use Case |
|-------|----------|
| 0.25x | Study animation details |
| 0.5x | See timing clearly |
| 1x | Normal speed (default) |
| 2x | Quick preview |

#### 2.3 Background Switcher

Four background options for visibility testing.

```
Background:  ● ○ ○ ○
             │ │ │ └── Custom color picker
             │ │ └──── Dark (black)
             │ └────── Light (white)
             └──────── Dotted pattern (default)
```

**Visual:**
```
┌───┐ ┌───┐ ┌───┐ ┌───┐
│:::│ │   │ │███│ │ ? │
└───┘ └───┘ └───┘ └───┘
 Dots  White Black Custom
```

---

### 3. Size Strip

Secondary preview showing icon at different sizes.

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│     16px      24px      32px      48px      64px      96px         │
│    ┌──┐      ┌───┐     ┌────┐    ┌─────┐   ┌──────┐  ┌───────┐     │
│    │○ │      │ ○ │     │ ○  │    │  ○  │   │  ●   │  │   ○   │     │
│    └──┘      └───┘     └────┘    └─────┘   └──────┘  └───────┘     │
│                                    ▲                                │
│                              Selected (shown large above)           │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

**Specifications:**

| Property | Value |
|----------|-------|
| Sizes | 16, 24, 32, 48, 64, 96 |
| Default Selected | 64px |
| Height | 60px |
| Spacing | 16px between items |

**Behaviors:**

| Action | Result |
|--------|--------|
| Click size | Updates primary preview to that size |
| Hover any | All sizes animate simultaneously |
| Replay | All sizes animate |

**Visual Treatment:**

- Selected size: Ring outline + slight scale up
- Hover: Subtle highlight
- Active animation: Animated icon

---

## Interaction States

### Primary Preview

```
┌─────────────────────────────────────────────────────────────────────┐
│  STATE: IDLE                                                        │
│                                                                     │
│                          ┌─────────┐                                │
│                          │   ○     │  ← Static icon                 │
│                          └─────────┘                                │
│                                                                     │
│                     Hover to animate                                │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  STATE: HOVER / ANIMATING                                           │
│                                                                     │
│                          ┌─────────┐                                │
│                          │   ◐     │  ← Animating                   │
│                          └─────────┘                                │
│                                                                     │
│                     Animating...                                    │
└─────────────────────────────────────────────────────────────────────┘
```

### Size Strip Item

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│  Idle   │   │  Hover  │   │ Selected│
│         │   │   ▄▄▄   │   │  ━━━━━  │
│   ○     │   │   ○     │   │   ●     │
│         │   │   ▀▀▀   │   │         │
└─────────┘   └─────────┘   └─────────┘
```

---

## Responsive Behavior

### Desktop (>1024px)

Full layout as designed above.

### Tablet (768px - 1024px)

```
┌─────────────────────────────────────┐
│  16  24  32  48  64  96            │
├─────────────────────────────────────┤
│  ↻ Replay   [1x]   [bg]            │
├─────────────────────────────────────┤
│         PRIMARY PREVIEW             │
│                                     │
│            ┌─────┐                  │
│            │  ○  │                  │
│            └─────┘                  │
│                                     │
└─────────────────────────────────────┘
```

### Mobile (<768px)

```
┌─────────────────────┐
│ 24  32  48  64     │
│ (scrollable)        │
├─────────────────────┤
│ ↻  [1x]  [bg]      │
├─────────────────────┤
│    PRIMARY PREVIEW  │
│                     │
│       ┌─────┐       │
│       │  ○  │       │
│       └─────┘       │
│                     │
└─────────────────────┘
```

- Hide 16px and 96px by default
- Horizontal scroll on size strip

---

## Component Props

```typescript
interface PreviewProps {
  /** The parsed SVG data */
  parsedSVG: ParsedSVG;
  
  /** Current animation settings */
  settings: AnimationSettings;
  
  /** Current animation preset */
  preset: AnimationPreset;
  
  /** Callback when size changes */
  onSizeChange?: (size: number) => void;
  
  /** Callback to trigger replay externally */
  onReplay?: () => void;
}

interface PreviewRef {
  /** Trigger replay programmatically */
  replay: () => void;
  
  /** Get current animation state */
  getState: () => 'idle' | 'animating' | 'paused';
}
```

---

## State Management

```typescript
interface PreviewState {
  // Display
  selectedSize: number;           // 16 | 24 | 32 | 48 | 64 | 96
  background: 'dots' | 'white' | 'black' | 'custom';
  customBackgroundColor: string;
  speed: number;                  // 0.25 | 0.5 | 1 | 2
  
  // Animation
  isAnimating: boolean;
  animationKey: number;           // Increment to force re-render/replay
}

const DEFAULT_PREVIEW_STATE: PreviewState = {
  selectedSize: 64,
  background: 'dots',
  customBackgroundColor: '#6366f1',
  speed: 1,
  isAnimating: false,
  animationKey: 0,
};
```

---

## CSS Classes

```css
/* Preview Panel Container */
.preview-panel {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-3);
  padding: var(--spacing-4);
  background: var(--surface-primary);
  border-radius: var(--radius-lg);
}

/* Primary Preview Area */
.preview-canvas {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.preview-canvas--dots {
  background-image: radial-gradient(
    circle,
    var(--color-border) 1px,
    transparent 1px
  );
  background-size: 16px 16px;
}

.preview-canvas--white {
  background: #ffffff;
}

.preview-canvas--black {
  background: #000000;
}

.preview-hint {
  position: absolute;
  bottom: var(--spacing-3);
  font-size: var(--font-size-sm);
  color: var(--color-text-tertiary);
}

/* Controls Bar */
.preview-controls {
  display: flex;
  align-items: center;
  gap: var(--spacing-4);
  padding: var(--spacing-2) var(--spacing-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
}

.preview-controls__replay {
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
}

/* Size Strip */
.size-strip {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-4);
  padding: var(--spacing-3);
  background: var(--surface-secondary);
  border-radius: var(--radius-md);
}

.size-strip__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-1);
  padding: var(--spacing-2);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s ease;
}

.size-strip__item:hover {
  background: var(--surface-hover);
}

.size-strip__item--selected {
  background: var(--surface-accent);
  box-shadow: 0 0 0 2px var(--color-primary);
}

.size-strip__label {
  font-size: var(--font-size-xs);
  color: var(--color-text-secondary);
}

.size-strip__icon {
  display: flex;
  align-items: center;
  justify-content: center;
}
```

---

## Implementation Notes

### Animation Speed Control

Apply speed multiplier to duration:

```typescript
const effectiveDuration = settings.duration / previewState.speed;

<motion.path
  transition={{ duration: effectiveDuration }}
  ...
/>
```

### Replay Mechanism

Force re-render with key change:

```typescript
const [animationKey, setAnimationKey] = useState(0);

const handleReplay = () => {
  setAnimationKey(prev => prev + 1);
};

<AnimatedIcon key={animationKey} trigger="auto" />
```

### Size Strip Synchronization

All sizes animate together when hovered:

```typescript
const [isStripHovered, setIsStripHovered] = useState(false);

<div 
  className="size-strip"
  onMouseEnter={() => setIsStripHovered(true)}
  onMouseLeave={() => setIsStripHovered(false)}
>
  {SIZES.map(size => (
    <SizeItem 
      key={size}
      size={size}
      isAnimating={isStripHovered}
    />
  ))}
</div>
```

---

## Accessibility

| Element | Requirement |
|---------|-------------|
| Replay button | `aria-label="Replay animation"` |
| Speed dropdown | Keyboard navigable |
| Size strip | Arrow key navigation |
| Background buttons | `role="radiogroup"` |
| Preview canvas | Contains `role="img"` SVG |

---

## Performance Considerations

1. **Debounce size changes** - Don't re-render on every click during rapid clicking
2. **Pause when hidden** - Stop animation loop when tab is not visible
3. **Limit simultaneous animations** - In size strip, use CSS opacity for non-selected sizes
4. **Use `will-change`** - On elements that animate frequently

---

## What We're Removing

From the current timeline-based preview:

| Feature | Status | Reason |
|---------|--------|--------|
| Scrubbing timeline | ❌ Remove | Overkill for 0.5s animations |
| Timecode display | ❌ Remove | Not needed for icons |
| Per-path timeline tracks | ❌ Remove | Too complex for target users |
| Keyframe markers | ❌ Remove | We use presets, not keyframes |
| Detailed path list in preview | ❌ Move | Move to side panel |

---

## Summary

The new preview is:

- **Simpler**: No timeline, just interactive preview
- **More intuitive**: Works like the actual icon will
- **Designer-friendly**: Visual feedback, not technical controls
- **Practical**: Size strip shows real-world usage

---

*Document Version: 1.0*  
*Created: December 20, 2024*
