// =============================================================================
// ICON MOTION - TYPE DEFINITIONS
// =============================================================================

// -----------------------------------------------------------------------------
// Transform State (single keyframe)
// -----------------------------------------------------------------------------

export interface TransformState {
  x: number;           // Translate X (px)
  y: number;           // Translate Y (px)
  scale: number;       // Uniform scale
  scaleX?: number;     // Independent X scale (advanced)
  scaleY?: number;     // Independent Y scale (advanced)
  rotate: number;      // Rotation (degrees)
  skewX?: number;      // Skew X (degrees, advanced)
  skewY?: number;      // Skew Y (degrees, advanced)
  opacity: number;
}

export const DEFAULT_TRANSFORM_STATE: TransformState = {
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  opacity: 1,
};

// -----------------------------------------------------------------------------
// Transition / Timing Config
// -----------------------------------------------------------------------------

export interface TransitionConfig {
  duration?: number;   // Per-path duration (seconds)
  delay?: number;      // Per-path delay (seconds)
  ease?: string | number[];  // Easing (string or cubic-bezier array)
  type?: 'spring' | 'tween';
  stiffness?: number;
  damping?: number;
  bounce?: number;
}

// -----------------------------------------------------------------------------
// Stagger Configuration
// -----------------------------------------------------------------------------

export type StaggerPattern = 'forward' | 'reverse' | 'from-center' | 'random';

export interface StaggerConfig {
  pattern: StaggerPattern;
  amount: number;  // Total stagger time in seconds
}

export const DEFAULT_STAGGER_CONFIG: StaggerConfig = {
  pattern: 'forward',
  amount: 0.3,
};

// -----------------------------------------------------------------------------
// Trigger Types
// -----------------------------------------------------------------------------

export type TriggerType = 'auto' | 'hover' | 'click' | 'viewport' | 'manual';

// -----------------------------------------------------------------------------
// Stroke Animation State (for draw effects)
// -----------------------------------------------------------------------------

export interface StrokeAnimationState {
  pathLength: number;    // 0 = invisible, 1 = fully drawn
  pathOffset: number;    // Controls draw direction (0 to 1)
}

export const DEFAULT_STROKE_STATE: StrokeAnimationState = {
  pathLength: 1,
  pathOffset: 0,
};

// -----------------------------------------------------------------------------
// Keyframe Animation (for wiggle/shake effects)
// -----------------------------------------------------------------------------

export interface KeyframeAnimation {
  x?: number[];          // e.g., [-2, 2, -2, 2, 0]
  y?: number[];          // e.g., [-1, 1, -1, 0]
  rotate?: number[];     // e.g., [-5, 5, -5, 5, 0]
  scale?: number[];      // e.g., [1, 1.1, 1]
  opacity?: number[];    // e.g., [0, 1, 0]
}

// -----------------------------------------------------------------------------
// Animation Type Discriminator
// -----------------------------------------------------------------------------

export type AnimationType = 'transform' | 'stroke' | 'keyframe';

export type AnimationCategory = 'entrance' | 'attention' | 'exit';

// -----------------------------------------------------------------------------
// MotionNode - Core abstraction for animation definition
// Separates editor logic from export logic
// -----------------------------------------------------------------------------

export interface MotionNode {
  initial: Partial<TransformState>;   // Starting values
  animate: Partial<TransformState>;   // Target values  
  transition: TransitionConfig;
  trigger: TriggerType;
  stagger: StaggerConfig;
}

export const DEFAULT_MOTION_NODE: MotionNode = {
  initial: {},
  animate: {},
  transition: { duration: 0.5, ease: 'easeOut' },
  trigger: 'auto',
  stagger: DEFAULT_STAGGER_CONFIG,
};

// -----------------------------------------------------------------------------
// Animation Preset V2 (Unified: supports transform, stroke, and keyframe)
// -----------------------------------------------------------------------------

export interface AnimationPresetV2 {
  id: string;
  name: string;
  description?: string;
  category: AnimationCategory;
  icon?: string;  // Icon name for UI
  type: AnimationType;

