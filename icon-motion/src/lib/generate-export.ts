import { ParsedSVG, AnimationSettings, AnimationRecipe, StaggerType, PresetType } from '@/types';

export type ExportType = 'svg' | 'react' | 'css' | 'framer-motion' | 'framer-motion-pro' | 'gsap' | 'vue';

// -----------------------------------------------------------------------------
// Stagger Delay Calculator for Export
// Calculates animation delay based on stagger pattern
// -----------------------------------------------------------------------------

function calculateExportStaggerDelay(
  pathIndex: number,
  totalPaths: number,
  stagger: number,
  staggerType: StaggerType
): number {
  if (totalPaths <= 1) return 0;

  switch (staggerType) {
    case 'none':
      return 0;
    case 'by-index':
      return pathIndex * stagger;
    case 'by-index-reverse':
      return (totalPaths - 1 - pathIndex) * stagger;
    case 'from-center':
      const center = (totalPaths - 1) / 2;
      return Math.abs(pathIndex - center) * stagger;
    case 'random':
      const pseudoRandom = Math.abs(Math.sin(pathIndex * 12.9898 + 78.233) * 43758.5453) % 1;
      return pseudoRandom * totalPaths * stagger;
    case 'by-size':
      return pathIndex * stagger;
    default:
      return pathIndex * stagger;
  }
}

// -----------------------------------------------------------------------------
// Generate Preset-Specific Animation Variants
// -----------------------------------------------------------------------------

function getPresetVariants(preset: PresetType, intensity: number = 0.5): {
  initial: string;
  animate: string;
  hover: string;
} {
  switch (preset) {
    case 'draw':
      return {
        initial: '{ pathLength: 0, opacity: 0 }',
        animate: '{ pathLength: 1, opacity: 1 }',
        hover: '{ pathLength: [1, 0.3, 1], opacity: 1 }',
      };
    case 'pop':
      return {
        initial: '{ scale: 0, opacity: 0 }',
        animate: '{ scale: 1, opacity: 1 }',
        hover: `{ scale: [1, ${1 + 0.3 * intensity}, 1], opacity: 1 }`,
      };
    case 'wiggle':
      const angle = Math.round(20 * intensity);
      return {
        initial: '{ rotate: 0, opacity: 1 }',
        animate: `{ rotate: [0, -${angle}, ${angle}, -${angle}, 0], opacity: 1 }`,
        hover: `{ rotate: [0, -${angle}, ${angle}, -${angle}, 0], opacity: 1 }`,
      };
    case 'bounce':
      const bounceY = Math.round(20 * intensity);
      return {
        initial: `{ y: ${bounceY}, opacity: 1 }`,
        animate: `{ y: [${bounceY}, -8, 3, 0], opacity: 1 }`,
        hover: '{ y: [0, -8, 3, 0], opacity: 1 }',
      };
    case 'fade':
      return {
        initial: '{ opacity: 0 }',
        animate: '{ opacity: 1 }',
        hover: '{ opacity: [1, 0.5, 1] }',
      };
    case 'slide':
      const slideY = Math.round(15 * intensity);
      return {
        initial: `{ y: ${slideY}, opacity: 1 }`,
        animate: '{ y: 0, opacity: 1 }',
        hover: '{ y: [0, -5, 0], opacity: 1 }',
      };
    case 'spin':
      return {
        initial: '{ rotate: 0, opacity: 1 }',
        animate: '{ rotate: 360, opacity: 1 }',
        hover: '{ rotate: 360, opacity: 1 }',
      };
    case 'pulse':
      return {
        initial: '{ scale: 1, opacity: 1 }',
        animate: '{ scale: [1, 1.15, 1, 1.1, 1], opacity: 1 }',
        hover: '{ scale: [1, 1.15, 1, 1.1, 1], opacity: 1 }',
      };
    case 'draw-pop':
      return {
        initial: `{ pathLength: 0, scale: ${1 - 0.4 * intensity}, opacity: 0 }`,
        animate: '{ pathLength: 1, scale: 1, opacity: 1 }',
        hover: `{ scale: [1, ${1 + 0.2 * intensity}, 1], pathLength: 1, opacity: 1 }`,
      };
    default:
      return {
        initial: '{ opacity: 0 }',
        animate: '{ opacity: 1 }',
        hover: '{ opacity: 1 }',
      };
  }
}

