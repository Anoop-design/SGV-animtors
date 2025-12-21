'use client';

import React, { useEffect, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { ParsedSVG, AnimationSettings, AnimationRecipe, PresetType, DEFAULT_RECIPE } from '@/types';
import { RotateCcw, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { motion, Variants, Easing } from 'framer-motion';
import '@/styles.css';

// Available icon sizes for the size dropdown
const ICON_SIZES = [16, 24, 32, 48, 64, 96];

// -----------------------------------------------------------------------------
// getPathVariants - Generates Framer Motion variants based on recipe preset
// Per new-presets.md architecture: Draw (pathLength), Pop (scale), Wiggle (rotate)
// Now includes 'hover' variant for hover trigger animations
// -----------------------------------------------------------------------------

function getPathVariants(
  recipe: AnimationRecipe,
  pathIndex: number
): Variants {
  const delay = pathIndex * recipe.stagger;

  // Common transition for most presets
  const baseTransition = {
    duration: recipe.duration,
    ease: recipe.easing as Easing,
    delay,
  };

  switch (recipe.preset) {
    case 'draw':
      // Draw: stroke draws on progressively
      return {
        idle: {
          pathLength: 0,
          opacity: 1,
        },
        play: {
          pathLength: 1,
          opacity: 1,
          transition: {
            pathLength: { duration: recipe.duration, ease: 'linear', delay },
          },
        },
        hover: {
          pathLength: [1, 0.3, 1],  // Partial redraw effect on hover
          opacity: 1,
          transition: {
            pathLength: { duration: recipe.duration * 1.5, ease: 'easeInOut', delay },
          },
        },
      };

    case 'pop':
      // Pop: scale from 0 to 1 with opacity
      return {
        idle: {
          scale: 0,
          opacity: 0
        },
        play: {
          scale: 1,
          opacity: 1,
          transition: baseTransition,
        },
        hover: {
          scale: [1, 1.15, 1],  // Pulse effect on hover
          opacity: 1,
          transition: { duration: recipe.duration * 0.8, ease: 'easeInOut', delay },
        },
      };

    case 'wiggle':
      // Wiggle: shake back and forth (icon should be visible in idle)
      const angle = 10 * recipe.intensity;
      return {
        idle: {
          rotate: 0,
          opacity: 1,
        },
        play: {
          rotate: [0, -angle, angle, -angle, 0],
          opacity: 1,
          transition: baseTransition,
        },
        hover: {
          rotate: [0, -angle, angle, -angle, 0],  // Same wiggle on hover
          opacity: 1,
          transition: baseTransition,
        },
      };

    case 'bounce':
      // Bounce: spring up from below
      return {
        idle: {
          scale: 0.8,
          y: 10,
          opacity: 0
        },
        play: {
          scale: 1,
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 10,
            delay,
          },
        },
        hover: {
          y: [0, -8, 0],  // Small bounce on hover
          scale: 1,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 10,
            delay,
          },
        },
      };

    case 'draw-pop':
      // Draw+Pop: draw first, then scale/pop
      return {
        idle: {
          pathLength: 0,
          scale: 0.8,
          opacity: 0,
        },
        play: {
          pathLength: 1,
          scale: 1,
          opacity: 1,
          transition: {
            pathLength: { duration: recipe.duration * 0.6, ease: 'linear', delay },
            scale: { duration: recipe.duration * 0.4, ease: 'easeOut', delay: delay + recipe.duration * 0.5 },
            opacity: { duration: 0.2, delay },
          },
        },
        hover: {
          scale: [1, 1.1, 1],  // Pulse effect on hover
          pathLength: 1,
          opacity: 1,
          transition: { duration: recipe.duration * 0.8, ease: 'easeInOut', delay },
        },
      };

    case 'none':
      // None: no animation, just visible
      return {
        idle: { opacity: 1 },
        play: { opacity: 1 },
        hover: { opacity: 1 },
      };

    default:
      // Default: just visible
      return {
        idle: { opacity: 1 },
        play: { opacity: 1 },
        hover: { opacity: 1 },
      };
  }
}

// -----------------------------------------------------------------------------
// Preview Props & Component
// -----------------------------------------------------------------------------

interface PreviewProps {
  parsedSVG: ParsedSVG;
  settings: AnimationSettings;
  updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
  updatePathLength: (index: number, length: number) => void;
  hoveredPathIndex: number | null;
  selectedPathIndex?: number | null;
  onSelectPath?: (index: number | null) => void;
  onHoverPath?: (index: number | null) => void;
  // AnimationRecipe - the current animation configuration
  recipe: AnimationRecipe;
}

export interface PreviewHandle {
  togglePlay: () => void;
  handleReplay: () => void;
}

