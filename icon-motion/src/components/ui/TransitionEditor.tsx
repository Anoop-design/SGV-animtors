'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, useAnimation } from 'framer-motion';
import { ChevronLeft, X } from 'lucide-react';
import { RecipeTransition, DEFAULT_RECIPE_TRANSITION } from '@/types';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Dropdown } from '@/components/ui/Dropdown';
import { BezierCurveEditor } from '@/components/ui/BezierCurveEditor';
import { SpringCurvePreview } from '@/components/ui/SpringCurvePreview';
import '@/styles.css';

// =============================================================================
// TRANSITION EDITOR COMPONENT
// Contextual dropdown for editing ease/spring transition settings
// Uses portal to render outside parent overflow constraints
// =============================================================================

interface TransitionEditorProps {
    isOpen: boolean;
    onClose: () => void;
    transition: RecipeTransition;
    onChange: (transition: RecipeTransition) => void;
    anchorRef?: React.RefObject<HTMLElement | null>; // Reference to the trigger button
}

// Preset ease options with their bezier values
const EASE_PRESETS: { label: string; value: string; bezier: [number, number, number, number] }[] = [
    { label: 'Ease Out', value: 'easeOut', bezier: [0, 0, 0.58, 1] },
    { label: 'Ease In', value: 'easeIn', bezier: [0.42, 0, 1, 1] },
    { label: 'Ease In Out', value: 'easeInOut', bezier: [0.42, 0, 0.58, 1] },
    { label: 'Linear', value: 'linear', bezier: [0, 0, 1, 1] },
];

// Get bezier values from ease preset or custom
function getBezierFromEase(ease: string | [number, number, number, number]): [number, number, number, number] {
    if (Array.isArray(ease)) return ease;
    const preset = EASE_PRESETS.find(p => p.value === ease);
    return preset?.bezier ?? [0.42, 0, 0.58, 1];
}

// Format bezier for display
function formatBezier(bezier: [number, number, number, number]): string {
    return bezier.map(v => v.toFixed(2).replace(/\.?0+$/, '')).join(', ');
}

