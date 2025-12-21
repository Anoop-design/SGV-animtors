# Animation Presets Implementation Guide

The animation system in **Ten Icons** is built on top of **Framer Motion**. It uses a data-driven approach where a JSON configuration (the "Recipe") determines the behavior of Framer Motion variants.

## 1. Data Structure (`types.ts`)

Every icon acts as a container for a `recipe` object. This is the single source of truth for the animation state.

```typescript
export interface AnimationRecipe {
  preset: 'draw' | 'pop' | 'wiggle' | 'bounce' | 'fade' | 'draw-pop';
  duration: number;   // Animation duration in seconds
  stagger: number;    // Delay between child elements in seconds
  easing: EasingType; // 'easeOut' | 'easeInOut' | 'linear' | 'spring'
  intensity: number;  // 0-1 multiplier for effect strength
  strokeWidth?: number;
  transforms: Transforms; // Spatial transforms (x, y, scale, rotate)
  triggers: {
    hover: boolean;
    click: boolean;
    mount: boolean;
    controlled: boolean;
  };
}
```

## 2. The Rendering Engine (`components/IconPreview.tsx`)

The `IconPreview` component is the runtime engine. It takes the static `AnimationRecipe` and converts it into dynamic **Framer Motion Variants**.

### A. Orchestration (Staggering)
We use a parent `motion.g` to handle timing. This allows the animation to flow through the SVG paths sequentially without managing individual delays for every path.

```typescript
// Inside IconPreview.tsx
const containerVariants = {
  idle: { transition: { staggerChildren: 0 } }, // Reset instantly
  play: { transition: { staggerChildren: recipe.stagger } }, // Ripple effect
  hover: { transition: { staggerChildren: recipe.stagger } },
  press: { transition: { staggerChildren: recipe.stagger } },
};
```

### B. Preset Logic (Path Variants)
We define specific visual behaviors based on the selected `preset`. These variants are applied to every child path.

#### 1. Draw (Stroke Animation)
Uses SVG `pathLength`.
- **Idle**: `pathLength: 1` (Fully drawn)
- **Play**: `pathLength: [0, 1]` (Animate from 0 to 100%)

#### 2. Pop (Scale Entrance)
Uses CSS transform `scale`.
- **Idle**: `scale: 1`
- **Play**: `scale: [0, 1]` (Animate from 0 to 100%)
- **CSS**: Uses a spring transition calculated from intensity.

#### 3. Wiggle (Rotation Keyframes)
Uses `rotate` with an array of keyframes to create a shaking effect. The angle is multiplied by `recipe.intensity`.
- **Play**: `rotate: [0, -10 * i, 10 * i, -10 * i, 0]`

#### 4. Bounce (Y-Axis Translation)
Uses `y` translation.
- **Play**: `y: [0, -10 * i, 0]`

### C. Intensity Calculation
The `intensity` slider adjusts specific parameters dynamically:
- **Wiggle**: Increases rotation angle (e.g., 5deg vs 20deg).
- **Bounce**: Increases jump height (translation Y).
- **Spring Easing**: Increases stiffness and damping for 'pop' effects.

## 3. Code Generation (`utils/codegen.ts`)

When a user clicks "Export", we do not dump the internal state. Instead, we generate a standalone, readable React component that has **no dependencies** on the Ten Icons internal types.

1.  **String Construction**: We reconstruct the variant objects as string literals.
2.  **Hardcoded Values**: We bake the current slider values (duration, stagger, intensity) directly into the generated code string.
3.  **Optimization**: We round decimal values (e.g., 0.33333 -> 0.333) to keep the code clean.

## 4. CSS Export Logic

For non-React exports, we generate raw CSS.
- **Draw**: Not fully supported in pure CSS (requires specific dasharray calculation per path), so we fallback to opacity/transforms.
- **Transforms**: We calculate the matrix of transformations (Translate * Rotate * Scale) and output a `transform` string.
- **Hover/Active**: We generate pseudo-classes (`.icon-svg:hover`) to trigger the transitions.
