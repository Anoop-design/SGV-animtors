'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    AnimationSettings,
    ParsedPath,
    StaggerMode,
    TriggerType,
    TRANSFORM_PRESETS,
    PathTransform,
    DEFAULT_PATH_TRANSFORM
} from '@/types';
import { Slider } from '@/components/ui/Slider';
import { NumberInput } from '@/components/ui/NumberInput';
import { Dropdown } from '@/components/ui/Dropdown';
import { GripVertical, Eye, EyeOff, X, ChevronDown, ChevronLeft } from 'lucide-react';
import { isInputFocused } from '@/lib/useKeyboardShortcuts';
import '@/styles.css';

interface TransformPanelProps {
    settings: AnimationSettings;
    updateSetting: <K extends keyof AnimationSettings>(key: K, value: AnimationSettings[K]) => void;
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
    const [layersOpen, setLayersOpen] = useState(true);

    // Get active path for editing
    const activePath = selectedPathIndex !== null && selectedPathIndex !== undefined ? paths[selectedPathIndex] : null;
    const animation: PathTransform = activePath?.animation || DEFAULT_PATH_TRANSFORM;

    // Apply transform preset
    const applyPreset = (presetId: string) => {
        const preset = TRANSFORM_PRESETS.find(p => p.id === presetId);
        if (!preset) return;

        // Apply to all visible paths
        paths.forEach((path, index) => {
            if (path.visible && updatePathAnimation) {
                updatePathAnimation(index, {
                    initial: { ...DEFAULT_PATH_TRANSFORM.initial, ...preset.motion.from },
                    final: { ...DEFAULT_PATH_TRANSFORM.final, ...preset.motion.to },
                    originX: 0.5,
                    originY: 0.5,
                    transition: preset.timing,
                });
            }
        });

        // Update global stagger
        updateSetting('staggerMode', preset.stagger.pattern as StaggerMode);
        updateSetting('staggerAmount', preset.stagger.amount);
        updateSetting('transformPreset', presetId);
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
                <AnimatePresence mode="popLayout" initial={false}>
                    {selectedPathIndex !== null && activePath ? (
                        /* === LAYER EDIT MODE === */
                        <motion.div
                            key="layer-edit"
                            initial={{ x: '100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '100%', opacity: 0 }}
                            transition={{ type: 'tween', duration: 0.2 }}
                        >
                            {/* Back Button */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                <button
                                    onClick={() => onSelectPath && onSelectPath(null)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        background: 'var(--bg-button)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                    }}
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                                    Path {(selectedPathIndex ?? 0) + 1}
                                </span>
                            </div>

                            {/* Path Preview */}
                            <div style={{
                                padding: '16px',
                                marginBottom: '16px',
                                background: 'var(--bg-input)',
                                borderRadius: '12px',
                                border: '1px solid var(--border-default)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'var(--bg-card)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    padding: '8px',
                                }}>
                                    <svg viewBox={viewBox || '0 0 24 24'} style={{ width: '100%', height: '100%' }}>
                                        <path
                                            d={activePath.d}
                                            fill="none"
                                            stroke="var(--text-primary)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        />
                                    </svg>
                                </div>
                                <div style={{ fontWeight: 600, fontSize: '14px' }}>
                                    Layer {(selectedPathIndex ?? 0) + 1}
                                </div>
                            </div>

                            {/* Per-Path Transform Controls */}
                            <div className="controls-section">
                                <span className="controls-section-title">Transform</span>

                                {/* Scale */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Scale</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <NumberInput
                                            value={animation.initial.scale}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                initial: { ...animation.initial, scale: val }
                                            })}
                                            min={0} max={3} step={0.1}
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                        <NumberInput
                                            value={animation.final.scale}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                final: { ...animation.final, scale: val }
                                            })}
                                            min={0} max={3} step={0.1}
                                        />
                                    </div>
                                </div>

                                {/* Opacity */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Opacity</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <NumberInput
                                            value={animation.initial.opacity}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                initial: { ...animation.initial, opacity: val }
                                            })}
                                            min={0} max={1} step={0.1}
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                        <NumberInput
                                            value={animation.final.opacity}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                final: { ...animation.final, opacity: val }
                                            })}
                                            min={0} max={1} step={0.1}
                                        />
                                    </div>
                                </div>

                                {/* Position X */}
                                <div className="controls-field">
                                    <span className="controls-field-label">X</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <NumberInput
                                            value={animation.initial.x}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                initial: { ...animation.initial, x: val }
                                            })}
                                            min={-100} max={100} step={1} unit="px"
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                        <NumberInput
                                            value={animation.final.x}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                final: { ...animation.final, x: val }
                                            })}
                                            min={-100} max={100} step={1} unit="px"
                                        />
                                    </div>
                                </div>

                                {/* Position Y */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Y</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <NumberInput
                                            value={animation.initial.y}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                initial: { ...animation.initial, y: val }
                                            })}
                                            min={-100} max={100} step={1} unit="px"
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                        <NumberInput
                                            value={animation.final.y}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                final: { ...animation.final, y: val }
                                            })}
                                            min={-100} max={100} step={1} unit="px"
                                        />
                                    </div>
                                </div>

                                {/* Rotate */}
                                <div className="controls-field">
                                    <span className="controls-field-label">Rotate</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <NumberInput
                                            value={animation.initial.rotate}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                initial: { ...animation.initial, rotate: val }
                                            })}
                                            min={-360} max={360} step={5} unit="°"
                                        />
                                        <span style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>→</span>
                                        <NumberInput
                                            value={animation.final.rotate}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                final: { ...animation.final, rotate: val }
                                            })}
                                            min={-360} max={360} step={5} unit="°"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Per-Path Timing */}
                            <div className="controls-section">
                                <span className="controls-section-title">Timing</span>
                                <div className="controls-field">
                                    <span className="controls-field-label">Duration</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={animation.transition?.duration ?? settings.duration}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                transition: { ...animation.transition, duration: val }
                                            })}
                                            min={0.1} max={5} step={0.1} unit="s"
                                        />
                                        <Slider
                                            min={0.1} max={3} step={0.1}
                                            value={animation.transition?.duration ?? settings.duration}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                transition: { ...animation.transition, duration: val }
                                            })}
                                        />
                                    </div>
                                </div>
                                <div className="controls-field">
                                    <span className="controls-field-label">Delay</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={animation.transition?.delay ?? 0}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                transition: { ...animation.transition, delay: val }
                                            })}
                                            min={0} max={3} step={0.1} unit="s"
                                        />
                                        <Slider
                                            min={0} max={2} step={0.1}
                                            value={animation.transition?.delay ?? 0}
                                            onChange={(val) => updatePathAnimation && updatePathAnimation(selectedPathIndex ?? 0, {
                                                ...animation,
                                                transition: { ...animation.transition, delay: val }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* === MAIN PANEL === */
                        <motion.div
                            key="main-panel"
                            initial={{ x: '-100%', opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: '-100%', opacity: 0 }}
                            transition={{ type: 'tween', duration: 0.2 }}
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
                                <AnimatePresence initial={false}>
                                    {layersOpen && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            style={{ overflow: 'hidden' }}
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
                                                            className={`layer-item ${hoveredPathIndex === index ? 'hovered' : ''} ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''} ${selectedPathIndex === index ? 'selected' : ''}`}
                                                            onMouseEnter={() => setHoveredPathIndex(index)}
                                                            onMouseLeave={() => setHoveredPathIndex(null)}
                                                            onClick={() => onSelectPath && onSelectPath(index)}
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
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Preset Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Preset</span>
                                <div className="controls-field">
                                    <Dropdown
                                        options={[
                                            { label: 'None', value: '' },
                                            ...TRANSFORM_PRESETS.map(p => ({ label: p.name, value: p.id }))
                                        ]}
                                        value={settings.transformPreset || ''}
                                        onChange={(val) => {
                                            if (val) applyPreset(val);
                                            else updateSetting('transformPreset', null);
                                        }}
                                        placeholder="Select a preset..."
                                    />
                                </div>
                            </div>

                            {/* Timing Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Timing</span>

                                <div className="controls-field">
                                    <span className="controls-field-label">Duration</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={settings.duration}
                                            onChange={(val) => updateSetting('duration', val)}
                                            min={0.1} max={5} step={0.1} unit="s"
                                        />
                                        <Slider
                                            min={0.1} max={3} step={0.1}
                                            value={settings.duration}
                                            onChange={(val) => updateSetting('duration', val)}
                                        />
                                    </div>
                                </div>

                                <div className="controls-field">
                                    <span className="controls-field-label">Delay</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={settings.delay}
                                            onChange={(val) => updateSetting('delay', val)}
                                            min={0} max={3} step={0.1} unit="s"
                                        />
                                        <Slider
                                            min={0} max={2} step={0.1}
                                            value={settings.delay}
                                            onChange={(val) => updateSetting('delay', val)}
                                        />
                                    </div>
                                </div>

                                <div className="controls-field">
                                    <span className="controls-field-label">Easing</span>
                                    <div style={{ flex: 1 }}>
                                        <Dropdown
                                            options={[
                                                { label: 'Ease Out', value: 'easeOut' },
                                                { label: 'Ease In', value: 'easeIn' },
                                                { label: 'Ease In Out', value: 'easeInOut' },
                                                { label: 'Linear', value: 'linear' },
                                                { label: 'Spring', value: 'spring' },
                                            ]}
                                            value={settings.easing}
                                            onChange={(val) => updateSetting('easing', val)}
                                        />
                                    </div>
                                </div>

                                {/* Spring params - only show when spring easing selected */}
                                {settings.easing === 'spring' && (
                                    <>
                                        <div className="controls-field">
                                            <span className="controls-field-label">Stiffness</span>
                                            <div className="controls-field-input-group">
                                                <NumberInput
                                                    value={settings.springStiffness ?? 400}
                                                    onChange={(val) => updateSetting('springStiffness', val)}
                                                    min={100} max={1000} step={50}
                                                />
                                                <Slider
                                                    min={100} max={800} step={50}
                                                    value={settings.springStiffness ?? 400}
                                                    onChange={(val) => updateSetting('springStiffness', val)}
                                                />
                                            </div>
                                        </div>
                                        <div className="controls-field">
                                            <span className="controls-field-label">Damping</span>
                                            <div className="controls-field-input-group">
                                                <NumberInput
                                                    value={settings.springDamping ?? 15}
                                                    onChange={(val) => updateSetting('springDamping', val)}
                                                    min={5} max={50} step={1}
                                                />
                                                <Slider
                                                    min={5} max={40} step={1}
                                                    value={settings.springDamping ?? 15}
                                                    onChange={(val) => updateSetting('springDamping', val)}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Stagger Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Stagger</span>

                                <div className="controls-field">
                                    <span className="controls-field-label">Amount</span>
                                    <div className="controls-field-input-group">
                                        <NumberInput
                                            value={settings.staggerAmount}
                                            onChange={(val) => updateSetting('staggerAmount', val)}
                                            min={0} max={1} step={0.05} unit="s"
                                        />
                                        <Slider
                                            min={0} max={0.5} step={0.05}
                                            value={settings.staggerAmount}
                                            onChange={(val) => updateSetting('staggerAmount', val)}
                                        />
                                    </div>
                                </div>

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

                            {/* Trigger Section */}
                            <div className="controls-section">
                                <span className="controls-section-title">Trigger</span>
                                <div className="controls-field">
                                    <Dropdown
                                        options={[
                                            { label: 'Auto (on load)', value: 'auto' },
                                            { label: 'On Hover', value: 'hover' },
                                            { label: 'On Click', value: 'click' },
                                        ]}
                                        value={settings.trigger}
                                        onChange={(val) => updateSetting('trigger', val as TriggerType)}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