export const TransitionEditor: React.FC<TransitionEditorProps> = ({
    isOpen,
    onClose,
    transition,
    onChange,
    anchorRef,
}) => {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [localTransition, setLocalTransition] = useState<RecipeTransition>(transition);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const [isPlaying, setIsPlaying] = useState(false);
    const previewControls = useAnimation();
    const previewBarRef = useRef<HTMLDivElement>(null);
    const prevTransitionRef = useRef<RecipeTransition | null>(null);

    // Play preview animation (one cycle: left to right and back)
    const playPreview = useCallback(async () => {
        if (isPlaying) return;
        setIsPlaying(true);

        // Calculate travel distance based on actual bar width
        // Bar has padding 4px on each side, indicator is 28px wide
        const barWidth = previewBarRef.current?.offsetWidth ?? 200;
        const indicatorWidth = 28;
        const padding = 4;
        const travelDistance = barWidth - indicatorWidth - (padding * 2);

        // Build transition config based on current settings
        // For tween, we need to format bezier correctly for framer-motion
        let transitionConfig: any;

        if (localTransition.type === 'spring') {
            transitionConfig = {
                type: 'spring',
                stiffness: localTransition.stiffness,
                damping: localTransition.damping,
                mass: localTransition.mass,
            };
        } else {
            // For ease transitions
            let ease: any = localTransition.ease;

            // If it's a bezier array, convert to the format framer-motion expects
            if (Array.isArray(ease)) {
                // framer-motion accepts bezier as [x1, y1, x2, y2] directly
                ease = ease;
            }

            transitionConfig = {
                type: 'tween',
                duration: localTransition.duration,
                ease: ease,
            };
        }

        try {
            // Start at left (x = 0)
            await previewControls.set({ x: 0 });

            // Animate from left to right
            await previewControls.start({
                x: travelDistance,
                transition: transitionConfig
            } as any);

            // Brief pause at end
            await new Promise(r => setTimeout(r, 200));

            // Animate back from right to left  
            await previewControls.start({
                x: 0,
                transition: transitionConfig
            } as any);
        } catch (e) {
            // Animation was cancelled
        }

        setIsPlaying(false);
    }, [isPlaying, localTransition, previewControls]);

    // Trigger preview when transition values change
    useEffect(() => {
        // Skip initial render
        if (prevTransitionRef.current === null) {
            prevTransitionRef.current = localTransition;
            return;
        }

        // Check if values actually changed
        const prev = prevTransitionRef.current;
        const hasChanged =
            prev.type !== localTransition.type ||
            prev.duration !== localTransition.duration ||
            prev.stiffness !== localTransition.stiffness ||
            prev.damping !== localTransition.damping ||
            prev.mass !== localTransition.mass ||
            JSON.stringify(prev.ease) !== JSON.stringify(localTransition.ease);

        if (hasChanged && isOpen) {
            prevTransitionRef.current = localTransition;
            playPreview();
        }
    }, [localTransition, isOpen, playPreview]);


    // Calculate position based on anchor element
    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const dropdownWidth = 320;

            // Position below the button, aligned to the right edge
            setPosition({
                top: rect.bottom + 4,
                left: Math.max(8, rect.right - dropdownWidth), // Keep 8px from left edge
            });
        }
    }, [isOpen, anchorRef]);

    // Update local state when prop changes
    useEffect(() => {
        setLocalTransition(transition);
    }, [transition]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                // Also check if click was on the anchor button
                if (anchorRef?.current?.contains(event.target as Node)) {
                    return;
                }
                onClose();
            }
        };

        if (isOpen) {
            // Small delay to prevent immediate close
            const timer = setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 100);
            return () => {
                clearTimeout(timer);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, onClose, anchorRef]);

    // Helper to update a single field
    const updateField = <K extends keyof RecipeTransition>(key: K, value: RecipeTransition[K]) => {
        const updated = { ...localTransition, [key]: value };
        setLocalTransition(updated);
        onChange(updated);
    };

    // Handle type change (ease/spring)
    const handleTypeChange = (type: 'ease' | 'spring') => {
        const updated = { ...localTransition, type };
        setLocalTransition(updated);
        onChange(updated);
    };

    // Handle bezier curve change
    const handleBezierChange = (bezier: [number, number, number, number]) => {
        updateField('ease', bezier);
    };

    // Handle ease preset change
    const handleEasePresetChange = (presetValue: string) => {
        const preset = EASE_PRESETS.find(p => p.value === presetValue);
        if (preset) {
            updateField('ease', preset.bezier);
        }
    };

    // Get current ease preset name
    const getCurrentEasePreset = (): string => {
        if (Array.isArray(localTransition.ease)) {
            const bezierStr = localTransition.ease.join(',');
            const preset = EASE_PRESETS.find(p => p.bezier.join(',') === bezierStr);
            return preset?.value ?? 'custom';
        }
        return localTransition.ease;
    };

    if (!isOpen) return null;

    const currentBezier = getBezierFromEase(localTransition.ease);

    // Use portal to render outside parent overflow constraints
    const dropdown = (
        <motion.div
            ref={dropdownRef}
            className="transition-editor-dropdown"
            drag
            dragMomentum={false}
            dragElastic={0}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            style={{
                position: 'fixed',
                top: position.top,
                left: position.left,
                cursor: 'grab',
            }}
            whileDrag={{ cursor: 'grabbing' }}
        >
            {/* Header - Drag Handle */}
            <div className="transition-editor-header" style={{ cursor: 'grab' }}>
                <span className="transition-editor-title">Transition</span>
                <button className="transition-editor-close" onClick={onClose}>
                    <X size={16} />
                </button>
            </div>

            {/* Ease/Spring Toggle */}
            <div className="transition-editor-toggle">
                <SegmentedControl
                    options={[
                        { label: 'Ease', value: 'ease' },
                        { label: 'Spring', value: 'spring' },
                    ]}
                    value={localTransition.type}
                    onChange={(v) => handleTypeChange(v as 'ease' | 'spring')}
                />
            </div>

            {/* Curve Editor */}
            <div className="transition-editor-curve">
                {localTransition.type === 'ease' ? (
                    <BezierCurveEditor
                        value={currentBezier}
                        onChange={handleBezierChange}
                    />
                ) : (
                    <SpringCurvePreview
                        stiffness={localTransition.stiffness}
                        damping={localTransition.damping}
                        mass={localTransition.mass}
                    />
                )}
            </div>

            {/* Controls */}
            <div className="transition-editor-controls">
                {localTransition.type === 'ease' ? (
                    <>
                        {/* Ease Preset */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Ease</span>
                            <div className="transition-editor-input">
                                <Dropdown
                                    options={[...EASE_PRESETS.map(p => ({ label: p.label, value: p.value })), { label: 'Custom', value: 'custom' }]}
                                    value={getCurrentEasePreset()}
                                    onChange={handleEasePresetChange}
                                />
                            </div>
                        </div>

                        {/* Bezier Values */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Bezier</span>
                            <div className="transition-editor-bezier-input">
                                <input
                                    type="text"
                                    value={formatBezier(currentBezier)}
                                    onChange={(e) => {
                                        const parts = e.target.value.split(',').map(s => parseFloat(s.trim()));
                                        if (parts.length === 4 && parts.every(n => !isNaN(n))) {
                                            handleBezierChange(parts as [number, number, number, number]);
                                        }
                                    }}
                                    className="bezier-text-input"
                                />
                            </div>
                        </div>

                        {/* Time */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Time</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.duration}
                                    onChange={(val) => updateField('duration', val)}
                                    min={0.1} max={5} step={0.1} unit="s"
                                />
                                <Slider
                                    min={0.1} max={3} step={0.1}
                                    value={localTransition.duration}
                                    onChange={(val) => updateField('duration', val)}
                                />
                            </div>
                        </div>

                        {/* Delay */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Delay</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.delay}
                                    onChange={(val) => updateField('delay', val)}
                                    min={0} max={3} step={0.1} unit="s"
                                />
                                <Slider
                                    min={0} max={2} step={0.1}
                                    value={localTransition.delay}
                                    onChange={(val) => updateField('delay', val)}
                                />
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Stiffness */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Stiffness</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.stiffness}
                                    onChange={(val) => updateField('stiffness', val)}
                                    min={50} max={1000} step={10}
                                />
                                <Slider
                                    min={50} max={800} step={10}
                                    value={localTransition.stiffness}
                                    onChange={(val) => updateField('stiffness', val)}
                                />
                            </div>
                        </div>

                        {/* Damping */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Damping</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.damping}
                                    onChange={(val) => updateField('damping', val)}
                                    min={5} max={50} step={1}
                                />
                                <Slider
                                    min={5} max={40} step={1}
                                    value={localTransition.damping}
                                    onChange={(val) => updateField('damping', val)}
                                />
                            </div>
                        </div>

                        {/* Mass */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Mass</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.mass}
                                    onChange={(val) => updateField('mass', val)}
                                    min={0.1} max={5} step={0.1}
                                />
                                <Slider
                                    min={0.1} max={3} step={0.1}
                                    value={localTransition.mass}
                                    onChange={(val) => updateField('mass', val)}
                                />
                            </div>
                        </div>

                        {/* Delay */}
                        <div className="transition-editor-row">
                            <span className="transition-editor-label">Delay</span>
                            <div className="transition-editor-input-row">
                                <NumberInput
                                    value={localTransition.delay}
                                    onChange={(val) => updateField('delay', val)}
                                    min={0} max={3} step={0.1} unit="s"
                                />
                                <Slider
                                    min={0} max={2} step={0.1}
                                    value={localTransition.delay}
                                    onChange={(val) => updateField('delay', val)}
                                />
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Animated Preview - click to play or triggers on value change */}
            <div
                className="transition-editor-preview"
                onClick={playPreview}
                style={{ cursor: isPlaying ? 'wait' : 'pointer' }}
            >
                <span className="transition-editor-label">Preview</span>
                <div ref={previewBarRef} className="transition-preview-bar">
                    <motion.div
                        className="transition-preview-indicator"
                        animate={previewControls}
                        initial={{ x: 0 }}
                    />
                </div>
            </div>
        </motion.div>
    );

    // Render with portal to escape parent overflow
    return createPortal(dropdown, document.body);
};

export default TransitionEditor;

