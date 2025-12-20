# Export Icons - Technical Specification

> Production-ready animated icon export specification for Icon Motion.

---

## Overview

Icon Motion exports animated SVG components that are:
- **One-line usable**: `<BellIcon />` works immediately
- **Fully customizable**: Props for everything, no re-export needed
- **TypeScript-first**: Full type safety and autocomplete
- **Developer-friendly**: Three levels of control (props, ref, CSS)

---

## Export Formats

| Format | Primary Use | Dependency |
|--------|-------------|------------|
| **React + Framer Motion** | React/Next.js projects | `framer-motion` |
| **Vue + Motion** | Vue/Nuxt projects | `@vueuse/motion` |
| **CSS Animation** | Vanilla, any framework | None |
| **SVG + SMIL** | Inline SVG, `<img>` tags | None |

**Default**: React + Framer Motion (recommended for best quality)

---

## React Component Specification

### Props Interface

```typescript
export interface AnimatedIconProps {
  /**
   * Icon size in pixels
   * @default 24
   */
  size?: number;

  /**
   * Icon color - inherits from parent via currentColor by default
   * @default 'currentColor'
   */
  color?: string;

  /**
   * SVG stroke width
   * @default 2
   */
  strokeWidth?: number;

  /**
   * Animation trigger mode
   * - hover: Animate on mouse enter, reset on leave
   * - click: Animate on click, auto-reset
   * - auto: Animate immediately on mount
   * - inView: Animate when scrolled into viewport
   * - manual: Only animate via ref methods
   * @default 'hover'
   */
  trigger?: 'hover' | 'click' | 'auto' | 'inView' | 'manual';

  /**
   * Animation duration in seconds
   * @default 0.6
   */
  duration?: number;

  /**
   * Delay before animation starts (seconds)
   * @default 0
   */
  delay?: number;

  /**
   * Loop the animation
   * - false: Play once
   * - true: Loop infinitely
   * - number: Loop N times
   * @default false
   */
  loop?: boolean | number;

  /**
   * Callback fired when animation starts
   */
  onAnimationStart?: () => void;

  /**
   * Callback fired when animation completes
   */
  onAnimationComplete?: () => void;

  /**
   * Additional CSS class names
   */
  className?: string;

  /**
   * Inline styles
   */
  style?: React.CSSProperties;
}
```

### Ref Interface

```typescript
export interface AnimatedIconRef {
  /**
   * Start the animation
   * @returns Promise that resolves when animation completes
   */
  animate: () => Promise<void>;

  /**
   * Stop animation and reset to initial state
   */
  reset: () => void;

  /**
   * Pause the animation mid-way
   */
  pause: () => void;

  /**
   * Resume a paused animation
   */
  resume: () => void;

  /**
   * Current animation state
   */
  state: 'idle' | 'animating' | 'paused';
}
```

---

## Complete Component Template

