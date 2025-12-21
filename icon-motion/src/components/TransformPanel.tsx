'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
    AnimationSettings,
    ParsedPath,
    StaggerMode,
    TriggerType,
    PRESET_OPTIONS,
    PresetType,
    PathTransform,
    DEFAULT_PATH_TRANSFORM,
    AnimationRecipe,
    EasingType,
    DEFAULT_RECIPE,
    DEFAULT_RECIPE_TRANSITION,
    RecipeTransition
} from '@/types';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TransitionEditor } from '@/components/ui/TransitionEditor';
import { AnimatedPresetIcon } from '@/components/ui/AnimatedPresetIcon';
import { GripVertical, Eye, EyeOff, X, ChevronDown, RotateCcw } from 'lucide-react';
import { isInputFocused } from '@/lib/useKeyboardShortcuts';
import '@/styles.css';

interface TransformPanelProps {
    settings: AnimationSettings;
    updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
    // Recipe props - single source of truth for animation config
    recipe: AnimationRecipe;
    updateRecipe: <K extends keyof AnimationRecipe>(key: K, value: AnimationRecipe[K]) => void;
    paths: ParsedPath[];
    onToggleVisibility: (index: number) => void;
    onReorderPath: (fromIndex: number, toIndex: number) => void;
    hoveredPathIndex: number | null;
    setHoveredPathIndex: (index: number | null) => void;
    selectedPathIndex?: number | null;
    onSelectPath?: (index: number | null) => void;
    updatePathAnimation?: (index: number, animation: Partial<PathTransform> | undefined) => void;
    viewBox?: string;
    isOpen?: boolean;
    onClose?: () => void;
}

/**
 * TransformPanel - Simplified controls for Framer Motion transforms only
 * No Stroke tab, just transform presets, timing, and trigger controls
 */