type BackgroundType = 'dotted' | 'white' | 'black' | 'custom';

/**
 * Preview Component
 * 
 * The main canvas area showing the animated SVG.
 * 
 * CSS Classes used (see styles.css for customization):
 * - .preview-panel: Outer container
 * - .preview-header: Header with title and background controls
 * - .preview-canvas: SVG display area with configurable background
 * - .timeline-container: Bottom controls area
 * - .timeline-scrubber: Time display + slider row
 * - .playback-buttons: Play/pause/restart buttons
 */
export const Preview = forwardRef<PreviewHandle, PreviewProps>(({
  parsedSVG,
  settings,
  updateSetting,
  updatePathLength,
  hoveredPathIndex,
  selectedPathIndex,
  onSelectPath,
  onHoverPath,
  recipe
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation state
  const [animationKey, setAnimationKey] = useState(() => Date.now()); // Unique key for remount
  const [animateState, setAnimateState] = useState<'idle' | 'play'>('play'); // For controlling animation

  // New: Selected size for the size strip (larger default)
  const [selectedSize, setSelectedSize] = useState(96);

  // Background state
  const [bgType, setBgType] = useState<BackgroundType>('dotted');
  const [customColor, setCustomColor] = useState('#6366f1');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const zoomReset = () => setZoom(1);

  // Measure paths when SVG structure changes
  // IMPORTANT: Only measure paths with .animating-path class to avoid counting
  // hit-area and highlight paths which would cause index mismatches
  useEffect(() => {
    if (!containerRef.current) return;
    const paths = containerRef.current.querySelectorAll('.animating-path');
    paths.forEach((path, index) => {
      try {
        const len = (path as SVGPathElement).getTotalLength();
        updatePathLength(index, len);
      } catch (e) {
        console.warn("Could not measure path length", e);
      }
    });
  }, [parsedSVG.paths.length, parsedSVG.paths.map(p => p.d).join('')]);

  // Reset animation when SVG changes
  useEffect(() => {
    setAnimationKey(Date.now());
    // For auto trigger, animate. For hover/click, show final state
    setAnimateState(recipe.trigger === 'auto' ? 'play' : 'play');
  }, [parsedSVG.paths.length]);

  // Re-trigger animation when recipe changes
  // For auto: animate from idle to play
  // For hover/click: just update key, icon stays in play state
  useEffect(() => {
    setAnimationKey(Date.now());
    // Always animate once when settings change (so user can preview)
    setAnimateState('play');
  }, [recipe.preset, recipe.duration, recipe.stagger, recipe.easing, recipe.intensity, recipe.trigger]);

  // Replay handler - works for all triggers
  const handleReplay = () => {
    // Reset to idle, then animate to play
    setAnimateState('idle');
    setAnimationKey(Date.now());

    // Small delay to ensure idle state is applied, then trigger play
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setAnimateState('play');
      });
    });
  };

  // Handle click trigger on the SVG
  const handleClickTrigger = () => {
    if (recipe.trigger !== 'click') return;
    handleReplay();
  };

  // Expose methods via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    togglePlay: handleReplay,
    handleReplay,
  }));

  // Generate dynamic styles for the preview
  const styles = useMemo(() => {
    const css: React.CSSProperties = {};
    // @ts-ignore
    css['--duration'] = `${settings.duration}s`;
    // @ts-ignore
    css['--ease'] = settings.easing === 'custom'
      ? `cubic-bezier(${settings.customEasing})`
      : settings.easing;
    return css;
  }, [settings]);

  // Get canvas background style based on selected type
  const getCanvasClassName = () => {
    let className = 'preview-canvas';
    if (bgType === 'dotted') {
      className += ' preview-canvas-dotted';
    }
    return className;
  };

  const getCanvasStyle = (): React.CSSProperties => {
    if (bgType === 'white') {
      return { backgroundColor: '#ffffff' };
    } else if (bgType === 'black') {
      return { backgroundColor: '#000000' };
    } else if (bgType === 'custom') {
      return { backgroundColor: customColor };
    }
    return {};
  };

  // Background options for segmented control
  const bgOptions: { value: BackgroundType; title: string }[] = [
    { value: 'dotted', title: 'Dotted pattern' },
    { value: 'white', title: 'White background' },
    { value: 'black', title: 'Black background' },
    { value: 'custom', title: 'Custom color' },
  ];
  const selectedBgIndex = bgOptions.findIndex(opt => opt.value === bgType);

  return (
    <div className="preview-panel">
      {/* Header */}
      <div className="preview-header">
        <span className="preview-header-title">Preview</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Replay Button */}
          <button
            className="preview-replay-btn"
            onClick={handleReplay}
            title="Replay Animation (R)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              border: '1px solid var(--border-default)',
              borderRadius: '6px',
              background: 'var(--bg-button)',
              color: 'var(--text-primary)',
              fontSize: '12px',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            <span>Replay</span>
          </button>

          {/* Size Dropdown - shows actual pixel size */}
          <div style={{ width: '90px' }}>
            <Dropdown
              value={String(selectedSize)}
              onChange={(val) => setSelectedSize(parseInt(val, 10))}
              options={ICON_SIZES.map(size => ({
                value: String(size),
                label: `${size}px`
              }))}
            />
          </div>

          {/* Background Dropdown */}
          <div style={{ width: '140px' }}>
            <Dropdown
              value={bgType}
              onChange={(val) => {
                setBgType(val as BackgroundType);
                if (val === 'custom') {
                  setShowColorPicker(true);
                } else {
                  setShowColorPicker(false);
                }
              }}
              options={[
                {
                  value: 'dotted',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="preview-bg-swatch" style={{
                        border: '1px solid var(--border-default)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.5 }}>
                          <circle cx="2" cy="2" r="1" />
                          <circle cx="6" cy="2" r="1" />
                          <circle cx="10" cy="2" r="1" />
                          <circle cx="2" cy="6" r="1" />
                          <circle cx="6" cy="6" r="1" />
                          <circle cx="10" cy="6" r="1" />
                          <circle cx="2" cy="10" r="1" />
                          <circle cx="6" cy="10" r="1" />
                          <circle cx="10" cy="10" r="1" />
                        </svg>
                      </div>
                      <span>Dotted</span>
                    </div>
                  )
                },
                {
                  value: 'white',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="preview-bg-swatch preview-bg-swatch-white" />
                      <span>White</span>
                    </div>
                  )
                },
                {
                  value: 'black',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="preview-bg-swatch preview-bg-swatch-black" />
                      <span>Black</span>
                    </div>
                  )
                },
                {
                  value: 'custom',
                  label: (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="preview-bg-swatch" style={{ backgroundColor: customColor, border: '1px solid var(--border-default)' }} />
                      <span>Custom</span>
                    </div>
                  )
                }
              ]}
            />
          </div>

          {/* Color Picker Trigger (Only visible when Custom is active) */}
          {bgType === 'custom' && (
            <div style={{ position: 'relative' }}>
              <button
                className="preview-bg-option"
                style={{
                  width: '36px', height: '36px',
                  border: '1px solid var(--border-default)',
                  borderRadius: '8px',
                  padding: '4px',
                  backgroundColor: 'var(--bg-input)'
                }}
                onClick={() => setShowColorPicker(!showColorPicker)}
                title="Change color"
              >
                <div style={{ width: '100%', height: '100%', backgroundColor: customColor, borderRadius: '4px' }} />
              </button>

              {/* Color Picker Dropdown */}
              {showColorPicker && (
                <>
                  <div
                    className="preview-color-backdrop"
                    onClick={() => setShowColorPicker(false)}
                  />
                  <div className="preview-color-dropdown" style={{ right: 0, top: '40px' }}>
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="preview-color-picker"
                    />
                    <input
                      type="text"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      className="preview-color-text"
                      placeholder="#000000"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </div>

      </div>

      {/* Canvas Area */}
      <div className={getCanvasClassName()} style={getCanvasStyle()}>
        <div
          ref={containerRef}
          onClick={() => onSelectPath && onSelectPath(null)} // Deselect when clicking background
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {/* Framer Motion Wrapper for Interaction */}
          <motion.div
            style={{
              width: '100%',
              height: '100%',
              maxWidth: 400,
              maxHeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            initial="initial"
            animate="animate"
            whileHover={settings.trigger === 'hover' ? 'active' : undefined}
            whileTap={settings.trigger === 'click' ? 'active' : undefined}
          // For appear, we just animate to 'initial' from 'active' usually, or vice versa.
          // But user requested: Appear -> Animate FROM Target TO Default.
          // Actually, standard is usually: Initial (hidden/offset) -> Animate (visible/reset).
          // Let's stick to the plan:
          // Hover/Click: Default -> Active
          // Appear: Active -> Default (Wait, "Appear" usually means entering viewport. Let's assume on load for now).
          >
            <motion.svg
              viewBox={parsedSVG.viewBox}
              className="preview-svg"
              style={{
                ...styles,
                width: `${selectedSize}px`,
                height: `${selectedSize}px`,
                overflow: 'visible' // Allow transforms to go outside
              }}
            >
              {parsedSVG.paths.map((path, index) => {
                if (!path.visible) return null;

                // Calculate Delay (for stroke animation)
                let delay = settings.delay;
                if (settings.staggerMode === 'forward') {
                  delay += index * (settings.staggerAmount || 0);
                } else if (settings.staggerMode === 'reverse') {
                  delay += (parsedSVG.paths.length - 1 - index) * (settings.staggerAmount || 0);
                }

                // Calculate Fill
                let fill = path.originalFill || 'currentColor';
                if (settings.forceStroke || settings.fillMode === 'none') {
                  fill = 'none';
                }

                // Fill Animation logic
                const fadeDelay = delay + settings.duration * 0.8;
                const hasFade = settings.fillMode === 'fade-in';

                // Current Path Logic
                const strokeColor = settings.overrideColor ? settings.strokeColor : (path.originalStroke || 'currentColor');
                const strokeWidth = settings.overrideColor ? settings.strokeWidth : (parseFloat(path.originalStrokeWidth || '1') || 1);

                const len = path.length || 1000;
                const isHovered = hoveredPathIndex === index;
                const isSelected = selectedPathIndex === index;

                // Compute effective transform states from new initial/final structure
                // If path has animation, use it; otherwise fall back to global transform
                const initialState = path.animation ? path.animation.initial : settings.globalTransform.initial;
                const finalState = path.animation ? path.animation.final : settings.globalTransform.final;

                // For backward compatibility, use final state for effectiveTransform (for ghost/hasTransform)
                const effectiveTransform = finalState;

                // Check if there are any transforms to animate (comparing initial vs final)
                const hasTransform = (
                  initialState.x !== finalState.x ||
                  initialState.y !== finalState.y ||
                  initialState.scale !== finalState.scale ||
                  initialState.rotate !== finalState.rotate ||
                  initialState.opacity !== finalState.opacity
                );

                // Define Framer Motion variants based on animation direction
                // 'in' = animate FROM initial TO final (entrance animation)
                // 'out' = animate FROM final TO initial (exit animation)
                const pathVariants = settings.animationDirection === 'in'
                  ? {
                    initial: initialState,
                    active: finalState,
                    transition: path.animation?.transition
                  }
                  : {
                    initial: finalState,
                    active: initialState,
                    transition: path.animation?.transition
                  };

                return (
                  <React.Fragment key={path.id}>
                    {/* Transform Group - CSS-animated for timeline sync */}
                    <g
                      style={{
                        // Initial state CSS variables (--ix, --iy, --is, --ir, --io)
                        // @ts-ignore
                        '--ix': `${initialState.x}px`,
                        // @ts-ignore
                        '--iy': `${initialState.y}px`,
                        // @ts-ignore
                        '--is': initialState.scale,
                        // @ts-ignore
                        '--ir': `${initialState.rotate}deg`,
                        // @ts-ignore
                        '--io': initialState.opacity,
                        // Final state CSS variables (--fx, --fy, --fs, --fr, --fo)
                        // @ts-ignore
                        '--fx': `${finalState.x}px`,
                        // @ts-ignore
                        '--fy': `${finalState.y}px`,
                        // @ts-ignore
                        '--fs': finalState.scale,
                        // @ts-ignore
                        '--fr': `${finalState.rotate}deg`,
                        // @ts-ignore
                        '--fo': finalState.opacity,
                        // @ts-ignore
                        '--path-delay': `${delay}s`,
                        // Animation properties removed - now using Framer Motion variants
                        // Legacy CSS animation code removed
                        transformOrigin: 'center',
                        transformBox: 'fill-box'
                      } as React.CSSProperties}
                    >
                      {/* Animated Path - trigger-based animation */}
                      <motion.path
                        key={`${path.id}-${animationKey}`}
                        className="animating-path"
                        d={path.d}
                        transform={path.transform || undefined}
                        fill={fill === 'none' ? 'none' : fill}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap={settings.lineCap}
                        strokeLinejoin={settings.lineJoin}
                        pathLength={1}
                        variants={getPathVariants(recipe, index)}
                        // TRIGGER-BASED ANIMATION:
                        // Auto: start idle, animate to play
                        // Hover/Click: start in play (visible), animate on interaction
                        initial={recipe.trigger === 'auto' ? 'idle' : 'play'}
                        animate={animateState}
                        // For hover trigger: animate on hover
                        whileHover={recipe.trigger === 'hover' ? 'hover' : undefined}
                        // For click trigger: handle via onClick
                        onClick={recipe.trigger === 'click' ? handleClickTrigger : undefined}
                        style={{
                          transformOrigin: 'center',
                          transformBox: 'fill-box',
                          cursor: recipe.trigger !== 'auto' ? 'pointer' : 'default',
                        }}
                      />
                    </g>
                  </React.Fragment>
                )
              })}
            </motion.svg>
          </motion.div>
        </div>
      </div>

      {/* Keyframe Styles */}
      <style>{`
        @keyframes draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
});