```tsx
'use client';

import { motion, useAnimation, Variants, Transition } from 'framer-motion';
import {
  forwardRef,
  useImperativeHandle,
  useEffect,
  useCallback,
  useState,
  useRef,
} from 'react';

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export interface {{ICON_NAME}}Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
  trigger?: 'hover' | 'click' | 'auto' | 'inView' | 'manual';
  duration?: number;
  delay?: number;
  loop?: boolean | number;
  onAnimationStart?: () => void;
  onAnimationComplete?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface {{ICON_NAME}}Ref {
  animate: () => Promise<void>;
  reset: () => void;
  pause: () => void;
  resume: () => void;
  state: 'idle' | 'animating' | 'paused';
}

// ═══════════════════════════════════════════════════════════════════════════
// ANIMATION VARIANTS
// ═══════════════════════════════════════════════════════════════════════════

const variants: Variants = {
  initial: {{INITIAL_STATE}},
  animate: {{ANIMATE_STATE}},
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export const {{ICON_NAME}} = forwardRef<{{ICON_NAME}}Ref, {{ICON_NAME}}Props>(
  (
    {
      size = 24,
      color = 'currentColor',
      strokeWidth = 2,
      trigger = 'hover',
      duration = {{DURATION}},
      delay = 0,
      loop = false,
      onAnimationStart,
      onAnimationComplete,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const controls = useAnimation();
    const [state, setState] = useState<'idle' | 'animating' | 'paused'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);

    // ─────────────────────────────────────────────────────────────────────
    // Animation Methods
    // ─────────────────────────────────────────────────────────────────────

    const animate = useCallback(async () => {
      setState('animating');
      onAnimationStart?.();
      await controls.start('animate');
      onAnimationComplete?.();
      if (!loop) setState('idle');
    }, [controls, loop, onAnimationStart, onAnimationComplete]);

    const reset = useCallback(() => {
      controls.set('initial');
      setState('idle');
    }, [controls]);

    const pause = useCallback(() => {
      controls.stop();
      setState('paused');
    }, [controls]);

    const resume = useCallback(() => {
      controls.start('animate');
      setState('animating');
    }, [controls]);

    // ─────────────────────────────────────────────────────────────────────
    // Imperative Handle
    // ─────────────────────────────────────────────────────────────────────

    useImperativeHandle(
      ref,
      () => ({ animate, reset, pause, resume, state }),
      [animate, reset, pause, resume, state]
    );

    // ─────────────────────────────────────────────────────────────────────
    // Auto Trigger
    // ─────────────────────────────────────────────────────────────────────

    useEffect(() => {
      if (trigger === 'auto') {
        const timer = setTimeout(animate, delay * 1000);
        return () => clearTimeout(timer);
      }
    }, [trigger, delay, animate]);

    // ─────────────────────────────────────────────────────────────────────
    // Viewport Trigger
    // ─────────────────────────────────────────────────────────────────────

    useEffect(() => {
      if (trigger !== 'inView' || !containerRef.current) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            animate();
            observer.disconnect();
          }
        },
        { threshold: 0.5 }
      );

      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, [trigger, animate]);

    // ─────────────────────────────────────────────────────────────────────
    // Event Handlers
    // ─────────────────────────────────────────────────────────────────────

    const handlers = {
      hover: {
        onMouseEnter: animate,
        onMouseLeave: reset,
      },
      click: {
        onClick: async () => {
          await animate();
          if (!loop) reset();
        },
      },
      auto: {},
      inView: {},
      manual: {},
    }[trigger];

    // ─────────────────────────────────────────────────────────────────────
    // Transition
    // ─────────────────────────────────────────────────────────────────────

    const transition: Transition = {
      duration,
      ease: {{EASING}},
      repeat: loop === true ? Infinity : loop || 0,
    };

    // ─────────────────────────────────────────────────────────────────────
    // Render
    // ─────────────────────────────────────────────────────────────────────

    return (
      <div
        ref={containerRef}
        className={className}
        style={{
          display: 'inline-flex',
          width: size,
          height: size,
          ...style,
        }}
        {...handlers}
        {...props}
      >
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="{{VIEWBOX}}"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ overflow: 'visible' }}
          role="img"
          aria-label="{{ARIA_LABEL}}"
        >
          {{ANIMATED_PATHS}}
        </motion.svg>
      </div>
    );
  }
);

{{ICON_NAME}}.displayName = '{{ICON_NAME}}';
```

---

## Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `{{ICON_NAME}}` | PascalCase icon name | `BellIcon` |
| `{{VIEWBOX}}` | SVG viewBox attribute | `0 0 24 24` |
| `{{ARIA_LABEL}}` | Accessibility label | `Bell notification icon` |
| `{{DURATION}}` | Default animation duration | `0.6` |
| `{{EASING}}` | Easing function | `'linear'` or `[0.4, 0, 0.2, 1]` |
| `{{INITIAL_STATE}}` | Initial animation state | `{ pathLength: 0, opacity: 0 }` |
| `{{ANIMATE_STATE}}` | Final animation state | `{ pathLength: 1, opacity: 1 }` |
| `{{ANIMATED_PATHS}}` | Motion path elements | See below |

### Animated Paths Template

For each path in the SVG:

```tsx
<motion.path
  d="{{PATH_D}}"
  variants={variants}
  initial="initial"
  animate={controls}
  transition={{ ...transition, delay: {{PATH_DELAY}} }}
/>
```

---

## Usage Examples

### Basic Usage

```tsx
import { BellIcon } from './icons/BellIcon';

// Default: hover to animate
<BellIcon />
```

### Size and Color

```tsx
<BellIcon size={32} color="#6366f1" />
<BellIcon size={48} color="var(--primary)" />
```

### Trigger Modes

```tsx
// Hover (default)
<BellIcon trigger="hover" />

// Click to animate
<BellIcon trigger="click" />

// Auto-animate on mount
<BellIcon trigger="auto" />

// Animate when scrolled into view
<BellIcon trigger="inView" />

// Manual control only
<BellIcon trigger="manual" />
```

### Timing Control

```tsx
// Slower animation
<BellIcon duration={1.5} />

// With delay
<BellIcon trigger="auto" delay={0.5} />

// Loop forever
<BellIcon trigger="auto" loop />

// Loop 3 times
<BellIcon trigger="auto" loop={3} />
```

### Programmatic Control

```tsx
import { useRef } from 'react';
import { BellIcon, BellIconRef } from './icons/BellIcon';

function NotificationButton() {
  const iconRef = useRef<BellIconRef>(null);

  const handleNotify = () => {
    iconRef.current?.animate();
  };

  return (
    <button onClick={handleNotify}>
      <BellIcon ref={iconRef} trigger="manual" />
      Notify
    </button>
  );
}
```