  // Transform mode (for transform type)
  motion?: {
    from: Partial<TransformState>;
    to: Partial<TransformState>;
  };

  // Stroke mode (for stroke/draw type)
  stroke?: {
    from: Partial<StrokeAnimationState>;
    to: Partial<StrokeAnimationState>;
  };

  // Keyframe mode (for keyframe type like wiggle)
  keyframes?: KeyframeAnimation;

  timing: TransitionConfig;
  stagger: StaggerConfig;
}

// Legacy interface for backward compatibility
export interface TransformPreset {
  id: string;
  name: string;
  description?: string;
  motion: {
    from: Partial<TransformState>;
    to: Partial<TransformState>;
  };
  timing: TransitionConfig;
  stagger: StaggerConfig;
}

// -----------------------------------------------------------------------------
// AnimationRecipe - New Recipe-based animation system
// Separates Configuration (Recipe) from Implementation (Variants)
// -----------------------------------------------------------------------------

export type PresetType = 'draw' | 'pop' | 'wiggle' | 'bounce' | 'draw-pop' | 'fade' | 'slide' | 'spin' | 'pulse' | 'panel';

// Transition configuration for detailed ease/spring settings
export interface RecipeTransition {
  type: 'ease' | 'spring';
  // Ease settings
  duration: number;      // Duration in seconds (for ease type)
  delay: number;         // Delay before animation starts
  ease: string | [number, number, number, number];  // Easing preset or cubic-bezier
  // Spring settings
  stiffness: number;     // Spring stiffness (50-1000, default: 300)
  damping: number;       // Spring damping (5-50, default: 15)
  mass: number;          // Spring mass (0.1-5, default: 1)
}

export const DEFAULT_RECIPE_TRANSITION: RecipeTransition = {
  type: 'ease',
  duration: 0.6,
  delay: 0,
  ease: 'easeOut',
  stiffness: 300,
  damping: 15,
  mass: 1,
};

export interface AnimationRecipe {
  preset: PresetType;
  intensity: number;     // Multiplier for effect strength (0-1, default: 0.5)
  stagger: number;       // Delay between each path animating (seconds)
  staggerType: StaggerType;  // How paths are ordered for stagger
  layerMode: LayerMode;  // How layers animate: individual or unified
  transition: RecipeTransition;  // Detailed transition settings
  loop: boolean;         // Whether animation repeats
  trigger: TriggerType;  // When animation triggers
  // Legacy fields (kept for backward compatibility)
  duration: number;      // Shortcut to transition.duration
  easing: EasingType;    // Shortcut to transition.ease
}

// How layers animate
export type LayerMode = 'individual' | 'unified';

// Stagger type determines order of path animation
export type StaggerType = 'none' | 'by-index' | 'by-index-reverse' | 'by-size' | 'from-center' | 'random';

export const DEFAULT_RECIPE: AnimationRecipe = {
  preset: 'draw',
  intensity: 0.5,
  stagger: 0.1,
  staggerType: 'by-index',
  layerMode: 'individual',
  transition: DEFAULT_RECIPE_TRANSITION,
  loop: false,
  trigger: 'auto',
  // Legacy shortcuts
  duration: 0.6,
  easing: 'easeOut',
};

// Preset metadata for UI display - grid layout
export const PRESET_OPTIONS: { value: PresetType; label: string; description: string; icon: string }[] = [
  { value: 'draw', label: 'Draw', description: 'Stroke draws on progressively', icon: 'pencil' },
  { value: 'pop', label: 'Pop', description: 'Scale up with overshoot', icon: 'zap' },
  { value: 'wiggle', label: 'Wiggle', description: 'Shake left and right', icon: 'activity' },
  { value: 'bounce', label: 'Bounce', description: 'Spring up from below', icon: 'arrow-up-down' },
  { value: 'draw-pop', label: 'Draw+Pop', description: 'Draw then pop in', icon: 'sparkles' },
  { value: 'fade', label: 'Fade', description: 'Fade in smoothly', icon: 'eye' },
  { value: 'slide', label: 'Slide', description: 'Slide up with fade', icon: 'arrow-up' },
  { value: 'spin', label: 'Spin', description: 'Rotate 360 degrees', icon: 'loader' },
  { value: 'pulse', label: 'Pulse', description: 'Pulsing heartbeat effect', icon: 'heart' },
  { value: 'panel', label: 'Panel', description: 'Sidebar panel toggle morph', icon: 'panel-right' },
];

