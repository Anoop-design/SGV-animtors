'use client';

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    AnimationSettings,
    StaggerType,
    LayerMode,
    PRESET_OPTIONS,
    PresetType,
    AnimationRecipe,
    DEFAULT_RECIPE,
    DEFAULT_RECIPE_TRANSITION,
} from '@/types';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { TransitionEditor } from '@/components/ui/TransitionEditor';
import { AnimatedPresetIcon } from '@/components/ui/AnimatedPresetIcon';
import { X, ChevronDown, RotateCcw } from 'lucide-react';
import '@/styles.css';

interface TransformPanelProps {
    settings: AnimationSettings;
    updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
    recipe: AnimationRecipe;
    updateRecipe: <K extends keyof AnimationRecipe>(key: K, value: AnimationRecipe[K]) => void;
    isOpen?: boolean;
    onClose?: () => void;
}

/**
 * TransformPanel - Animation controls only
 * Effects grid, Animation settings (Intensity, Transition, Layer Mode, Stagger)
 */
export const TransformPanel: React.FC<TransformPanelProps> = ({
    settings,
    updateSetting,
    recipe,
    updateRecipe,
    isOpen,
    onClose
}) => {
    const [transitionEditorOpen, setTransitionEditorOpen] = useState(false);
    const [hoveredPreset, setHoveredPreset] = useState<PresetType | null>(null);
    const transitionButtonRef = useRef<HTMLButtonElement>(null);

    // Check if animation values are modified from defaults
    const isAnimationModified =
        recipe.intensity !== DEFAULT_RECIPE.intensity ||
        recipe.stagger !== DEFAULT_RECIPE.stagger ||
        JSON.stringify(recipe.transition) !== JSON.stringify(DEFAULT_RECIPE_TRANSITION);

    // Reset animation values to defaults
    const resetAnimationDefaults = () => {
        updateRecipe('intensity', DEFAULT_RECIPE.intensity);
        updateRecipe('stagger', DEFAULT_RECIPE.stagger);
        updateRecipe('transition', DEFAULT_RECIPE_TRANSITION);
    };

    // Apply animation preset
    const applyPreset = (presetId: string) => {
        updateRecipe('preset', presetId as PresetType);
        // Draw presets need individual mode
        if (presetId === 'draw' || presetId === 'draw-pop') {
            updateRecipe('layerMode', 'individual');
        }
        // Spin/pulse look better with unified mode
        if (presetId === 'spin' || presetId === 'pulse') {
            updateRecipe('layerMode', 'unified');
        }
    };

    return (
        <div className={`controls-panel ${isOpen ? 'panel-open' : ''}`}>
            {/* Header */}
            <div className="controls-header">
                <span className="controls-header-title">Animation</span>
                <button className="panel-close-btn" onClick={onClose}>
                    <X size={18} />
                </button>
            </div>

            <div className="controls-content hide-scrollbar" style={{ padding: '16px' }}>
                <motion.div
                    key="main-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Preset Section - Effects Grid */}
                    <div className="controls-section">
                        <span className="controls-section-title">Effects</span>
                        <div className="preset-grid">
                            {PRESET_OPTIONS.map((preset) => {
                                const isSelected = recipe.preset === preset.value;
                                return (
                                    <motion.button
                                        key={preset.value}
                                        onClick={() => applyPreset(preset.value)}
                                        onMouseEnter={() => setHoveredPreset(preset.value)}
                                        onMouseLeave={() => setHoveredPreset(null)}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className={`preset-button ${isSelected ? 'selected' : ''}`}
                                    >
                                        <AnimatedPresetIcon
                                            preset={preset.value}
                                            isHovered={hoveredPreset === preset.value}
                                        />
                                        <span className="preset-label">{preset.label}</span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Animation Section */}
                    <div className="controls-section">
                        <div className="controls-section-title-row">
                            <span className="controls-section-title">Animation</span>
                            {isAnimationModified && (
                                <button
                                    className="section-reset-button"
                                    onClick={resetAnimationDefaults}
                                    title="Reset to defaults"
                                >
                                    <RotateCcw size={10} style={{ marginRight: '4px' }} />
                                    Reset
                                </button>
                            )}
                        </div>

                        {/* Intensity Slider */}
                        <div className="controls-field">
                            <span className="controls-field-label">Intensity</span>
                            <div className="controls-field-input-group">
                                <Slider
                                    min={0} max={1} step={0.05}
                                    value={recipe.intensity}
                                    onChange={(val) => updateRecipe('intensity', val)}
                                />
                            </div>
                        </div>

                        {/* Transition Control */}
                        <div className="controls-field">
                            <span className="controls-field-label">Transition</span>
                            <div style={{ position: 'relative', flex: 1 }}>
                                <button
                                    ref={transitionButtonRef}
                                    className="transition-button"
                                    onClick={() => setTransitionEditorOpen(!transitionEditorOpen)}
                                >
                                    <span className="transition-button-label">
                                        {recipe.transition?.type === 'spring' ? 'Spring' : 'Ease'}
                                    </span>
                                    <span className="transition-button-value">
                                        {recipe.transition?.type === 'spring'
                                            ? `${recipe.transition.stiffness}/${recipe.transition.damping}`
                                            : `${recipe.transition?.duration || recipe.duration}s`
                                        }
                                    </span>
                                    <ChevronDown size={14} className={transitionEditorOpen ? 'rotate-180' : ''} style={{ transition: 'transform 0.2s' }} />
                                </button>
                                <TransitionEditor
                                    isOpen={transitionEditorOpen}
                                    onClose={() => setTransitionEditorOpen(false)}
                                    transition={recipe.transition || DEFAULT_RECIPE_TRANSITION}
                                    onChange={(newTransition) => updateRecipe('transition', newTransition)}
                                    anchorRef={transitionButtonRef}
                                />
                            </div>
                        </div>

                        {/* Layer Mode Dropdown */}
                        <div className="controls-field">
                            <span className="controls-field-label">Layer Mode</span>
                            <div style={{ flex: 1 }}>
                                <Dropdown
                                    options={[
                                        { label: 'Individual', value: 'individual' },
                                        { label: 'Unified', value: 'unified' },
                                    ]}
                                    value={recipe.layerMode}
                                    onChange={(val) => updateRecipe('layerMode', val as LayerMode)}
                                />
                            </div>
                        </div>

                        {/* Stagger Slider (only for individual mode) */}
                        {recipe.layerMode === 'individual' && (
                            <>
                                <div className="controls-field">
                                    <span className="controls-field-label">Stagger</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={recipe.stagger}
                                            onChange={(val) => updateRecipe('stagger', val)}
                                            min={0} max={1} step={0.05} unit="s"
                                        />
                                        <Slider
                                            min={0} max={0.5} step={0.05}
                                            value={recipe.stagger}
                                            onChange={(val) => updateRecipe('stagger', val)}
                                        />
                                    </div>
                                </div>

                                {/* Stagger Type */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Pattern</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown
                                            options={[
                                                { label: 'None', value: 'none' },
                                                { label: 'By Index', value: 'by-index' },
                                                { label: 'By Index (Reverse)', value: 'by-index-reverse' },
                                                { label: 'By Size', value: 'by-size' },
                                                { label: 'From Center', value: 'from-center' },
                                                { label: 'Random', value: 'random' },
                                            ]}
                                            value={recipe.staggerType}
                                            onChange={(val) => updateRecipe('staggerType', val as StaggerType)}
                                        />
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
