import { ParsedSVG, AnimationSettings } from '@/types';

export type ExportType = 'svg' | 'react' | 'css' | 'framer-motion' | 'framer-motion-pro' | 'gsap' | 'vue';

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
 * Generate production-ready React component with TypeScript
 * Includes: configurable props, imperative ref, trigger support
 */
export function generateProExport(
  parsedSVG: ParsedSVG,
  settings: AnimationSettings,
  componentName: string = 'AnimatedIcon'
): string {
  const { visiblePaths, getPathAttrs, getDelay } = generateExportData(parsedSVG, settings);

  // Generate path elements
  const pathElements = visiblePaths.map((path, index) => {
    const attrs = getPathAttrs(path);
    const delay = getDelay(path.originalIndex);

    return `        <motion.path
          key="${index}"
          d="${attrs.d}"
          fill={fill}
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          transition={{
            pathLength: { duration: duration / 1000, delay: ${delay} * speedMultiplier, ease: "easeOut" },
            opacity: { duration: 0.15, delay: ${delay} * speedMultiplier }
          }}
        />`;
  }).join('\n');

  return `"use client";

import React, { forwardRef, useImperativeHandle, useState, useCallback, useEffect } from "react";
import { motion, useAnimation, AnimationControls } from "framer-motion";

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
  /** Pause the animation */
  pause: () => void;
  /** Resume a paused animation */
  resume: () => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

export const ${componentName} = forwardRef<${componentName}Ref, ${componentName}Props>(
  (
    {
      size = 24,
      color = "currentColor",
      strokeWidth = 2,
      trigger = "${settings.trigger || 'auto'}",
      duration = ${Math.round(settings.duration * 1000)},
      delay = 0,
      loop = ${settings.loop},
      className,
    },
    ref
  ) => {
    const [isAnimating, setIsAnimating] = useState(trigger === "auto");
    const speedMultiplier = duration / ${Math.round(settings.duration * 1000)};
    
    const fill = "none";
    const stroke = color;

    // Expose imperative methods
    useImperativeHandle(ref, () => ({
      animate: () => setIsAnimating(true),
      reset: () => setIsAnimating(false),
      pause: () => {/* Framer Motion doesn't support pause natively */},
      resume: () => {/* Framer Motion doesn't support resume natively */},
    }));

    // Handle auto trigger
    useEffect(() => {
      if (trigger === "auto") {
        const timer = setTimeout(() => setIsAnimating(true), delay);
        return () => clearTimeout(timer);
      }
    }, [trigger, delay]);

    // Handle loop
    useEffect(() => {
      if (loop && isAnimating) {
        const totalDuration = duration + ${Math.round((settings.staggerAmount || 0) * 1000 * visiblePaths.length)};
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
        style={{ cursor: trigger !== "auto" && trigger !== "manual" ? "pointer" : "default" }}
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
      {/* Auto-animate on load *}
      <${componentName} size={32} color="#6366f1" trigger="auto" />

      {/* Animate on hover *}
      <${componentName} size={24} trigger="hover" />

      {/* Animate on click *}
      <${componentName} size={48} trigger="click" loop />

      {/* Manual control via ref *}
      <${componentName} ref={iconRef} trigger="manual" />
      <button onClick={() => iconRef.current?.animate()}>Play</button>
      <button onClick={() => iconRef.current?.reset()}>Reset</button>
    </>
  );
}
*/
`;
}