// -----------------------------------------------------------------------------
// Smart Presets - Pre-configured animation recipes for common use cases
// Each applies a complete set of animation settings with one click
// -----------------------------------------------------------------------------

export interface SmartPreset {
  id: string;
  name: string;
  icon: string;              // Lucide icon name
  description: string;
  recipe: Partial<AnimationRecipe>;  // Settings to apply
}

export const SMART_PRESETS: SmartPreset[] = [
  {
    id: 'loading-spinner',
    name: 'Loading Spinner',
    icon: 'loader',
    description: 'Continuous spinning',
    recipe: {
      preset: 'spin',
      trigger: 'auto',
      loop: true,
      layerMode: 'unified',
      intensity: 0.5,
    }
  },
  {
    id: 'success-check',
    name: 'Success Check',
    icon: 'check-circle',
    description: 'Draw animation',
    recipe: {
      preset: 'draw',
      trigger: 'auto',
      loop: false,
      layerMode: 'individual',
      stagger: 0.1,
      staggerType: 'by-index',
      intensity: 0.6,
    }
  },
  {
    id: 'attention-pulse',
    name: 'Attention Pulse',
    icon: 'bell',
    description: 'Pulsing notification',
    recipe: {
      preset: 'pulse',
      trigger: 'auto',
      loop: true,
      layerMode: 'unified',
      intensity: 0.7,
    }
  },
  {
    id: 'hover-reveal',
    name: 'Hover Reveal',
    icon: 'sparkles',
    description: 'Draw on hover',
    recipe: {
      preset: 'draw',
      trigger: 'hover',
      loop: false,
      layerMode: 'individual',
      stagger: 0.08,
      staggerType: 'by-index',
      intensity: 0.5,
    }
  },
  {
    id: 'click-bounce',
    name: 'Click Bounce',
    icon: 'mouse-pointer-click',
    description: 'Bounce on click',
    recipe: {
      preset: 'bounce',
      trigger: 'click',
      loop: false,
      layerMode: 'individual',
      stagger: 0.05,
      intensity: 0.6,
    }
  },
  {
    id: 'slide-in',
    name: 'Slide In',
    icon: 'arrow-up',
    description: 'Slide up entrance',
    recipe: {
      preset: 'slide',
      trigger: 'auto',
      loop: false,
      layerMode: 'individual',
      stagger: 0.1,
      staggerType: 'by-index',
      intensity: 0.5,
    }
  },
  {
    id: 'entrance-pop',
    name: 'Entrance Pop',
    icon: 'maximize-2',
    description: 'Pop in with scale',
    recipe: {
      preset: 'pop',
      trigger: 'auto',
      loop: false,
      layerMode: 'individual',
      stagger: 0.12,
      staggerType: 'from-center',
      intensity: 0.6,
    }
  },
  {
    id: 'wiggle-alert',
    name: 'Wiggle Alert',
    icon: 'vibrate',
    description: 'Attention grabber',
    recipe: {
      preset: 'wiggle',
      trigger: 'hover',
      loop: false,
      layerMode: 'unified',
      intensity: 0.7,
    }
  },
];
// -----------------------------------------------------------------------------
// Path Transform (legacy - for per-path customization)
// -----------------------------------------------------------------------------

export interface PathTransform {
  initial: TransformState;
  final: TransformState;
  originX: number;     // 0-1, transform origin X
  originY: number;     // 0-1, transform origin Y
  transition?: TransitionConfig;
}

export const DEFAULT_PATH_TRANSFORM: PathTransform = {
  initial: { ...DEFAULT_TRANSFORM_STATE },
  final: { ...DEFAULT_TRANSFORM_STATE },
  originX: 0.5,
  originY: 0.5,
};