interface ExportData {
  visiblePaths: Array<any>;
  cssKeyframes: string;
  classes: string;
  getPathAttrs: (path: any) => { d: string; fill: string; stroke: string; strokeWidth: number; transform: string | null };
  getDelay: (originalIndex: number) => number;
}

function generateExportData(parsedSVG: ParsedSVG, settings: AnimationSettings): ExportData {
  const visiblePaths = parsedSVG.paths.map((p, i) => ({ ...p, originalIndex: i })).filter(p => p.visible);

  // Compute the CSS easing value
  const easingValue = settings.easing === 'custom'
    ? `cubic-bezier(${settings.customEasing})`
    : settings.easing;

  const cssKeyframes = `
    @keyframes draw {
      to { stroke-dashoffset: 0; }
    }
    ${settings.fillMode === 'fade-in' ? `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }` : ''}
  `;

  const getDelay = (originalIndex: number) => {
    let delay = settings.delay;
    if (settings.staggerMode === 'forward') {
      delay += originalIndex * (settings.staggerAmount || 0);
    } else if (settings.staggerMode === 'reverse') {
      delay += (parsedSVG.paths.length - 1 - originalIndex) * (settings.staggerAmount || 0);
    }
    return delay;
  };

  const classes = visiblePaths.map((path) => {
    const className = `path-${path.originalIndex}`;
    const delay = getDelay(path.originalIndex);
    const fillAnim = settings.fillMode === 'fade-in'
      ? `, fadeIn ${settings.duration}s ease forwards ${delay + settings.duration * 0.8}s`
      : '';
    const loop = settings.loop ? 'infinite alternate' : 'forwards';

    return `
      .${className} {
        stroke-dasharray: ${path.length.toFixed(1)};
        stroke-dashoffset: ${path.length.toFixed(1)};
        animation: draw ${settings.duration}s ${easingValue} ${delay}s ${loop}${fillAnim};
        ${settings.fillMode === 'fade-in' ? 'opacity: 0;' : ''}
      }`;
  }).join('\n');

  const getPathAttrs = (path: any) => {
    let fill = path.originalFill || 'currentColor';
    if (settings.forceStroke || settings.fillMode === 'none') fill = 'none';

    let stroke = settings.overrideColor ? settings.strokeColor : (path.originalStroke || 'currentColor');
    let strokeWidth = settings.overrideColor ? settings.strokeWidth : parseFloat(path.originalStrokeWidth) || 1;

    if (settings.forceStroke && !path.originalStroke && !settings.overrideColor) {
      stroke = 'currentColor';
      strokeWidth = 2;
    }

    return {
      d: path.d,
      fill,
      stroke,
      strokeWidth,
      transform: path.transform || null
    };
  };

  return { visiblePaths, cssKeyframes, classes, getPathAttrs, getDelay };
}

