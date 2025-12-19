# MotionRecipe schema

This document defines the data model for curated SVG animation presets (motion recipes). The goal is to keep recipes data driven, renderer agnostic, and easy to export.

## TypeScript types

```ts
export type MotionRecipe = {
  id: string
  label: string
  description?: string

  // What kind of motion this recipe represents
  category: "draw" | "transform" | "loop"

  // Initial visual state
  initial: MotionState

  // Target visual state
  animate: MotionState

  // Optional exit state (future safe)
  exit?: MotionState

  // Timing + easing
  transition: MotionTransition

  // How multiple paths are sequenced
  stagger?: StaggerConfig

  // How and when the animation starts
  trigger: MotionTrigger

  // Loop behavior (only for certain recipes)
  loop?: LoopConfig

  // Whether this recipe is curated or user generated
  curated: boolean
}

export type MotionState = {
  opacity?: number
  scale?: number
  rotate?: number

  x?: number
  y?: number

  // SVG specific
  strokeDasharray?: number | number[]
  strokeDashoffset?: number

  // Reserved for future
  pathLength?: number
}

export type MotionTransition = {
  duration?: number
  delay?: number

  ease?: "linear" | "easeIn" | "easeOut" | "easeInOut" | "spring"

  // Spring specific (used only when ease === "spring")
  spring?: {
    stiffness?: number
    damping?: number
    mass?: number
  }
}

export type StaggerConfig = {
  amount: number
  pattern: "forward" | "reverse" | "from-center" | "random"
}

export type MotionTrigger =
  | { type: "auto" }
  | { type: "hover" }
  | { type: "click" }
  | { type: "viewport"; once?: boolean }

export type LoopConfig = {
  type: "infinite" | "ping-pong"
  delay?: number
}
```

## Notes

- MotionRecipe describes intent, not implementation. Preview and export code should interpret these values.
- Keep recipes as pure data. Avoid embedding functions.
- Triggers are minimal so exports stay clean.
- Morphing can be added later by extending MotionState with an optional `path?: string`.

## Example curated recipes

```ts
export const POP_RECIPE: MotionRecipe = {
  id: "pop",
  label: "Pop",
  category: "transform",
  curated: true,

  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },

  transition: {
    ease: "spring",
    spring: { stiffness: 260, damping: 20 },
  },

  stagger: { amount: 0.06, pattern: "forward" },
  trigger: { type: "auto" },
}

export const DRAW_IN_RECIPE: MotionRecipe = {
  id: "draw-in",
  label: "Draw In",
  category: "draw",
  curated: true,

  initial: { strokeDasharray: 1, strokeDashoffset: 1 },
  animate: { strokeDashoffset: 0 },

  transition: { duration: 0.6, ease: "easeInOut" },

  stagger: { amount: 0.1, pattern: "forward" },
  trigger: { type: "auto" },
}

export const FLOAT_LOOP_RECIPE: MotionRecipe = {
  id: "float-loop",
  label: "Float",
  category: "loop",
  curated: true,

  initial: { y: 0 },
  animate: { y: -4 },

  transition: { duration: 2, ease: "easeInOut" },
  loop: { type: "ping-pong" },

  trigger: { type: "auto" },
}
```