export const TransformPanel: React.FC<TransformPanelProps> = ({
    settings,
    updateSetting,
    recipe,
    updateRecipe,
    paths,
    onToggleVisibility,
    onReorderPath,
    hoveredPathIndex,
    setHoveredPathIndex,
    selectedPathIndex,
    onSelectPath,
    updatePathAnimation,
    viewBox,
    isOpen,
    onClose
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
    const [layersOpen, setLayersOpen] = useState(false);
    const [appearanceOpen, setAppearanceOpen] = useState(false);
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

    // Get active path for editing
    const activePath = selectedPathIndex !== null && selectedPathIndex !== undefined ? paths[selectedPathIndex] : null;
    const animation: PathTransform = activePath?.animation || DEFAULT_PATH_TRANSFORM;

    // Apply animation preset - updates recipe directly
    const applyPreset = (presetId: string) => {
        updateRecipe('preset', presetId as PresetType);
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
                {/* Main Panel - always visible (no layer edit subpage) */}
                <motion.div
                    key="main-panel"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                >
                    {/* Layers Section */}
                    <div className="controls-section">
                        <button
                            className="controls-section-header"
                            onClick={() => setLayersOpen(!layersOpen)}
                        >
                            <span className="controls-section-title">Layers</span>
                            <ChevronDown size={16} className={`section-chevron ${layersOpen ? 'open' : ''}`} />
                        </button>
                        <motion.div
                            className="collapsible-content"
                            initial={false}
                            animate={{
                                height: layersOpen ? 'auto' : 0,
                                opacity: layersOpen ? 1 : 0,
                                marginTop: layersOpen ? 6 : 0,
                            }}
                            transition={{
                                height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                                opacity: { duration: 0.15, ease: 'easeOut' },
                                marginTop: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                            }}
                        >
                            {paths.length > 0 ? (
                                <div className="layers-list">
                                    {paths.map((path, index) => (
                                        <div
                                            key={path.id}
                                            draggable
                                            onDragStart={() => setDraggedIndex(index)}
                                            onDragEnd={() => { setDraggedIndex(null); setDragOverIndex(null); }}
                                            onDragOver={(e) => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) setDragOverIndex(index); }}
                                            onDragLeave={() => setDragOverIndex(null)}
                                            onDrop={(e) => { e.preventDefault(); if (draggedIndex !== null && draggedIndex !== index) onReorderPath(draggedIndex, index); setDraggedIndex(null); setDragOverIndex(null); }}
                                            className={`layer-item ${hoveredPathIndex === index ? 'hovered' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                                            onMouseEnter={() => setHoveredPathIndex(index)}
                                            onMouseLeave={() => setHoveredPathIndex(null)}
                                        >
                                            <div className="layer-drag-handle"><GripVertical size={14} /></div>
                                            <span className="layer-name truncate">Path {index + 1}</span>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onToggleVisibility(index); }}
                                                className={`layer-visibility-btn ${path.visible ? '' : 'hidden-layer'}`}
                                            >
                                                {path.visible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="controls-empty-message">Upload an SVG to see layers</p>
                            )}
                        </motion.div>
                    </div>

                    {/* Preset Section - 3x2 Grid */}
                    <div className="controls-section">
                        <span className="controls-section-title">Entrance Preset</span>
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
                                        <span className="preset-label">
                                            {preset.label}
                                        </span>
                                    </motion.button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Appearance Section - Collapsible */}
                    <div className="controls-section">
                        <button
                            className="controls-section-header"
                            onClick={() => setAppearanceOpen(!appearanceOpen)}
                        >
                            <span className="controls-section-title">Appearance</span>
                            <ChevronDown size={16} className={`section-chevron ${appearanceOpen ? 'open' : ''}`} />
                        </button>
                        <motion.div
                            className="collapsible-content collapsible-content-appearance"
                            initial={false}
                            animate={{
                                height: appearanceOpen ? 'auto' : 0,
                                opacity: appearanceOpen ? 1 : 0,
                                marginTop: appearanceOpen ? 12 : 0,
                            }}
                            transition={{
                                height: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                                opacity: { duration: 0.15, ease: 'easeOut' },
                                marginTop: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
                            }}
                        >
                            {/* Override Toggle */}
                            <div className="controls-field">
                                <span className="controls-field-label">Override</span>
                                <SegmentedControl
                                    options={[{ label: 'Yes', value: 'yes' }, { label: 'No', value: 'no' }]}
                                    value={settings.overrideColor ? 'yes' : 'no'}
                                    onChange={(v) => updateSetting('overrideColor', v === 'yes')}
                                    className="controls-toggle-wide"
                                />
                            </div>

                            {/* Stroke Color */}
                            {settings.overrideColor && (
                                <div className="controls-field">
                                    <span className="controls-field-label">Stroke color</span>
                                    <div className="controls-color-input-inline">
                                        <input type="color" className="controls-color-picker-inline" value={settings.strokeColor} onChange={(e) => updateSetting('strokeColor', e.target.value)} />
                                        <input type="text" className="controls-color-text-inline" value={settings.strokeColor.toUpperCase()} onChange={(e) => updateSetting('strokeColor', e.target.value)} />
                                    </div>
                                </div>
                            )}

                            {/* Stroke Width */}
                            {settings.overrideColor && (
                                <div className="controls-field">
                                    <span className="controls-field-label">Stroke width</span>
                                    <div className="controls-field-input-group">
                                        <input type="text" className="controls-field-input controls-field-input-short" value={settings.strokeWidth} onChange={(e) => { const val = parseFloat(e.target.value); if (!isNaN(val)) updateSetting('strokeWidth', val); }} />
                                        <Slider min={0.5} max={10} step={0.5} value={settings.strokeWidth} onChange={(val) => updateSetting('strokeWidth', val)} />
                                    </div>
                                </div>
                            )}

                            {/* Line Cap */}
                            <div className="controls-field">
                                <span className="controls-field-label">Line cap</span>
                                <div style={{ flex: 1 }}>
                                    <Dropdown options={[{ label: 'Round', value: 'round' }, { label: 'Butt', value: 'butt' }, { label: 'Square', value: 'square' }]} value={settings.lineCap} onChange={(val) => updateSetting('lineCap', val as any)} />
                                </div>
                            </div>

                            {/* Line Join */}
                            <div className="controls-field">
                                <span className="controls-field-label">Line join</span>
                                <div style={{ flex: 1 }}>
                                    <Dropdown options={[{ label: 'Round', value: 'round' }, { label: 'Bevel', value: 'bevel' }, { label: 'Miter', value: 'miter' }]} value={settings.lineJoin} onChange={(val) => updateSetting('lineJoin', val as any)} />
                                </div>
                            </div>
                        </motion.div>
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

                        {/* Transition Control - Button that opens dropdown */}
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
                                {/* TransitionEditor Dropdown - uses portal for fixed positioning */}
                                <TransitionEditor
                                    isOpen={transitionEditorOpen}
                                    onClose={() => setTransitionEditorOpen(false)}
                                    transition={recipe.transition || DEFAULT_RECIPE_TRANSITION}
                                    onChange={(newTransition) => updateRecipe('transition', newTransition)}
                                    anchorRef={transitionButtonRef}
                                />
                            </div>
                        </div>

                        {/* Stagger Slider */}
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

                        {/* Stagger Pattern */}
                        <div className="controls-field">
                            <span className="controls-field-label">Pattern</span>
                            <div style={{ flex: 1 }}>
                                <Dropdown
                                    options={[
                                        { label: 'Forward', value: 'forward' },
                                        { label: 'Reverse', value: 'reverse' },
                                        { label: 'From Center', value: 'from-center' },
                                        { label: 'Random', value: 'random' },
                                    ]}
                                    value={settings.staggerMode === 'none' ? 'forward' : settings.staggerMode}
                                    onChange={(val) => updateSetting('staggerMode', val as StaggerMode)}
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};