// -----------------------------------------------------------------------------
// Parsed SVG Data
// -----------------------------------------------------------------------------

export interface ParsedPath {
  id: string;
  d: string;
  originalFill: string | null;
  originalStroke: string | null;
  originalStrokeWidth: string | null;
  transform: string | null;
  length: number;
  visible: boolean;
  animation?: PathTransform;
}

export interface ParsedSVG {
  viewBox: string;
  width?: string;
  height?: string;
  paths: ParsedPath[];
  warnings: string[];
}

// -----------------------------------------------------------------------------
// Animation Settings (Global)
// -----------------------------------------------------------------------------

// Legacy stagger mode - maps to StaggerPattern
export type StaggerMode = 'none' | 'forward' | 'reverse' | 'from-center' | 'random';

export type EasingType = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'spring' | 'custom';

export type AnimationDirection = 'in' | 'out';

export interface GlobalTransform {
  initial: TransformState;
  final: TransformState;
}

export const DEFAULT_GLOBAL_TRANSFORM: GlobalTransform = {
  initial: { ...DEFAULT_TRANSFORM_STATE },
  final: { ...DEFAULT_TRANSFORM_STATE },
};

export interface AnimationSettings {
  duration: number; // seconds
  delay: number; // seconds
  staggerMode: StaggerMode;
  staggerAmount: number; // seconds total
  easing: EasingType;
  customEasing: string; // cubic-bezier values e.g., "0.68, -0.55, 0.27, 1.55"

  // Style overrides
  overrideColor: boolean;
  strokeColor: string;
  strokeWidth: number;
  useOriginalColors: boolean;
  forceStroke: boolean; // For fill-only icons
  lineCap: 'round' | 'butt' | 'square';
  lineJoin: 'round' | 'bevel' | 'miter';

  // Fill animation
  fillMode: 'none' | 'preserve' | 'fade-in';

  // Playback
  loop: boolean;

  // Transform trigger
  trigger: TriggerType;

  // Selected transform preset
  transformPreset: string | null; // preset id or null

  // Global Transform (applies to all paths)
  globalTransform: GlobalTransform;
  animationDirection: AnimationDirection;

  // Spring physics (when easing is 'spring')
  springStiffness: number;
  springDamping: number;
}

// -----------------------------------------------------------------------------
// Legacy Animation Preset (for stroke draw presets)
// -----------------------------------------------------------------------------

export interface AnimationPreset {
  name: string;
  settings: Partial<AnimationSettings>;
}

export const DEFAULT_PRESETS: AnimationPreset[] = [
  {
    name: 'Default',
    settings: {
      duration: 2,
      delay: 0.2,
      staggerMode: 'forward',
      staggerAmount: 0.3,
      easing: 'easeInOut',
    }
  },
  {
    name: 'Fast Draw',
    settings: {
      duration: 0.8,
      delay: 0,
      staggerMode: 'forward',
      staggerAmount: 0.1,
      easing: 'easeOut',
    }
  },
  {
    name: 'Slow Reveal',
    settings: {
      duration: 4,
      delay: 0.5,
      staggerMode: 'forward',
      staggerAmount: 0.5,
      easing: 'easeInOut',
      fillMode: 'fade-in',
    }
  },
  {
    name: 'Bounce',
    settings: {
      duration: 1.5,
      delay: 0,
      staggerMode: 'forward',
      staggerAmount: 0.2,
      easing: 'custom',
      customEasing: '0.68, -0.55, 0.27, 1.55',
    }
  },
  {
    name: 'Staggered',
    settings: {
      duration: 1,
      delay: 0,
      staggerMode: 'forward',
      staggerAmount: 0.6,
      easing: 'linear',
    }
  },
  {
    name: 'Minimal',
    settings: {
      duration: 1.2,
      delay: 0,
      staggerMode: 'none',
      staggerAmount: 0,
      easing: 'easeOut',
    }
  }
];

// -----------------------------------------------------------------------------
// Default Icon
// -----------------------------------------------------------------------------

export const DEFAULT_ICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/>
  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>
  <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/>
  <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>
</svg>`;