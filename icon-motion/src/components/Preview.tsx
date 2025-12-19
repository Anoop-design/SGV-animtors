'use client';

import React, { useEffect, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { ParsedSVG, AnimationSettings } from '@/types';
import { Play, Pause, RotateCcw, ChevronDown, Repeat, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { formatTimecode } from '@/lib/utils';
import { Dropdown } from '@/components/ui/Dropdown';
import { motion } from 'framer-motion';
import '@/styles.css';

interface PreviewProps {
  parsedSVG: ParsedSVG;
  settings: AnimationSettings;
  updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
  updatePathLength: (index: number, length: number) => void;
  hoveredPathIndex: number | null;
  selectedPathIndex?: number | null;
  onSelectPath?: (index: number | null) => void;
  onHoverPath?: (index: number | null) => void;
  // Animation mode: which animation type to play
  animationMode: 'stroke' | 'transform';
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
  animationMode
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  // Available speed options
  const speedOptions = [0.25, 0.5, 1, 2];

  // Background state
  const [bgType, setBgType] = useState<BackgroundType>('dotted');
  const [customColor, setCustomColor] = useState('#6366f1');
  const [showColorPicker, setShowColorPicker] = useState(false);

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const zoomIn = () => setZoom(prev => Math.min(prev + 0.25, 2));
  const zoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const zoomReset = () => setZoom(1);

  // Close dropdowns on click outside
  useEffect(() => {
    if (!showSpeedDropdown) return;
    const handleClick = () => setShowSpeedDropdown(false);
    // Slight delay to prevent immediate closing
    const timer = setTimeout(() => document.addEventListener('click', handleClick), 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClick);
    }
  }, [showSpeedDropdown]);

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

  // Calculate Total Duration based on max delay + duration
  const totalDuration = useMemo(() => {
    if (parsedSVG.paths.length === 0) return 0;

    let maxEndTime = 0;

    parsedSVG.paths.forEach((path, index) => {
      if (!path.visible) return;

      let delay = settings.delay;
      if (settings.staggerMode === 'forward') {
        delay += index * (settings.staggerAmount || 0);
      } else if (settings.staggerMode === 'reverse') {
        delay += (parsedSVG.paths.length - 1 - index) * (settings.staggerAmount || 0);
      }

      let duration = settings.duration;
      if (settings.fillMode === 'fade-in') {
        duration = duration * 1.8;
      }

      const endTime = delay + duration;
      if (endTime > maxEndTime) maxEndTime = endTime;
    });

    return maxEndTime > 0 ? maxEndTime : settings.duration;
  }, [parsedSVG, settings]);

  // Reset when SVG changes
  useEffect(() => {
    setCurrentTime(0);
    setIsPlaying(true);
  }, [parsedSVG.paths.length]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      let lastTime = performance.now();

      const animate = (time: number) => {
        const dt = (time - lastTime) / 1000;
        lastTime = time;

        setCurrentTime(prev => {
          let next = prev + dt * playbackSpeed;
          if (next >= totalDuration) {
            if (settings.loop) {
              return 0; // Loop immediately
            } else {
              setIsPlaying(false);
              return totalDuration;
            }
          }
          return next;
        });

        requestRef.current = requestAnimationFrame(animate);
      };

      requestRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying, totalDuration, settings.loop, playbackSpeed]);

  // Sync Current Time to CSS Variable
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.setProperty('--current-time', `${currentTime}s`);
    }
  }, [currentTime]);

  const handleReplay = () => {
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const togglePlay = () => {
    if (currentTime >= totalDuration && !isPlaying) {
      setCurrentTime(0);
    }
    setIsPlaying(!isPlaying);
  };

  // Expose methods via ref for keyboard shortcuts
  useImperativeHandle(ref, () => ({
    togglePlay,
    handleReplay,
  }));

  // Keyboard shortcuts for speed control
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '[') {
        e.preventDefault();
        setPlaybackSpeed(prev => {
          const idx = speedOptions.indexOf(prev);
          return idx > 0 ? speedOptions[idx - 1] : prev;
        });
      } else if (e.key === ']') {
        e.preventDefault();
        setPlaybackSpeed(prev => {
          const idx = speedOptions.indexOf(prev);
          return idx < speedOptions.length - 1 ? speedOptions[idx + 1] : prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    setCurrentTime(parseFloat(e.target.value));
  };

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
                width: '100%',
                height: '100%',
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
                        // Animation properties - only apply when in transform mode AND has transforms
                        animationName: (animationMode === 'transform' && hasTransform) ? 'transformPath' : 'none',
                        animationDuration: 'var(--duration)',
                        animationDelay: 'calc(var(--path-delay) - var(--current-time))',
                        animationPlayState: 'paused',
                        animationFillMode: 'both',
                        animationTimingFunction: 'var(--ease)',
                        transformOrigin: 'center',
                        transformBox: 'fill-box'
                      } as React.CSSProperties}
                    >
                      {/* Hover/Selection Highlight - Solid indigo stroke that traces the actual path */}
                      {(isHovered || isSelected) && (
                        <motion.path
                          d={path.d}
                          transform={path.transform || undefined}
                          fill="none"
                          stroke="#6366f1" // Indigo highlight color
                          strokeWidth={Number(strokeWidth) + (isSelected ? 1.5 : 1)} // Thin outline
                          strokeLinecap={settings.lineCap}
                          strokeLinejoin={settings.lineJoin}
                          initial={{ opacity: 0, pathLength: 0 }}
                          animate={{
                            opacity: isSelected ? 1 : 0.7,
                            pathLength: 1
                          }}
                          transition={{
                            opacity: { duration: 0.1 },
                            pathLength: { duration: 0.2, ease: 'easeOut' }
                          }}
                          style={{
                            pointerEvents: 'none',
                          }}
                        />
                      )}

                      {/* Ghost Preview - Shows transformed end state when editing */}
                      {isSelected && hasTransform && (
                        <motion.path
                          d={path.d}
                          transform={path.transform || undefined}
                          fill="none"
                          stroke="#6366f1" // Indigo color for ghost
                          strokeWidth={strokeWidth}
                          strokeLinecap={settings.lineCap}
                          strokeLinejoin={settings.lineJoin}
                          strokeDasharray="4 4" // Dashed to distinguish from real path
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.4 }}
                          transition={{ duration: 0.2 }}
                          style={{
                            pointerEvents: 'none',
                            // Apply the effective transform to show end state
                            // For 'in' direction, ghost shows starting position (targetState)
                            // For 'out' direction, ghost shows ending position (targetState)
                            transform: `translate(${effectiveTransform.x}px, ${effectiveTransform.y}px) scale(${effectiveTransform.scale}) rotate(${effectiveTransform.rotate}deg)`,
                            transformOrigin: 'center',
                            transformBox: 'fill-box'
                          }}
                        />
                      )}

                      {/* Actual Visible Path - Has .animating-path class for measurement */}
                      <motion.path
                        className="animating-path"
                        d={path.d}
                        transform={path.transform || undefined}
                        fill={fill === 'none' ? 'none' : fill}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeLinecap={settings.lineCap}
                        strokeLinejoin={settings.lineJoin}
                        strokeDasharray={animationMode === 'stroke' ? len : 0}
                        strokeDashoffset={animationMode === 'stroke' ? len : 0}
                        style={{
                          // Standard CSS Styles for Loop Animation
                          opacity: hasFade ? 0 : 1,
                          // @ts-ignore
                          '--path-delay': `${delay}s`,
                          // @ts-ignore
                          '--fade-delay': `${fadeDelay}s`,
                          animationPlayState: 'paused',
                          animationDelay: `
                              calc(var(--path-delay) - var(--current-time)),
                              ${hasFade ? 'calc(var(--fade-delay) - var(--current-time))' : '0s'}
                          `,
                          // Only apply stroke-draw animation when in stroke mode
                          animationName: animationMode === 'stroke' ? `draw${hasFade ? ', fadeIn' : ''}` : 'none',
                          animationDuration: `var(--duration)${hasFade ? ', var(--duration)' : ''}`,
                          animationTimingFunction: `var(--ease)${hasFade ? ', ease' : ''}`,
                          animationFillMode: 'both',
                          pointerEvents: 'none' // Events handled by Hit Area
                        }}
                      />

                      {/* Invisible Hit Area (Always Present, Handles Events) */}
                      <motion.path
                        d={path.d}
                        transform={path.transform || undefined}
                        fill="transparent" // Transparent fill to catch clicks inside shapes
                        stroke="transparent"
                        strokeWidth={Number(strokeWidth) + 8} // Precise hit area, close to actual path
                        strokeLinecap={settings.lineCap}
                        strokeLinejoin={settings.lineJoin}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onSelectPath) onSelectPath(index);
                        }}
                        onMouseEnter={() => onHoverPath && onHoverPath(index)}
                        onMouseLeave={() => onHoverPath && onHoverPath(null)}
                        style={{
                          cursor: 'pointer',
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

      {/* Timeline Controls - Clean Design */}
      <div className="timeline-container">
        {/* Progress Bar */}
        <div className="timeline-progress-bar">
          {/* Track Background */}
          <div className="timeline-progress-track" />
          {/* Filled Progress */}
          <div
            className="timeline-progress-fill"
            style={{
              width: totalDuration > 0
                ? `calc(${(currentTime / totalDuration) * 100}% + ${7 - (currentTime / totalDuration) * 14}px)`
                : '0%'
            }}
          />
          {/* Range Input for Interaction */}
          <input
            type="range"
            min={0}
            max={totalDuration}
            step={0.01}
            value={currentTime}
            onChange={handleScrub}
            className="timeline-progress-input"
          />
        </div>

        {/* Play Button + Timecode + Speed + Loop */}
        <div className="timeline-controls-row">
          <button className="timeline-play-btn" onClick={togglePlay}>
            {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
          </button>

          <span className="timeline-timecode">
            {formatTimecode(currentTime)} / {formatTimecode(totalDuration)}
          </span>

          <div className="timeline-controls-right">
            {/* Speed Selector - Custom Dropdown */}
            <div className="timeline-speed-container">
              <button
                className="timeline-speed-trigger"
                onClick={(e) => {
                  e.stopPropagation(); // Prevent immediate close
                  setShowSpeedDropdown(!showSpeedDropdown);
                }}
              >
                {playbackSpeed}X <ChevronDown size={14} />
              </button>
              {showSpeedDropdown && (
                <div className="speed-dropdown-menu">
                  {speedOptions.map(speed => (
                    <button
                      key={speed}
                      className={`speed-option ${playbackSpeed === speed ? 'active' : ''}`}
                      onClick={() => {
                        setPlaybackSpeed(speed);
                        setShowSpeedDropdown(false);
                      }}
                    >
                      {speed}X
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Loop Button */}
            <button
              className={`timeline-loop-btn ${settings.loop ? 'active' : ''}`}
              onClick={() => updateSetting('loop', !settings.loop)}
              title={settings.loop ? "Disable Loop" : "Enable Loop"}
            >
              <Repeat size={16} />
            </button>
          </div>
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