export function generateExport(parsedSVG: ParsedSVG, settings: AnimationSettings, type: ExportType): string {
  const { visiblePaths, cssKeyframes, classes, getPathAttrs, getDelay } = generateExportData(parsedSVG, settings);

  if (type === 'css') {
    return `${cssKeyframes}\n${classes}`;
  }

  if (type === 'svg') {
    const paths = visiblePaths.map((path) => {
      const attrs = getPathAttrs(path);
      return `  <path class="path-${path.originalIndex}" d="${attrs.d}" fill="${attrs.fill}" stroke="${attrs.stroke}" stroke-width="${attrs.strokeWidth}" stroke-linecap="${settings.lineCap}" stroke-linejoin="${settings.lineJoin}"${attrs.transform ? ` transform="${attrs.transform}"` : ''} />`;
    }).join('\n');

    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${parsedSVG.viewBox}">
  <style>
    ${cssKeyframes.replace(/\s+/g, ' ')}
    ${classes.replace(/\s+/g, ' ')}
  </style>
${paths}
</svg>`;
  }

  if (type === 'react') {
    const paths = visiblePaths.map((path) => {
      const attrs = getPathAttrs(path);
      return `      <path className="path-${path.originalIndex}" d="${attrs.d}" fill="${attrs.fill}" stroke="${attrs.stroke}" strokeWidth="${attrs.strokeWidth}" strokeLinecap="${settings.lineCap}" strokeLinejoin="${settings.lineJoin}"${attrs.transform ? ` transform="${attrs.transform}"` : ''} />`;
    }).join('\n');

    return `import React from 'react';

const AnimatedIcon = () => {
  return (
    <svg viewBox="${parsedSVG.viewBox}" style={{ width: '100%', height: '100%' }}>
      <style>{\`
        ${cssKeyframes}
        ${classes}
      \`}</style>
${paths}
    </svg>
  );
};

export default AnimatedIcon;`;
  }

  if (type === 'framer-motion') {
    const isInteractive = settings.trigger && settings.trigger !== 'auto';

    // Variants generation
    const paths = visiblePaths.map((path) => {
      const attrs = getPathAttrs(path);
      const delay = getDelay(path.originalIndex);

      // Determine variants
      const hasTransform = isInteractive && path.animation;

      const variants = hasTransform ? `
        variants={{
          initial: { 
            x: 0, y: 0, scale: 1, rotate: 0, opacity: 1,
            pathLength: 0${settings.fillMode === 'fade-in' ? ', opacity: 0' : ''}
          },
          animate: {
            pathLength: 1${settings.fillMode === 'fade-in' ? ', opacity: 1' : ''},
            transition: {
                pathLength: { duration: ${settings.duration}, delay: ${delay}, ease: ${settings.easing === 'custom' ? `[${settings.customEasing}]` : `"${settings.easing}"`} }${settings.fillMode === 'fade-in' ? `,
                opacity: { duration: ${settings.duration * 0.5}, delay: ${delay + settings.duration * 0.5} }` : ''}
            }
          },
          active: {
            x: ${path.animation?.x || 0}, 
            y: ${path.animation?.y || 0}, 
            scale: ${path.animation?.scale ?? 1}, 
            rotate: ${path.animation?.rotate || 0}, 
            opacity: ${path.animation?.opacity ?? 1},
            pathLength: 1, // Ensure stroke is complete
            transition: { duration: 0.2 }
          }
        }}` : `
        initial={{ pathLength: 0${settings.fillMode === 'fade-in' ? ', opacity: 0' : ''} }}
        animate={{ pathLength: 1${settings.fillMode === 'fade-in' ? ', opacity: 1' : ''} }}
        transition={{
          pathLength: { duration: ${settings.duration}, delay: ${delay}, ease: ${settings.easing === 'custom' ? `[${settings.customEasing}]` : `"${settings.easing}"`} },${settings.fillMode === 'fade-in' ? `
          opacity: { duration: ${settings.duration * 0.5}, delay: ${delay + settings.duration * 0.5} },` : ''}
        }}`;

      return `      <motion.path
        d="${attrs.d}"
        fill="${attrs.fill}"
        stroke="${attrs.stroke}"
        strokeWidth="${attrs.strokeWidth}"
        strokeLinecap="${settings.lineCap}"
        strokeLinejoin="${settings.lineJoin}"
        ${variants}
      />`;
    }).join('\n');

    const wrapperProps = isInteractive ? `
      initial="initial"
      animate="animate"
      whileHover="${settings.trigger === 'hover' ? 'active' : undefined}"
      whileTap="${settings.trigger === 'click' ? 'active' : undefined}"` : '';

    return `import { motion } from 'framer-motion';

const AnimatedIcon = () => {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', placeItems: 'center', placeContent: 'center' }}>
      <motion.svg 
        viewBox="${parsedSVG.viewBox}" 
        style={{ width: '100%', height: '100%', overflow: 'visible' }}
        ${wrapperProps}
      >
${paths}
      </motion.svg>
    </div>
  );
};

export default AnimatedIcon;`;
  }

  if (type === 'gsap') {
    const pathRefs = visiblePaths.map((_, i) => `path${i}Ref`).join(', ');
    const refDeclarations = visiblePaths.map((_, i) => `  const path${i}Ref = useRef<SVGPathElement>(null);`).join('\n');

    const tlAnimations = visiblePaths.map((path, i) => {
      const delay = getDelay(path.originalIndex);
      return `    tl.to(path${i}Ref.current, { strokeDashoffset: 0, duration: ${settings.duration}, ease: ${settings.easing === 'custom' ? `"power2.inOut"` : `"${settings.easing}"`} }, ${delay});`;
    }).join('\n');

    const paths = visiblePaths.map((path, i) => {
      const attrs = getPathAttrs(path);
      return `      <path
        ref={path${i}Ref}
        d="${attrs.d}"
        fill="${attrs.fill}"
        stroke="${attrs.stroke}"
        strokeWidth="${attrs.strokeWidth}"
        strokeLinecap="${settings.lineCap}"
        strokeLinejoin="${settings.lineJoin}"
        style={{ strokeDasharray: ${path.length.toFixed(1)}, strokeDashoffset: ${path.length.toFixed(1)} }}
      />`;
    }).join('\n');

    return `import { useRef, useEffect } from 'react';
import gsap from 'gsap';

const AnimatedIcon = () => {
${refDeclarations}

  useEffect(() => {
    const tl = gsap.timeline(${settings.loop ? '{ repeat: -1, yoyo: true }' : ''});
${tlAnimations}
  }, []);

  return (
    <svg viewBox="${parsedSVG.viewBox}" style={{ width: '100%', height: '100%' }}>
${paths}
    </svg>
  );
};

export default AnimatedIcon;`;
  }

  if (type === 'vue') {
    const paths = visiblePaths.map((path) => {
      const attrs = getPathAttrs(path);
      return `    <path class="path-${path.originalIndex}" d="${attrs.d}" fill="${attrs.fill}" stroke="${attrs.stroke}" stroke-width="${attrs.strokeWidth}" stroke-linecap="${settings.lineCap}" stroke-linejoin="${settings.lineJoin}"${attrs.transform ? ` transform="${attrs.transform}"` : ''} />`;
    }).join('\n');

    return `<template>
  <svg viewBox="${parsedSVG.viewBox}" class="animated-icon">
${paths}
  </svg>
</template>

<style scoped>
${cssKeyframes}
${classes}

.animated-icon {
  width: 100%;
  height: 100%;
}
</style>`;
  }

  return '';
}

/**
 * Download SVG as a file
 */
export function downloadSVG(content: string, filename: string = 'animated-icon.svg') {
  const blob = new Blob([content], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
/**
 * Generate Panel Morph Icon export
 * Special export for the panel toggle animation preset
 */
function generatePanelMorphExport(
  settings: AnimationSettings,
  recipe: AnimationRecipe,
  componentName: string = 'PanelMorphIcon'
): string {
  const strokeColor = settings.overrideColor ? settings.strokeColor : 'currentColor';
  const strokeWidth = settings.overrideColor ? settings.strokeWidth : 2;

  return `"use client";

import React, { forwardRef, useImperativeHandle, useState } from "react";
import { motion } from "framer-motion";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TriggerType = "auto" | "hover" | "click" | "manual";

export interface ${componentName}Props {
  /** Width and height of the icon in pixels */
  size?: number;
  /** Icon color (stroke and fill) */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Animation trigger type */
  trigger?: TriggerType;
  /** Whether to start in expanded state */
  defaultExpanded?: boolean;
  /** Additional CSS class name */
  className?: string;
}

export interface ${componentName}Ref {
  /** Toggle the expanded state */
  toggle: () => void;
  /** Expand the panel */
  expand: () => void;
  /** Collapse the panel */
  collapse: () => void;
}

// =============================================================================
// PANEL MORPH ICON COMPONENT
// Morphs between PanelRight (collapsed) and filled panel (expanded)
// =============================================================================

export const ${componentName} = forwardRef<${componentName}Ref, ${componentName}Props>(
  (
    {
      size = 24,
      color = "${strokeColor}",
      strokeWidth = ${strokeWidth},
      trigger = "${recipe.trigger}",
      defaultExpanded = false,
      className,
    },
    ref
  ) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    const springTransition = {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    };

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      toggle: () => setIsExpanded((prev) => !prev),
      expand: () => setIsExpanded(true),
      collapse: () => setIsExpanded(false),
    }));

    // Event handlers
    const handleMouseEnter = () => {
      if (trigger === "hover") setIsExpanded(true);
    };

    const handleMouseLeave = () => {
      if (trigger === "hover") setIsExpanded(false);
    };

    const handleClick = () => {
      if (trigger === "click") setIsExpanded((prev) => !prev);
    };

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{ cursor: trigger !== "auto" && trigger !== "manual" ? "pointer" : "default" }}
      >
        {/* Outer rounded rect - always visible */}
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />

        {/* Divider line - stays static */}
        <line
          x1={15}
          y1={3}
          x2={15}
          y2={21}
        />

        {/* Fill panel - expands from right edge inward */}
        <motion.rect
          y="3"
          rx="0"
          ry="0"
          fill={color}
          stroke="none"
          animate={{
            x: isExpanded ? 15 : 21,
            width: isExpanded ? 6 : 0,
            height: 18,
            opacity: isExpanded ? 1 : 1,
          }}
          transition={springTransition}
        />
      </svg>
    );
  }
);

${componentName}.displayName = "${componentName}";

export default ${componentName};

// =============================================================================
// USAGE EXAMPLE
// =============================================================================
/*
import { ${componentName}, type ${componentName}Ref } from "./${componentName}";
import { useRef } from "react";

function App() {
  const iconRef = useRef<${componentName}Ref>(null);

  return (
    <>
      {/* Toggle on hover */}
      <${componentName} size={32} color="#6366f1" trigger="hover" />

      {/* Toggle on click */}
      <${componentName} size={24} trigger="click" />

      {/* Manual control via ref */}
      <${componentName} ref={iconRef} trigger="manual" />
      <button onClick={() => iconRef.current?.toggle()}>Toggle</button>
      <button onClick={() => iconRef.current?.expand()}>Expand</button>
      <button onClick={() => iconRef.current?.collapse()}>Collapse</button>
    </>
  );
}
*/
`;
}

/**
 * Generate production-ready React component with TypeScript
 * Includes: configurable props, imperative ref, trigger support
 * NOW SUPPORTS: All presets (draw, pop, wiggle, bounce, spin, etc.) from recipe
 */
export function generateProExport(
  parsedSVG: ParsedSVG,
  settings: AnimationSettings,
  recipe: AnimationRecipe,
  componentName: string = 'AnimatedIcon'
): string {
  // Special handling for Panel morph preset
  if (recipe.preset === 'panel') {
    return generatePanelMorphExport(settings, recipe, componentName);
  }

  const { visiblePaths, getPathAttrs } = generateExportData(parsedSVG, settings);
  const totalPaths = visiblePaths.length;

  // Get preset-specific animation variants
  const variants = getPresetVariants(recipe.preset, recipe.intensity);

  // Determine if we're animating the SVG wrapper (unified) or individual paths
  const isUnified = recipe.layerMode === 'unified';

  // Get transition config
  const duration = recipe.transition?.duration ?? recipe.duration;
  const ease = recipe.transition?.ease ?? recipe.easing;

  // Determine if spin/pulse presets need continuous animation
  const isContinuous = recipe.preset === 'spin' || recipe.preset === 'pulse';

  // Generate path elements with proper animations
  const pathElements = visiblePaths.map((path, index) => {
    const attrs = getPathAttrs(path);
    const delay = calculateExportStaggerDelay(index, totalPaths, recipe.stagger, recipe.staggerType);

    // For unified mode, paths don't have individual animations
    if (isUnified) {
      return `        <motion.path
          key="${index}"
          d="${attrs.d}"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />`;
    }

    // Individual mode - each path animates with its own delay
    return `        <motion.path
          key="${index}"
          d="${attrs.d}"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={${variants.initial}}
          animate={isAnimating ? ${variants.animate} : ${variants.initial}}
          transition={{
            duration: duration / 1000,
            delay: ${delay.toFixed(3)} * speedMultiplier,
            ease: "${ease}"${isContinuous && recipe.loop ? ',\n            repeat: Infinity,\n            repeatType: "loop"' : ''}
          }}
          style={{ transformOrigin: "center", transformBox: "fill-box" }}
        />`;
  }).join('\n');

  // SVG wrapper animation for unified mode
  const svgAnimation = isUnified ? `
        initial={${variants.initial}}
        animate={isAnimating ? ${variants.animate} : ${variants.initial}}
        transition={{
          duration: duration / 1000,
          ease: "${ease}"${isContinuous && recipe.loop ? ',\n          repeat: Infinity,\n          repeatType: "loop"' : ''}
        }}` : '';

  return `"use client";

import React, { forwardRef, useImperativeHandle, useState, useEffect } from "react";
import { motion } from "framer-motion";

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

export type TriggerType = "auto" | "hover" | "click" | "manual";

export interface ${componentName}Props {
  /** Width and height of the icon in pixels */
  size?: number;
  /** Icon color (stroke and fill) */
  color?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Animation trigger type */
  trigger?: TriggerType;
  /** Animation duration in milliseconds */
  duration?: number;
  /** Delay before animation starts in milliseconds */
  delay?: number;
  /** Whether to loop the animation */
  loop?: boolean;
  /** Additional CSS class name */
  className?: string;
}

export interface ${componentName}Ref {
  /** Start the animation */
  animate: () => void;
  /** Reset to initial state */
  reset: () => void;
}

// =============================================================================
// COMPONENT
// Preset: ${recipe.preset} | Layer Mode: ${recipe.layerMode} | Trigger: ${recipe.trigger}
// =============================================================================

export const ${componentName} = forwardRef<${componentName}Ref, ${componentName}Props>(
  (
    {
      size = 24,
      color = "currentColor",
      strokeWidth = 2,
      trigger = "${recipe.trigger}",
      duration = ${Math.round(duration * 1000)},
      delay = 0,
      loop = ${recipe.loop},
      className,
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(trigger === "auto");
    const speedMultiplier = duration / ${Math.round(duration * 1000)};
    
    const fill = "none";
    const stroke = color;

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      animate: () => setIsAnimating(true),
      reset: () => setIsAnimating(false),
    }));

    // Handle auto trigger
    useEffect(() => {
      if (trigger === "auto") {
        const timer = setTimeout(() => setIsAnimating(true), delay);
        return () => clearTimeout(timer);
      }
    }, [trigger, delay]);

    // Handle loop (for non-continuous animations)
    useEffect(() => {
      if (loop && isAnimating && ${!isContinuous}) {
        const totalDuration = duration + ${Math.round(recipe.stagger * 1000 * totalPaths)};
        const timer = setTimeout(() => {
          setIsAnimating(false);
          setTimeout(() => setIsAnimating(true), 100);
        }, totalDuration);
        return () => clearTimeout(timer);
      }
    }, [loop, isAnimating, duration]);

    // Event handlers
    const handleHover = () => {
      if (trigger === "hover" && !isAnimating) {
        setIsAnimating(true);
      }
    };

    const handleHoverEnd = () => {
      if (trigger === "hover") {
        setIsAnimating(false);
      }
    };

    const handleClick = () => {
      if (trigger === "click") {
        setIsAnimating(!isAnimating);
      }
    };

    return (
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="${parsedSVG.viewBox}"
        width={size}
        height={size}
        fill="none"
        className={className}
        onMouseEnter={handleHover}
        onMouseLeave={handleHoverEnd}
        onClick={handleClick}
        style={{ cursor: trigger !== "auto" && trigger !== "manual" ? "pointer" : "default", transformOrigin: "center" }}${svgAnimation}
      >
${pathElements}
      </motion.svg>
    );
  }
);

${componentName}.displayName = "${componentName}";

export default ${componentName};

// =============================================================================
// USAGE EXAMPLE
// =============================================================================
/*
import { ${componentName}, type ${componentName}Ref } from "./${componentName}";
import { useRef } from "react";

function App() {
  const iconRef = useRef<${componentName}Ref>(null);

  return (
    <>
      {/* Auto-animate on load */}
      <${componentName} size={32} color="#6366f1" trigger="auto" />

      {/* Animate on hover */}
      <${componentName} size={24} trigger="hover" />

      {/* Animate on click */}
      <${componentName} size={48} trigger="click" loop />

      {/* Manual control via ref */}
      <${componentName} ref={iconRef} trigger="manual" />
      <button onClick={() => iconRef.current?.animate()}>Play</button>
      <button onClick={() => iconRef.current?.reset()}>Reset</button>
    </>
  );
}
*/
`;
}