### With Callbacks

```tsx
<BellIcon
  trigger="click"
  onAnimationStart={() => console.log('Animation started')}
  onAnimationComplete={() => console.log('Animation complete')}
/>
```

### Styling

```tsx
// With className
<BellIcon className="my-icon hover:scale-110 transition-transform" />

// With inline styles
<BellIcon style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
```

---

## CSS Animation Export

For framework-agnostic usage:

```css
/* icon-name.css */

.animated-icon {
  --icon-color: currentColor;
  --icon-size: 24px;
  --animation-duration: 0.6s;
  --animation-delay: 0s;
  --animation-easing: linear;
}

.animated-icon path {
  stroke: var(--icon-color);
  stroke-dasharray: var(--path-length);
  stroke-dashoffset: var(--path-length);
  animation: draw-path var(--animation-duration) var(--animation-easing)
    var(--animation-delay) forwards;
}

.animated-icon path:nth-child(2) {
  animation-delay: calc(var(--animation-delay) + 0.1s);
}

@keyframes draw-path {
  to {
    stroke-dashoffset: 0;
  }
}

/* Trigger: Hover */
.animated-icon--hover path {
  animation-play-state: paused;
  stroke-dashoffset: var(--path-length);
}

.animated-icon--hover:hover path {
  animation-play-state: running;
}
```

```html
<!-- icon-name.html -->
<svg
  class="animated-icon animated-icon--hover"
  viewBox="0 0 24 24"
  style="--icon-size: 24px"
>
  <path
    style="--path-length: 60"
    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
  />
  <path style="--path-length: 15" d="M13.73 21a2 2 0 0 1-3.46 0" />
</svg>
```

---

## SVG + SMIL Export

Self-contained animated SVG:

```svg
<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
  <style>
    path {
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
  </style>
  
  <path
    d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"
    stroke-dasharray="60"
    stroke-dashoffset="60"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="60"
      to="0"
      dur="0.6s"
      fill="freeze"
      begin="0s"
    />
  </path>
  
  <path
    d="M13.73 21a2 2 0 0 1-3.46 0"
    stroke-dasharray="15"
    stroke-dashoffset="15"
  >
    <animate
      attributeName="stroke-dashoffset"
      from="15"
      to="0"
      dur="0.4s"
      fill="freeze"
      begin="0.2s"
    />
  </path>
</svg>
```

---

## Quality Checklist

### Code Quality

- [ ] TypeScript interfaces for all props and ref
- [ ] JSDoc comments on every prop
- [ ] `displayName` set for React DevTools
- [ ] `'use client'` directive for Next.js
- [ ] No unused imports or variables
- [ ] Proper cleanup in useEffect

### Accessibility

- [ ] `role="img"` on SVG
- [ ] `aria-label` with descriptive text
- [ ] Works without animation (respects prefers-reduced-motion in future)

### Flexibility

- [ ] All animation params as props (duration, delay, loop)
- [ ] Trigger changeable without re-export
- [ ] Imperative methods via ref
- [ ] CSS customization via className/style
- [ ] Callbacks for animation events

### Performance

- [ ] Uses `useCallback` for handlers
- [ ] Proper dependency arrays
- [ ] Cleanup on unmount
- [ ] No unnecessary re-renders

---

## File Naming Convention

| Icon Name | File Name | Export Name |
|-----------|-----------|-------------|
| Bell | `BellIcon.tsx` | `BellIcon` |
| Arrow Down | `ArrowDownIcon.tsx` | `ArrowDownIcon` |
| Chevron Right | `ChevronRightIcon.tsx` | `ChevronRightIcon` |

---

## Download Package Structure

When downloading all formats:

```
icon-name.zip
├── react/
│   └── IconName.tsx          # React + Framer Motion
├── vue/
│   └── IconName.vue          # Vue + Motion (future)
├── css/
│   ├── icon-name.css         # CSS Animation styles
│   └── icon-name.svg         # SVG with CSS classes
├── smil/
│   └── icon-name.svg         # Self-contained SMIL animation
├── preview.gif               # Animation preview
└── README.md                 # Usage documentation
```

---

## Comparison with Competitors

| Feature | Lucide Animated | Our Export |
|---------|----------------|------------|
| TypeScript | ✅ | ✅ |
| trigger prop | ❌ (hover only) | ✅ |
| duration prop | ❌ | ✅ |
| delay prop | ❌ | ✅ |
| loop prop | ❌ | ✅ |
| Callbacks | ❌ | ✅ |
| pause/resume | ❌ | ✅ |
| inView trigger | ❌ | ✅ |
| CSS export | ❌ | ✅ |
| SMIL export | ❌ | ✅ |

---

*Document Version: 1.0*  
*Created: December 20, 2024*