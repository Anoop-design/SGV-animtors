# Lucide Animated Icons - Animation Reference

> A comprehensive analysis of [lucide-animated.com](https://lucide-animated.com/) animation techniques and patterns. This document serves as a reference for implementing similar animations in our project.

---

## Overview

Lucide Animated is an open-source collection of smooth animated icons built on top of Lucide icons. The animations are created using Framer Motion (now called "Motion") and React.

### Key Resources

| Resource | URL |
|----------|-----|
| **Website** | [lucide-animated.com](https://lucide-animated.com/) |
| **Source Code** | [github.com/pqoqubbw/icons](https://github.com/pqoqubbw/icons) |
| **Animation Course** | [animations.dev](https://animations.dev/) |
| **Motion Library** | [motion.dev](https://motion.dev) |
| **Base Icons** | [lucide.dev](https://lucide.dev) |

---

## Technology Stack

| Technology | Package | Purpose |
|------------|---------|---------|
| **Motion** | `motion/react` | Animation library (formerly Framer Motion) |
| **Lucide Icons** | `lucide-react` | Base icon designs (SVG paths) |
| **React** | `react` | Component framework |
| **TypeScript** | `typescript` | Type safety |

---

## Core Animation Techniques

### 1. Path Drawing Animation (Stroke Animation)

This is the **signature effect** - icons appear to "draw themselves" on hover. This is achieved by animating SVG path properties.

#### Key Properties

| Property | Description | Value Range |
|----------|-------------|-------------|
| `pathLength` | Controls how much of the stroke is visible | 0 (invisible) to 1 (fully drawn) |
| `pathOffset` | Controls where the drawing starts from | 0 to 1 |
| `opacity` | Fade in/out effect | 0 to 1 |

#### Example: Activity Icon

```tsx
import type { Variants } from 'motion/react';
import { motion, useAnimation } from 'motion/react';

const VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,     // Fully drawn
    pathOffset: 0,     // Start at beginning
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],    // Animate from invisible to fully drawn
    pathOffset: [1, 0],    // Animate the draw-from position
    transition: {
      duration: 0.6,
      ease: 'linear',
      opacity: { duration: 0.1 },
    },
  },
};

// Usage in SVG
<motion.path
  variants={VARIANTS}
  animate={controls}
  initial="normal"
  d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"
/>
```

#### How It Works

1. `pathLength: [0, 1]` - The stroke starts at 0% visible and animates to 100% visible
2. `pathOffset: [1, 0]` - The offset creates the "drawing" direction effect
3. Combined, they create the illusion of the stroke being drawn from one end to the other

---

### 2. Transform Animations

Used for physical motion like shaking, bouncing, and moving.

#### Example: Alarm Clock (Shake Effect)

```tsx
const PATH_VARIANTS: Variants = {
  normal: {
    y: 0,
    x: 0,
    transition: {
      duration: 0.2,
      type: 'spring',
      stiffness: 200,
      damping: 25,
    },
  },
  animate: {
    y: -1.5,                         // Bounce up slightly
    x: [-1, 1, -1, 1, -1, 0],       // Shake left-right sequence
    transition: {
      y: {
        duration: 0.2,
        type: 'spring',
        stiffness: 200,
        damping: 25,
      },
      x: {
        duration: 0.3,
        repeat: Infinity,
        ease: 'linear',
      },
    },
  },
};

// Secondary elements can have more exaggerated motion
const SECONDARY_PATH_VARIANTS: Variants = {
  normal: { y: 0, x: 0 },
  animate: {
    y: -2.5,                         // More bounce
    x: [-2, 2, -2, 2, -2, 0],       // More shake amplitude
  },
};
```

#### Key Concepts

- **Keyframe Arrays**: `[-1, 1, -1, 1, -1, 0]` defines a sequence of positions
- **Different Transitions per Property**: `y` uses spring physics, `x` uses linear timing
- **Spring Physics**: `type: 'spring'` with `stiffness` and `damping` for natural motion

---

### 3. Rotation Animation

Used for loaders, spinners, and continuous motion.

#### Example: Loader Pinwheel

```tsx
const G_VARIANTS: Variants = {
  normal: { rotate: 0 },
  animate: {
    rotate: 360,
    transition: {
      repeat: Infinity,
      duration: 1,
      ease: 'linear',
    },
  },
};

const DEFAULT_TRANSITION: Transition = {
  type: 'spring',
  stiffness: 50,
  damping: 10,
};

// Usage - animate a group of elements together
<motion.g
  transition={DEFAULT_TRANSITION}
  variants={G_VARIANTS}
  animate={controls}
>
  <path d="M22 12a1 1 0 0 1-10 0 1 1 0 0 0-10 0" />
  <path d="M7 20.7a1 1 0 1 1 5-8.7 1 1 0 1 0 5-8.6" />
  <path d="M7 3.3a1 1 0 1 1 5 8.6 1 1 0 1 0 5 8.6" />
</motion.g>
```

#### Key Concepts

- **`motion.g`**: Wrap multiple paths in a motion group to animate them together
- **`repeat: Infinity`**: Continuous animation
- **`ease: 'linear'`**: Constant speed rotation (essential for smooth spinners)

---

### 4. Scale Animation

Used for pulsing effects, emphasis, and heartbeat-like animations.

#### Example: Heart Icon

```tsx
const HeartIcon = forwardRef<HeartIconHandle, HeartIconProps>(
  ({ ... }, ref) => {
    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        animate={controls}
        variants={{
          normal: { scale: 1 },
          animate: { scale: [1, 1.08, 1] },  // Pulse: normal → bigger → normal
        }}
        transition={{
          duration: 0.45,
          repeat: 2,  // Pulse 2 times
        }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </motion.svg>
    );
  }
);
```

#### Key Concepts

- **`motion.svg`**: Animate the entire SVG element
- **Scale Array**: `[1, 1.08, 1]` creates a "pop" effect
- **Limited Repeats**: `repeat: 2` for controlled animation cycles

---

### 5. Combined Path + Scale Animation

Some icons combine multiple techniques for richer effects.

#### Example: Check Icon

```tsx
const PATH_VARIANTS: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      opacity: { duration: 0.1 },
    },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    scale: [0.5, 1],     // Grows while drawing
    transition: {
      duration: 0.4,
      opacity: { duration: 0.1 },
    },
  },
};
```

---

## Component Architecture Pattern

Every Lucide Animated icon follows this consistent structure:

```tsx
'use client';

import type { Variants } from 'motion/react';
import type { HTMLAttributes } from 'react';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { motion, useAnimation } from 'motion/react';

// 1. Define TypeScript interfaces for the imperative handle
export interface IconNameHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

interface IconNameProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

// 2. Define animation variants
const VARIANTS: Variants = {
  normal: {
    // Resting state properties
  },
  animate: {
    // Animated state properties
  },
};

// 3. Create component with forwardRef
const IconName = forwardRef<IconNameHandle, IconNameProps>(
  ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
    // 4. Use Motion's animation controller
    const controls = useAnimation();
    const isControlledRef = useRef(false);

    // 5. Expose imperative API for programmatic control
    useImperativeHandle(ref, () => {
      isControlledRef.current = true;
      return {
        startAnimation: () => controls.start('animate'),
        stopAnimation: () => controls.start('normal'),
      };
    });

    // 6. Handle hover events for automatic animation
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('animate');
        } else {
          onMouseEnter?.(e);
        }
      },
      [controls, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        if (!isControlledRef.current) {
          controls.start('normal');
        } else {
          onMouseLeave?.(e);
        }
      },
      [controls, onMouseLeave]
    );

    // 7. Render with motion elements
    return (
      <div
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <motion.path
            variants={VARIANTS}
            animate={controls}
            initial="normal"
            d="..."
          />
        </svg>
      </div>
    );
  }
);

IconName.displayName = 'IconName';

export { IconName };
```

---

## Animation Patterns Summary

| Pattern | Properties Animated | Use Case | Example Icons |
|---------|---------------------|----------|---------------|
| **Draw On** | `pathLength`, `pathOffset` | Line icons, graphs | activity, check |
| **Shake** | `x`, `y` with keyframe arrays | Alerts, notifications | alarm-clock, bell |
| **Rotate** | `rotate` with `repeat: Infinity` | Loaders, refresh | loader-pinwheel, refresh-cw |
| **Bounce** | `y` with spring physics | Attention-grabbing | arrow-down, download |
| **Scale/Pulse** | `scale` with keyframe arrays | Heartbeat, emphasis | heart, circle |
| **Fade** | `opacity` | Appear/disappear | Most icons |
| **Stagger** | Different `delay` per element | Multi-part icons | Multiple paths |

---

## Trigger Mechanisms

### 1. Hover-Triggered (Default)

```tsx
const handleMouseEnter = () => controls.start('animate');
const handleMouseLeave = () => controls.start('normal');

<div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
  {/* SVG content */}
</div>
```

### 2. Programmatic Control via Ref

```tsx
// Parent component
const iconRef = useRef<HeartIconHandle>(null);

// Trigger animations programmatically
const handleClick = () => {
  iconRef.current?.startAnimation();
};

const handleReset = () => {
  iconRef.current?.stopAnimation();
};

<HeartIcon ref={iconRef} />
<button onClick={handleClick}>Animate</button>
```

---

## Best Practices for Smooth Animations

### 1. Spring Physics for Natural Motion

```tsx
transition: {
  type: 'spring',
  stiffness: 200,  // Higher = snappier
  damping: 25,     // Higher = less bounce
}
```

### 2. Different Transitions per Property

```tsx
transition: {
  duration: 0.6,
  opacity: { duration: 0.1 },  // Fade in quickly
  pathLength: { ease: 'linear' },  // Draw at constant speed
}
```

### 3. Keyframe Arrays for Multi-Step Animations

```tsx
// Simple two-step
scale: [0, 1]

// Multi-step pulse
scale: [1, 1.08, 1]

// Complex shake
x: [-1, 1, -1, 1, -1, 0]
```

### 4. Overflow Visible for Transform Animations

```tsx
<svg style={{ overflow: 'visible' }}>
  {/* Prevents clipping during transforms */}
</svg>
```

### 5. Appropriate Easing Functions

| Easing | Use Case |
|--------|----------|
| `'linear'` | Continuous motion (spinners, draws) |
| `'easeIn'` | Accelerating motion |
| `'easeOut'` | Decelerating motion |
| `'easeInOut'` | Smooth start and end |
| Spring | Physical, natural motion |

---

## Staggered Animations

For icons with multiple paths, stagger the animations for a polished effect:

```tsx
const PATH_1_VARIANTS: Variants = {
  animate: {
    pathLength: [0, 1],
    transition: { delay: 0, duration: 0.3 },
  },
};

const PATH_2_VARIANTS: Variants = {
  animate: {
    pathLength: [0, 1],
    transition: { delay: 0.1, duration: 0.3 },  // 100ms delay
  },
};

const PATH_3_VARIANTS: Variants = {
  animate: {
    pathLength: [0, 1],
    transition: { delay: 0.2, duration: 0.3 },  // 200ms delay
  },
};
```

---

## Implementation Notes for Our Project

### Applying These Patterns to Icon Motion

1. **Path Drawing**: Already have pathLength support - can add pathOffset for direction control
2. **Transforms**: Our TransformPanel already supports x, y, scale, rotate
3. **Spring Physics**: Can integrate Motion's spring configurations
4. **Staggering**: Our stagger controls align with these patterns
5. **Hover Triggers**: Consider adding hover-to-animate mode

### Key Differences from Our Approach

| Lucide Animated | Our Icon Motion |
|-----------------|-----------------|
| Pre-built animations per icon | Configurable animations for any SVG |
| React components | Generated animation code |
| Hover-triggered | Configurable triggers |
| Fixed presets | Custom keyframes |

---

## Useful Code Snippets

### Quick Draw-On Effect

```tsx
variants={{
  normal: { pathLength: 1, pathOffset: 0 },
  animate: { pathLength: [0, 1], pathOffset: [1, 0] },
}}
transition={{ duration: 0.6, ease: 'linear' }}
```

### Quick Shake Effect

```tsx
variants={{
  normal: { x: 0 },
  animate: { x: [-2, 2, -2, 2, 0] },
}}
transition={{ duration: 0.4 }}
```

### Quick Pulse Effect

```tsx
variants={{
  normal: { scale: 1 },
  animate: { scale: [1, 1.1, 1] },
}}
transition={{ duration: 0.3, repeat: 2 }}
```

### Quick Spin Effect

```tsx
variants={{
  normal: { rotate: 0 },
  animate: { rotate: 360 },
}}
transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
```

---

*Document created: December 20, 2024*
*Based on analysis of lucide-animated.com and github.com/pqoqubbw/icons*
